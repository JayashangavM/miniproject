const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  questions: [{
    question: {
      type: String,
      required: [true, 'Please add a question']
    },
    options: [{
      type: String
    }],
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Please provide the correct answer']
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer'],
      default: 'multiple-choice'
    },
    points: {
      type: Number,
      default: 1
    }
  }],
  timeLimit: {
    type: Number, // Time limit in minutes
    default: 30
  },
  published: {
    type: Boolean,
    default: false
  },
  resultsPublished: {
    type: Boolean,
    default: false
  },
  publishAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);