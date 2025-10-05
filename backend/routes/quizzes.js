const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const User = require('../models/User');

/**
 * @route   GET /api/quizzes
 * @desc    Get all quizzes
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const quizzes = await Quiz.find().populate('course', 'title');
    
    res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/quizzes/:id/publish
 * @desc    Publish a quiz (instructor/admin)
 * @access  Private/Instructor
 */
router.post('/:id/publish', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    const course = await Course.findById(quiz.course);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to publish this quiz' });
    }
    quiz.published = true;
    quiz.publishAt = new Date();
    await quiz.save();
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/quizzes/:id/unpublish
 * @desc    Unpublish a quiz (instructor/admin)
 * @access  Private/Instructor
 */
router.post('/:id/unpublish', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    const course = await Course.findById(quiz.course);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to unpublish this quiz' });
    }
    quiz.published = false;
    await quiz.save();
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/quizzes/:id/results/publish
 * @desc    Publish results for a quiz (instructor/admin)
 * @access  Private/Instructor
 */
router.post('/:id/results/publish', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    const course = await Course.findById(quiz.course);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to publish results for this quiz' });
    }
    quiz.resultsPublished = true;
    await quiz.save();
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/quizzes/:id/results/unpublish
 * @desc    Unpublish results for a quiz (instructor/admin)
 * @access  Private/Instructor
 */
router.post('/:id/results/unpublish', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    const course = await Course.findById(quiz.course);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to unpublish results for this quiz' });
    }
    quiz.resultsPublished = false;
    await quiz.save();
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/quizzes/:id/results
 * @desc    Get results for a quiz. Instructors/Admins see all; students see their own only if resultsPublished.
 * @access  Private
 */
