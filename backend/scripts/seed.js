require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Course = require('../models/Course');
const Material = require('../models/Material');

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    // Upsert instructor user
    const email = 'instructor@demo.com';
    const name = 'Demo Instructor';
    const password = 'password123';

    let user = await User.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      user = await User.create({ name, email, password: hash, role: 'instructor' });
      console.log('Created demo instructor:', email, 'password:', password);
    } else {
      console.log('Demo instructor already exists:', email);
    }

    // Create demo courses
    const demoCourses = [
      {
        title: 'Web Development Fundamentals',
        description: 'Learn the basics of HTML, CSS, and JavaScript to build modern web pages.',
        category: 'Web Development',
        level: 'Beginner',
        price: 0,
        isFree: true,
        rating: 1,
        thumbnail: 'https://source.unsplash.com/random?web',
        instructor: user._id,
      },
      {
        title: 'React for Beginners',
        description: 'Start building interactive user interfaces with React and modern tooling.',
        category: 'Web Development',
        level: 'Beginner',
        price: 0,
        isFree: true,
        rating: 1,
        thumbnail: 'https://source.unsplash.com/random?react',
        instructor: user._id,
      },
      {
        title: 'Data Science 101',
        description: 'An introduction to data science concepts, Python libraries, and visualization.',
        category: 'Data Science',
        level: 'Beginner',
        price: 0,
        isFree: true,
        rating: 1,
        thumbnail: 'https://source.unsplash.com/random?data',
        instructor: user._id,
      },
    ];

    const createdCourses = [];
    for (const c of demoCourses) {
      let exists = await Course.findOne({ title: c.title, instructor: user._id });
      if (!exists) {
        exists = await Course.create(c);
        console.log('Created course:', exists.title);
      } else {
        console.log('Course already exists:', exists.title);
      }
      createdCourses.push(exists);
    }

    // Add a couple of materials to the first course
    const first = createdCourses[0];
    if (first) {
      const existingMaterials = await Material.find({ course: first._id });
      if (existingMaterials.length === 0) {
        const mat1 = await Material.create({
          title: 'Course Introduction',
          description: 'Welcome to the course! Watch the intro video.',
          fileUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          fileType: 'video',
          course: first._id,
        });
        const mat2 = await Material.create({
          title: 'Syllabus (PDF)',
          description: 'Download the course syllabus.',
          fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          fileType: 'document',
          course: first._id,
        });
        first.materials.push(mat1._id, mat2._id);
        await first.save();
        console.log('Added demo materials to:', first.title);
      } else {
        console.log('Materials already exist for:', first.title);
      }
    }

    // Create a demo student and enroll them in the first course for dashboard data
    const studentEmail = 'student@demo.com';
    const studentName = 'Demo Student';
    const studentPassword = 'password123';
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(studentPassword, salt);
      student = await User.create({ name: studentName, email: studentEmail, password: hash, role: 'student' });
      console.log('Created demo student:', studentEmail, 'password:', studentPassword);
    } else {
      console.log('Demo student already exists:', studentEmail);
    }
    if (first && !student.enrolledCourses.includes(first._id)) {
      student.enrolledCourses.push(first._id);
      await student.save();
      console.log('Enrolled demo student in:', first.title);
    }

    console.log('Seeding complete.');
  } catch (e) {
    console.error('Seed error:', e);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run();
