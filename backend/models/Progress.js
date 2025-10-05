const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  completedMaterials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  quizScores: [{
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    totalPoints: Number,
    percentage: Number,
    takenAt: { type: Date, default: Date.now }
  }],
  percentComplete: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

ProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