router.get('/:id/results', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
    const course = await Course.findById(quiz.course);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    const isInstructorOrAdmin = (course.instructor.toString() === req.user.id) || (req.user.role === 'admin');

    if (isInstructorOrAdmin) {
      // Aggregate all students' latest attempts
      const progresses = await Progress.find({ course: course._id, 'quizScores.quiz': quiz._id })
        .populate('user', 'name email avatar');
      const rows = [];
      for (const p of progresses) {
        const attempts = (p.quizScores || []).filter(q => q.quiz.toString() === quiz._id.toString());
        if (attempts.length > 0) {
          const latest = attempts.sort((a,b)=> new Date(b.takenAt) - new Date(a.takenAt))[0];
          rows.push({
            user: { _id: p.user._id, name: p.user.name, email: p.user.email, avatar: p.user.avatar },
            score: latest.score,
            totalPoints: latest.totalPoints,
            percentage: latest.percentage,
            takenAt: latest.takenAt
          });
        }
      }
      return res.status(200).json({ success: true, count: rows.length, data: rows, published: quiz.resultsPublished });
    }

    // Student: must be enrolled and results must be published
    const me = await User.findById(req.user.id).select('enrolledCourses');
    const isEnrolled = me && me.enrolledCourses && me.enrolledCourses.some(c => c.toString() === course._id.toString());
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }
    if (!quiz.resultsPublished) {
      return res.status(403).json({ success: false, message: 'Results are not published yet' });
    }
    const myProgress = await Progress.findOne({ user: req.user.id, course: course._id });
    const attempts = (myProgress?.quizScores || []).filter(q => q.quiz.toString() === quiz._id.toString());
    const latest = attempts.length > 0 ? attempts.sort((a,b)=> new Date(b.takenAt) - new Date(a.takenAt))[0] : null;
    return res.status(200).json({ success: true, data: latest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/quizzes/course/:courseId
 * @desc    Get all quizzes for a course
 * @access  Private
 */
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check if user is enrolled in the course or is the instructor or admin
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      // Check enrollment via DB to avoid relying on req.user shape
      const me = await User.findById(req.user.id).select('enrolledCourses');
      const isEnrolled = me && me.enrolledCourses && me.enrolledCourses.some(c => c.toString() === course._id.toString());
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'Not authorized to access quizzes for this course' });
      }
    }
    
    // Students only see published quizzes; instructors/admin see all
    const isInstructorOrAdmin = (course.instructor.toString() === req.user.id) || (req.user.role === 'admin');
    const query = { course: req.params.courseId };
    if (!isInstructorOrAdmin) {
      query.published = true;
    }
    const quizzes = await Quiz.find(query);
    
    res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/quizzes/:id
 * @desc    Get single quiz
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course', 'title instructor');
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Check if user is enrolled in the course or is the instructor or admin
    const course = await Course.findById(quiz.course);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    const isInstructorOrAdmin = (course.instructor.toString() === req.user.id) || (req.user.role === 'admin');
    if (!isInstructorOrAdmin) {
      const me = await User.findById(req.user.id).select('enrolledCourses');
      const isEnrolled = me && me.enrolledCourses && me.enrolledCourses.some(c => c.toString() === course._id.toString());
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this quiz' });
      }
    }
    // Students cannot fetch unpublished quizzes
    if (!isInstructorOrAdmin && !quiz.published) {
      return res.status(403).json({ success: false, message: 'Quiz is not published yet' });
    }
    
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/quizzes
 * @desc    Create new quiz
 * @access  Private/Instructor
 */
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const { title, description, course, questions, timeLimit } = req.body;
    
    // Check if course exists
    const courseExists = await Course.findById(course);
    
    if (!courseExists) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Make sure user is course instructor or admin
    if (courseExists.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add quizzes to this course' });
    }
    
    // Create quiz
    const quiz = await Quiz.create({
      title,
      description,
      course,
      questions,
      timeLimit,
      published: false,
      resultsPublished: false
    });
    
    res.status(201).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/quizzes/:id
 * @desc    Update quiz
 * @access  Private/Instructor
 */
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Check if course exists
    const course = await Course.findById(quiz.course);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this quiz' });
    }
    
    // Update quiz
    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/quizzes/:id
 * @desc    Delete quiz
 * @access  Private/Instructor
 */
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Check if course exists
    const course = await Course.findById(quiz.course);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this quiz' });
    }
    
    // Delete quiz
    await quiz.deleteOne();
    
    res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/quizzes/:id/submit
 * @desc    Submit quiz answers
 * @access  Private
 */
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    // Check if user is enrolled in the course
    const course = await Course.findById(quiz.course);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    const isInstructorOrAdmin = (course.instructor.toString() === req.user.id) || (req.user.role === 'admin');
    if (!isInstructorOrAdmin) {
      const me = await User.findById(req.user.id).select('enrolledCourses');
      const isEnrolled = me && me.enrolledCourses && me.enrolledCourses.some(c => c.toString() === course._id.toString());
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: 'Not authorized to submit this quiz' });
      }
    }
    // Students cannot submit if quiz not published
    if (!isInstructorOrAdmin && !quiz.published) {
      return res.status(403).json({ success: false, message: 'Quiz is not published yet' });
    }
    
    // Calculate score
    const { answers } = req.body;
    let score = 0;
    let totalPoints = 0;
    
    quiz.questions.forEach((question, index) => {
      totalPoints += question.points || 1;
      
      if (question.type === 'multiple-choice') {
        if (answers[index] === question.correctAnswer) {
          score += question.points || 1;
        }
      } else if (question.type === 'true-false') {
        if (answers[index].toString() === question.correctAnswer.toString()) {
          score += question.points || 1;
        }
      }
    });
    
    const percentage = (score / totalPoints) * 100;

    // Save attempt into Progress.quizScores
    let progress = await Progress.findOne({ user: req.user.id, course: course._id });
    if (!progress) {
      progress = await Progress.create({ user: req.user.id, course: course._id, completedMaterials: [] });
    }

    progress.quizScores.push({
      quiz: quiz._id,
      score,
      totalPoints,
      percentage: Math.round(percentage * 100) / 100,
      takenAt: new Date()
    });
    progress.lastAccessed = new Date();
    await progress.save();

    res.status(200).json({
      success: true,
      data: {
        score,
        totalPoints,
        percentage: Math.round(percentage * 100) / 100
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;