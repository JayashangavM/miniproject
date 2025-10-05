import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Divider,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Chip
} from '@mui/material';
import { PhotoCamera, Save, School } from '@mui/icons-material';

const Profile = () => {
  const { user, loading, isAuthenticated, token } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Real data for enrolled and teaching courses
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [teachingCourses, setTeachingCourses] = useState([]);
  const [coursesError, setCoursesError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setProfileData(prevData => ({
        ...prevData,
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [enrolledRes, teachingRes] = await Promise.all([
          axios.get('/api/profile/courses', { headers }),
          axios.get('/api/profile/courses/teaching', { headers }).catch(() => ({ data: { data: [] } }))
        ]);
        setEnrolledCourses(enrolledRes.data.data || []);
        setTeachingCourses((user?.role === 'instructor') ? (teachingRes.data.data || []) : []);
      } catch (e) {
        setCoursesError(e.response?.data?.message || 'Failed to load courses');
      }
    };
    load();
  }, [isAuthenticated, user, token]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    
    // Clear password error when typing in password fields
    if (['newPassword', 'confirmPassword'].includes(e.target.name)) {
      setPasswordError('');
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    
    // Validate passwords if trying to change password
    if (profileData.newPassword) {
      if (profileData.newPassword !== profileData.confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      if (profileData.newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
    }
    
    // Mock successful update
    setTimeout(() => {
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }, 1000);
    
    // In a real app, dispatch an action to update profile
    // dispatch(updateProfile(profileData));
  };

  const handleAvatarUpload = (e) => {
    // In a real app, dispatch an action to upload avatar
    // const file = e.target.files[0];
    // if (file) {
    //   dispatch(uploadAvatar(file));
    // }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {user && (
        <Grid container spacing={4}>
          {/* Profile Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  sx={{ width: 120, height: 120, mb: 2 }}
                  className="profile-avatar"
                />
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  Change Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </Button>
                <Typography variant="h5" gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {user.email}
                </Typography>
                <Chip 
                  icon={<School />} 
                  label={user.role === 'instructor' ? 'Instructor' : 'Student'} 
                  color="primary" 
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Box>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Member since
                </Typography>
                <Typography variant="body2">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ borderRadius: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Edit Profile" />
                <Tab label="My Courses" />
                {user.role === 'instructor' && <Tab label="Teaching" />}
              </Tabs>
              
              <Box sx={{ p: 3 }}>
                {/* Edit Profile Tab */}
                {tabValue === 0 && (
                  <Box component="form" onSubmit={handleProfileUpdate}>
                    {updateSuccess && (
                      <Alert severity="success" sx={{ mb: 3 }}>
                        Profile updated successfully!
                      </Alert>
                    )}
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                          Personal Information
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          name="name"
                          value={profileData.name}
                          onChange={handleChange}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          value={profileData.email}
                          onChange={handleChange}
                          disabled
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Bio"
                          name="bio"
                          value={profileData.bio}
                          onChange={handleChange}
                          multiline
                          rows={4}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Change Password
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          name="currentPassword"
                          type="password"
                          value={profileData.currentPassword}
                          onChange={handleChange}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          name="newPassword"
                          type="password"
                          value={profileData.newPassword}
                          onChange={handleChange}
                          error={!!passwordError}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          name="confirmPassword"
                          type="password"
                          value={profileData.confirmPassword}
                          onChange={handleChange}
                          error={!!passwordError}
                          helperText={passwordError}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sx={{ mt: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          startIcon={<Save />}
                        >
                          Save Changes
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
                
                {/* My Courses Tab */}
                {tabValue === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Enrolled Courses
                    </Typography>
                    
                    {enrolledCourses.length > 0 ? (
                      <Grid container spacing={3}>
                        {enrolledCourses.map(course => (
                          <Grid item xs={12} key={course._id}>
                            <Card 
                              sx={{ 
                                display: 'flex', 
                                mb: 2,
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 6 }
                              }}
                              component={RouterLink}
                              to={`/courses/${course._id}`}
                              style={{ textDecoration: 'none' }}
                            >
                              <CardMedia
                                component="img"
                                sx={{ width: 120 }}
                                image={`https://source.unsplash.com/random?education&sig=${course._id}`}
                                alt={course.title}
                              />
                              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                <CardContent sx={{ flex: '1 0 auto' }}>
                                  <Typography component="div" variant="h6">
                                    {course.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                                      Category: {course.category} • Level: {course.level}
                                    </Typography>
                                  </Box>
                                </CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, pb: 2 }}>
                                  <Button size="small" variant="outlined" component={RouterLink} to={`/courses/${course._id}`}>
                                    Continue Learning
                                  </Button>
                                </Box>
                              </Box>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography variant="body1" color="textSecondary">
                        You are not enrolled in any courses yet.
                      </Typography>
                    )}
                  </Box>
                )}
                
                {/* Teaching Tab */}
                {tabValue === 2 && user.role === 'instructor' && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        Courses You Teach
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary"
                        component={RouterLink}
                        to="/courses/create"
                      >
                        Create New Course
                      </Button>
                    </Box>
                    
                    {teachingCourses.length > 0 ? (
                      <List>
                        {teachingCourses.map(course => (
                          <Paper key={course._id} sx={{ mb: 2, p: 2, borderRadius: 2 }}>
                            <ListItem 
                              sx={{ px: 0 }}
                              button
                              component={RouterLink}
                              to={`/courses/${course._id}`}
                            >
                              <ListItemText
                                primary={course.title}
                                secondary={`${course.students} students enrolled`}
                              />
                              <Button 
                                variant="outlined" 
                                size="small"
                                component={RouterLink}
                                to={`/courses/edit/${course._id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Edit Course
                              </Button>
                            </ListItem>
                          </Paper>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body1" color="textSecondary">
                        You are not teaching any courses yet.
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default Profile;