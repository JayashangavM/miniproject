import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import Profile from './pages/Profile';
import CourseCreate from './pages/CourseCreate';
import QuizTake from './pages/QuizTake';
import InstructorCourseStudents from './pages/InstructorCourseStudents';
import InstructorQuizCreate from './pages/InstructorQuizCreate';
import InstructorQuizList from './pages/InstructorQuizList';
import InstructorQuizResults from './pages/InstructorQuizResults';
import StudentQuizResult from './pages/StudentQuizResult';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/courses/create" element={<CourseCreate />} />
            <Route path="/quiz/:id" element={<QuizTake />} />
            <Route path="/instructor/course/:id/quiz/new" element={<InstructorQuizCreate />} />
            <Route path="/instructor/course/:id/quizzes" element={<InstructorQuizList />} />
            <Route path="/instructor/quiz/:id/results" element={<InstructorQuizResults />} />
            <Route path="/quiz/:id/result" element={<StudentQuizResult />} />
            <Route path="/instructor/course/:id/students" element={<InstructorCourseStudents />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;