const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const Material = require('../models/Material');

/**
 * @route   GET /api/progress
 * @desc    Get all progress records for current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const progress = await Progress.find({ user: req.user.id })
      .populate('course', 'title thumbnail')
      .select('-quizScores');

    res.status(200).json({ success: true, count: progress.length, data: progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/progress/course/:courseId/complete
 * @desc    Mark all materials as completed for current user in a course
 * @access  Private
 */
router.post('/course/:courseId/complete', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).populate('materials', '_id');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let progress = await Progress.findOne({ user: req.user.id, course: courseId });
    if (!progress) {
      progress = await Progress.create({ user: req.user.id, course: courseId, completedMaterials: [] });
    }

    const allMaterialIds = (course.materials || []).map((m) => m._id);
    progress.completedMaterials = allMaterialIds;
    // Mark course complete regardless of material count
    progress.percentComplete = 100;
    progress.lastAccessed = new Date();
    await progress.save();

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/progress/course/:courseId
 * @desc    Get progress for current user in a specific course
 * @access  Private
 */
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate('materials', '_id');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let progress = await Progress.findOne({ user: req.user.id, course: courseId });
    if (!progress) {
      // create an empty progress doc for convenience
      progress = await Progress.create({ user: req.user.id, course: courseId, completedMaterials: [], percentComplete: 0 });
    }

    // Compute percent based on materials count
    const totalMaterials = course.materials?.length || 0;
    const completed = progress.completedMaterials?.length || 0;
    // If no materials, retain any explicit completion (e.g., via course complete action)
    const percentComplete = totalMaterials > 0 ? Math.min(100, Math.round((completed / totalMaterials) * 100)) : progress.percentComplete;

    if (progress.percentComplete !== percentComplete) {
      progress.percentComplete = percentComplete;
      progress.lastAccessed = new Date();
      await progress.save();
    }

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/progress/material/:materialId/complete
 * @desc    Mark a material as completed by current user and update percent
 * @access  Private
 */
router.post('/material/:materialId/complete', protect, async (req, res) => {
  try {
    const { materialId } = req.params;
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    const course = await Course.findById(material.course).populate('materials', '_id');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let progress = await Progress.findOne({ user: req.user.id, course: course._id });
    if (!progress) {
      progress = await Progress.create({ user: req.user.id, course: course._id, completedMaterials: [] });
    }

    const exists = progress.completedMaterials.some((id) => id.toString() === material._id.toString());
    if (!exists) {
      progress.completedMaterials.push(material._id);
    }

    const totalMaterials = course.materials?.length || 0;
    const completed = progress.completedMaterials?.length || 0;
    progress.percentComplete = totalMaterials > 0 ? Math.min(100, Math.round((completed / totalMaterials) * 100)) : 0;
    progress.lastAccessed = new Date();
    await progress.save();

    res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
