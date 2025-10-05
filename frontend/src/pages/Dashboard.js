import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Divider
} from '@mui/material';
import { School, Book, Assignment, Person, PeopleAlt, EmojiEvents, TrendingUp } from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useSelector(state => state.auth);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [teachingCourses, setTeachingCourses] = useState([]);
  const [studentStats, setStudentStats] = useState({ completedCourses: 0, upcomingQuizzes: 0 });
  const [instructorStats, setInstructorStats] = useState({ totalStudents: 0, studentsCompleted: 0, avgProgress: 0 });

  useEffect(() => {
    // Redirect if not logged in
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [enrolledRes, teachingRes, progressRes] = await Promise.all([
          axios.get('/api/profile/courses', config),
          axios.get('/api/profile/courses/teaching', config).catch(() => ({ data: { data: [] } })),
          axios.get('/api/progress', config).catch(() => ({ data: { data: [] } }))
        ]);
        setEnrolledCourses(enrolledRes.data.data || []);
        setTeachingCourses(teachingRes.data.data || []);
        // Compute completed courses for student
        const progress = progressRes.data.data || [];
        const completed = progress.filter(p => Number(p.percentComplete) >= 100).length;
        setStudentStats((s) => ({ ...s, completedCourses: completed }));
      } catch (e) {
        // swallow for dashboard
      }
    };
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, token]);

  // Compute instructor aggregate stats
  useEffect(() => {
    const computeInstructorStats = async () => {
      if (!token || !user || user.role !== 'instructor') return;
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const results = await Promise.all(
          (teachingCourses || []).map((c) => axios.get(`/api/courses/${c._id}/students`, { headers }).then(r => r.data.data).catch(() => []))
        );
        const flat = results.flat();
        const totalStudents = flat.length;
        const studentsCompleted = flat.filter(s => s.completed).length;
        const avgProgress = totalStudents > 0 ? Math.round(flat.reduce((sum, s) => sum + (s.percentComplete || 0), 0) / totalStudents) : 0;
        setInstructorStats({ totalStudents, studentsCompleted, avgProgress });
      } catch (e) {
        setInstructorStats({ totalStudents: 0, studentsCompleted: 0, avgProgress: 0 });
      }
    };
    computeInstructorStats();
  }, [teachingCourses, token, user]);

  const stats = {
    enrolledCourses: enrolledCourses.length,
    completedCourses: studentStats.completedCourses,
    upcomingQuizzes: studentStats.upcomingQuizzes,
    recentActivities: []
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {user && (
        <>
          <Typography variant="h4" gutterBottom>
            Welcome, {user.name}!
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" paragraph>
            Here's an overview of your learning journey
          </Typography>

          {/* Top Banners */}
          {user.role === 'instructor' ? (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', borderRadius: 2 }}>
                  <PeopleAlt fontSize="large" color="primary" style={{ marginRight: 16 }} />
                  <Box>
                    <Typography variant="h5">{instructorStats.totalStudents}</Typography>
                    <Typography color="text.secondary">Students Enrolled</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', borderRadius: 2 }}>
                  <EmojiEvents fontSize="large" color="success" style={{ marginRight: 16 }} />
                  <Box>
                    <Typography variant="h5">{instructorStats.studentsCompleted}</Typography>
                    <Typography color="text.secondary">Students Completed</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={2} sx={{ p: 3, display: 'flex', alignItems: 'center', borderRadius: 2 }}>
                  <TrendingUp fontSize="large" color="warning" style={{ marginRight: 16 }} />
                  <Box>
                    <Typography variant="h5">{instructorStats.avgProgress}%</Typography>
                    <Typography color="text.secondary">Average Progress</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                  <School fontSize="large" color="primary" />
                  <Typography variant="h5" sx={{ mt: 2 }}>{stats.enrolledCourses}</Typography>
                  <Typography variant="body1" color="text.secondary">Enrolled Courses</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                  <Book fontSize="large" color="success" />
                  <Typography variant="h5" sx={{ mt: 2 }}>{stats.completedCourses}</Typography>
                  <Typography variant="body1" color="text.secondary">Completed Courses</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                  <Assignment fontSize="large" color="warning" />
                  <Typography variant="h5" sx={{ mt: 2 }}>{stats.upcomingQuizzes}</Typography>
                  <Typography variant="body1" color="text.secondary">Upcoming Quizzes</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 2 }}>
                  <Person fontSize="large" color="info" />
                  <Typography variant="h5" sx={{ mt: 2 }}>Profile</Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => navigate('/profile')}>View Profile</Button>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Recent Activity and Quick Actions */}
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {stats.recentActivities.map((activity) => (
                  <Box key={activity.id} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1">
                      {activity.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.type === 'course_enrollment' && 'Enrolled in course'}
                      {activity.type === 'quiz_completion' && 'Completed quiz'}
                      {activity.type === 'course_progress' && 'Made progress in course'}
                      {' • '}
                      {activity.date}
                    </Typography>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-around',
                  flexWrap: 'wrap'
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ m: 1, px: 2, py: 1, height: 40, minWidth: 160 }}
                  component={RouterLink}
                  to="/courses"
                >
                  Browse Courses
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  sx={{ m: 1, px: 2, py: 1, height: 40, minWidth: 160 }}
                  component={RouterLink}
                  to="/profile"
                >
                  Update Profile
                </Button>
                {user.role === 'instructor' && (
                  <Box sx={{ m: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ mb: 1 }}
                      component={RouterLink}
                      to="/courses/create"
                    >
                      Create Course
                    </Button>
                    {teachingCourses.map((c) => (
                      <Box key={c._id} sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">{c.title}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Button size="small" component={RouterLink} to={`/courses/${c._id}`}>Open</Button>
                          <Button size="small" variant="outlined" component={RouterLink} to={`/instructor/course/${c._id}/students`}>View Students</Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Dashboard;