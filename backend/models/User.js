const mongoose = require('mongoose');

/**
 * User Model
 * Stores user information including authentication details and role
 */
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  avatar: {
    type: String,
    default: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    select: false,
    minlength: [6, 'Password must be at least 6 characters']
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);