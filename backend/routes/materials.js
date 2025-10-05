const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Set up multer storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept all file types for now
  cb(null, true);
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: fileFilter
});

/**
 * @route   GET /api/materials
 * @desc    Get all materials
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const materials = await Material.find().populate('course', 'title');
    
    res.status(200).json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   GET /api/materials/:id
 * @desc    Get single material
 * @access  Private
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).populate('course', 'title instructor');
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    
    // Check if user is enrolled in the course or is the instructor or admin
    const course = await Course.findById(material.course);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Allow access if user is instructor, admin, or enrolled in the course
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      !req.user.enrolledCourses.includes(course._id)
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this material' });
    }
    
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   POST /api/materials
 * @desc    Create new material
 * @access  Private/Instructor
 */
router.post('/', protect, authorize('instructor', 'admin'), upload.single('file'), async (req, res) => {
  try {
    const { title, description, fileType, course } = req.body;
    
    // Check if course exists
    const courseExists = await Course.findById(course);
    
    if (!courseExists) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Make sure user is course instructor or admin
    if (courseExists.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to add materials to this course' });
    }
    
    // Create material
    const material = await Material.create({
      title,
      description,
      fileType,
      course,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : req.body.fileUrl
    });
    
    // Add material to course
    courseExists.materials.push(material._id);
    await courseExists.save();
    
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   PUT /api/materials/:id
 * @desc    Update material
 * @access  Private/Instructor
 */
router.put('/:id', protect, authorize('instructor', 'admin'), upload.single('file'), async (req, res) => {
  try {
    let material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    
    // Check if course exists
    const course = await Course.findById(material.course);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this material' });
    }
    
    // Update material
    const updateData = {
      title: req.body.title || material.title,
      description: req.body.description || material.description,
      fileType: req.body.fileType || material.fileType
    };
    
    // Update file if provided
    if (req.file) {
      updateData.fileUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.fileUrl) {
      updateData.fileUrl = req.body.fileUrl;
    }
    
    material = await Material.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete material
 * @access  Private/Instructor
 */
router.delete('/:id', protect, authorize('instructor', 'admin'), async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    
    // Check if course exists
    const course = await Course.findById(material.course);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Make sure user is course instructor or admin
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this material' });
    }
    
    // Remove material from course
    course.materials = course.materials.filter(
      (id) => id.toString() !== material._id.toString()
    );
    await course.save();
    
    // Delete material
    await material.deleteOne();
    
    res.status(200).json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;