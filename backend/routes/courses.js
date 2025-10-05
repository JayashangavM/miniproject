const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/courses
 * @desc    Get all courses
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Build query
    const query = {};
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by search term if provided
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Execute query
    const courses = await Course.find(query).populate('instructor', 'name avatar');
    
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/courses/:id/students
 * @desc    Get students enrolled in a course with progress (instructor/admin only)
 * @access  Private/Instructor
 */
router.get('/:id/students', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Ensure requester is instructor of the course or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view students of this course' });
    }

    // Find students enrolled in this course
    const students = await User.find({ enrolledCourses: course._id, role: { $in: ['student', 'instructor', 'admin'] } })
      .select('name email avatar role enrolledCourses')
      .populate('enrolledCourses', 'title');

    // Fetch progress for these students in one go
    const progresses = await Progress.find({ course: course._id, user: { $in: students.map(s => s._id) } })
      .select('user percentComplete updatedAt lastAccessed');
    const progMap = new Map(progresses.map(p => [p.user.toString(), p]));

    const data = students.map(s => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      avatar: s.avatar,
      role: s.role,
      percentComplete: (progMap.get(s._id.toString())?.percentComplete) || 0,
      lastAccessed: progMap.get(s._id.toString())?.lastAccessed || null,
      updatedAt: progMap.get(s._id.toString())?.updatedAt || null,
      completed: (progMap.get(s._id.toString())?.percentComplete || 0) >= 100,
      enrolledCourses: (s.enrolledCourses || []).map(c => ({ _id: c._id, title: c.title }))
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar')
      .populate('materials', 'title description fileUrl fileType');
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/courses
 * @desc    Create new course
 * @access  Private/Instructor
 */
router.post('/', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    // Add instructor to req.body
    req.body.instructor = req.user.id;
    
    const course = await Course.create(req.body);
    
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Private/Instructor
 */
router.put('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
    }
    
    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private/Instructor
 */
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }
    
    await course.deleteOne();
    
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll in course
 * @access  Private/Student
 */
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Check if user is already enrolled
    const user = await User.findById(req.user.id);
    
    if (user.enrolledCourses.includes(course._id)) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }
    
    // Add course to user's enrolled courses
    user.enrolledCourses.push(course._id);
    await user.save();
    
    res.status(200).json({ success: true, message: 'Successfully enrolled in course' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;