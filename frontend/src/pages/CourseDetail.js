import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, enrollCourse } from '../redux/slices/courseSlice';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Rating,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material';
import {
  School,
  AccessTime,
  CheckCircle,
  Person,
  CalendarToday,
  Assignment,
  PlayCircleOutline,
  Check,
  Delete
} from '@mui/icons-material';
import { getProgressByCourse, completeMaterial } from '../redux/slices/progressSlice';
import { addEnrollment, getCurrentUser } from '../redux/slices/authSlice';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { course, loading, error, enrollSuccess } = useSelector(state => state.courses);
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const progress = useSelector(state => state.progress.byCourse[id]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { token } = useSelector(state => state.auth);

  // Add Material dialog state
  const [openAdd, setOpenAdd] = useState(false);
  const [matForm, setMatForm] = useState({ title: '', description: '', fileType: 'document', fileUrl: '' });
  const [matFile, setMatFile] = useState(null);
  const [matLoading, setMatLoading] = useState(false);
  const [matError, setMatError] = useState('');
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
  const [quizzes, setQuizzes] = useState([]);
  const [enrollToastOpen, setEnrollToastOpen] = useState(false);

  useEffect(() => {
    dispatch(getCourse(id));
    if (isAuthenticated && id) {
      dispatch(getProgressByCourse(id));
    }
    // Load quizzes for this course (students see only published)
    const loadQuizzes = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await axios.get(`/api/quizzes/course/${id}`, headers ? { headers } : undefined);
        setQuizzes(res.data?.data || []);
      } catch (e) {
        // ignore silently
      }
    };
    if (id) loadQuizzes();
  }, [dispatch, id, isAuthenticated, token]);

  // Check enrollment status from both local state and Redux auth state
  useEffect(() => {
    if (user?.enrolledCourses?.includes(id)) {
      setIsEnrolled(true);
    } else if (enrollSuccess) {
      // Fallback to enrollSuccess from Redux if needed
      setIsEnrolled(true);
    } else {
      setIsEnrolled(false);
    }
  }, [user, id, enrollSuccess]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      const action = await dispatch(enrollCourse(id));
      if (!action.error) {
        // Force refresh the user data to get updated enrolledCourses
        await dispatch(getCurrentUser());
        setEnrollToastOpen(true);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const handleCompleteCourse = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/progress/course/${id}/complete`, {}, { headers });
      dispatch(getProgressByCourse(id));
    } catch (e) {
      // noop - could show toast
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!token) return;
    if (!window.confirm('Delete this material?')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/materials/${materialId}`, { headers });
      dispatch(getCourse(id));
      dispatch(getProgressByCourse(id));
      // Load quizzes for this course
      const loadQuizzes = async () => {
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
          const res = await axios.get(`/api/quizzes/course/${id}`, headers ? { headers } : undefined);
          setQuizzes(res.data?.data || []);
        } catch (e) {
          // ignore silently
        }
      };
      loadQuizzes();
    } catch (e) {
      // noop
    }
  };

  const handleDeleteCourse = async () => {
    if (!token) return;
    if (!window.confirm('Delete this course? This cannot be undone.')) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`/api/courses/${id}`, { headers });
      navigate('/courses');
    } catch (e) {
      // noop
    }
  };

  const canEdit = user && (user.role === 'admin' || (course?.instructor?._id === user.id || course?.instructor === user.id));

  const handleOpenAdd = () => {
    setMatForm({ title: '', description: '', fileType: 'document', fileUrl: '' });
    setMatFile(null);
    setMatError('');
    setOpenAdd(true);
  };

  const handleCreateMaterial = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!matForm.title) {
      setMatError('Title is required');
      return;
    }
    setMatLoading(true);
    setMatError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (matFile) {
        const form = new FormData();
        form.append('file', matFile);
        form.append('title', matForm.title);
        form.append('description', matForm.description);
        form.append('fileType', matForm.fileType);
        form.append('course', id);
        await axios.post('/api/materials', form, { headers });
      } else {
        // Use fileUrl path
        await axios.post('/api/materials', { ...matForm, course: id }, { headers });
      }
      setOpenAdd(false);
      dispatch(getCourse(id));
    } catch (e) {
      setMatError(e.response?.data?.message || 'Failed to add material');
    } finally {
      setMatLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">Course not found</Alert>
      </Container>
    );
  }

  const courseDetails = {
    ...course,
    duration: `${course?.materials?.length || 0} items`,
    instructor: {
      name: course.instructor?.name || 'Instructor',
      bio: 'Experienced instructor with industry background.',
      avatar: course.instructor?.avatar || 'https://source.unsplash.com/random?person'
    },
    requirements: [
      'Basic understanding of the subject',
      'Computer with internet connection',
      'Dedication to learn'
    ]
  };

  const percentComplete = progress?.percentComplete || 0;
  const completedSet = new Set((progress?.completedMaterials || []).map(m => m.toString ? m.toString() : m));

  const handleMarkComplete = async (materialId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    dispatch(completeMaterial(materialId)).then(() => {
      dispatch(getProgressByCourse(id));
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Grid container spacing={4}>
        {/* Course Main Content */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h4" gutterBottom>
              {courseDetails.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating 
                value={courseDetails.rating || 4.5} 
                precision={0.5} 
                readOnly 
              />
              <Typography variant="body2" sx={{ ml: 1 }}>
                ({courseDetails.reviews?.length || 12} reviews)
              </Typography>
              <Chip 
                icon={<School />} 
                label={courseDetails.level || 'Intermediate'} 
                size="small" 
                color="primary" 
                sx={{ ml: 2 }} 
              />
            </Box>
            
            <Typography variant="body1" paragraph>
              {courseDetails.description}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <LinearProgress variant="determinate" value={percentComplete} sx={{ height: 10, borderRadius: 5 }} />
                </Box>
                <Typography variant="body2" color="text.secondary">{percentComplete}%</Typography>
                {/* Student quick complete */}
                {isAuthenticated && !canEdit && (
                  <Button size="small" variant="outlined" onClick={handleCompleteCourse}>
                    Complete Course
                  </Button>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" gutterBottom>
                  Course Content
                </Typography>
                {canEdit && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" onClick={handleOpenAdd}>Add Material</Button>
                    <Button variant="outlined" color="secondary" onClick={() => navigate(`/instructor/course/${id}/quiz/new`)}>Create Quiz</Button>
                    <Button variant="outlined" onClick={() => navigate(`/instructor/course/${id}/quizzes`)}>Manage Quizzes</Button>
                  </Box>
                )}
              </Box>
              {canEdit && (
                <Box sx={{ mb: 2 }} />
              )}
              <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                {(course?.materials || []).map((m, index) => {
                  const isCompleted = completedSet.has(m._id);
                  const isVideo = m.fileType === 'video';
                  return (
                    <React.Fragment key={m._id}>
                      <ListItem secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {!isCompleted && (
                            <Tooltip title="Mark as completed">
                              <IconButton color="success" onClick={() => handleMarkComplete(m._id)}>
                                <Check />
                              </IconButton>
                            </Tooltip>
                          )}
                          {isCompleted && (
                            <Chip size="small" color="success" icon={<CheckCircle />} label="Completed" />
                          )}
                          {canEdit && (
                            <Tooltip title="Delete material">
                              <IconButton color="error" onClick={() => handleDeleteMaterial(m._id)}>
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }>
                        <ListItemIcon>
                          {isVideo ? <PlayCircleOutline color="primary" /> : <Assignment color="primary" />}
                        </ListItemIcon>
                        <ListItemText 
                          primary={`${index + 1}. ${m.title}`} 
                          secondary={
                            <Box>
                              {m.description && <Typography variant="caption" color="text.secondary">{m.description}</Typography>}
                              <Box>
                                {isVideo ? (
                                  <Box sx={{ mt: 1 }}>
                                    <video width="100%" height="auto" controls src={m.fileUrl?.startsWith('http') ? m.fileUrl : `${API_BASE}${m.fileUrl}`} style={{ borderRadius: 8 }} />
                                  </Box>
                                ) : (
                                  <Link href={m.fileUrl?.startsWith('http') ? m.fileUrl : `${API_BASE}${m.fileUrl}`} target="_blank" rel="noopener" underline="hover">Open material</Link>
                                )}
                              </Box>
                            </Box>
                          } 
                        />
                      </ListItem>
                      {index < (course?.materials?.length || 0) - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  );
                })}
                {(!course?.materials || course.materials.length === 0) && (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">No materials added yet.</Typography>
                  </Box>
                )}
              </List>

              {/* Student Quizzes */}
              {!canEdit && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>Quizzes</Typography>
                  {quizzes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No quizzes available yet.</Typography>
                  ) : (
                    <List>
                      {quizzes.map((q) => (
                        <ListItem key={q._id} secondaryAction={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip size="small" label={q.resultsPublished ? 'Results Published' : 'Results Pending'} color={q.resultsPublished ? 'success' : 'default'} />
                            <Button variant="outlined" size="small" onClick={() => navigate(`/quiz/${q._id}`)}>Start Quiz</Button>
                            <Button variant="outlined" size="small" disabled={!q.resultsPublished} onClick={() => navigate(`/quiz/${q._id}/result`)}>View Results</Button>
                          </Box>
                        }>
                          <ListItemText primary={q.title} secondary={q.description} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="h6" gutterBottom>
                Requirements
              </Typography>
              <List>
                {courseDetails.requirements.map((req, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={req} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>
        
        {/* Course Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: { md: 'sticky' }, top: { md: 20 } }}>
            {/* Course Card */}
            <Card elevation={3} sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {courseDetails.price ? `$${courseDetails.price.toFixed(2)}` : 'Free'}
                  </Typography>
                </Box>
                
                {!canEdit && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleEnroll}
                    disabled={isEnrolled}
                    sx={{ mb: 2 }}
                  >
                    {isEnrolled ? 'Already Enrolled' : 'Enroll Now'}
                  </Button>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    This course includes:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <AccessTime fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={`${courseDetails.duration} of content`} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <Assignment fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={`${(course?.materials?.length || 0)} items`} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CalendarToday fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Lifetime access" />
                    </ListItem>
                  </List>
                  {canEdit && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button variant="outlined" color="error" onClick={handleDeleteCourse}>Delete Course</Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
            
            {/* Instructor Card */}
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Instructor
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    src={courseDetails.instructor.avatar} 
                    alt={courseDetails.instructor.name}
                    sx={{ width: 56, height: 56, mr: 2 }}
                  />
                  <Box>
                    <Typography variant="subtitle1">
                      {courseDetails.instructor.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Person fontSize="small" sx={{ mr: 0.5 }} color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Instructor
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {courseDetails.instructor.bio}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Add Material Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Material</DialogTitle>
        <DialogContent dividers>
          {matError && (<Alert severity="error" sx={{ mb: 2 }}>{matError}</Alert>)}
          <TextField label="Title" fullWidth sx={{ mb: 2 }} value={matForm.title} onChange={(e)=>setMatForm({...matForm, title: e.target.value})} />
          <TextField label="Description" fullWidth multiline rows={3} sx={{ mb: 2 }} value={matForm.description} onChange={(e)=>setMatForm({...matForm, description: e.target.value})} />
          <TextField select label="File Type" fullWidth sx={{ mb: 2 }} value={matForm.fileType} onChange={(e)=>setMatForm({...matForm, fileType: e.target.value})}>
            {['document','video','image','audio','other'].map(t=> (<MenuItem key={t} value={t}>{t}</MenuItem>))}
          </TextField>
          <Box sx={{ display:'flex', gap:2, alignItems:'center', mb:2 }}>
            <Button variant="outlined" component="label">
              {matFile ? 'Change File' : 'Upload File'}
              <input type="file" hidden onChange={(e)=> setMatFile(e.target.files?.[0] || null)} />
            </Button>
            <Typography variant="body2" color="text.secondary">or</Typography>
            <TextField label="File URL" fullWidth value={matForm.fileUrl} onChange={(e)=>setMatForm({...matForm, fileUrl: e.target.value})} />
          </Box>
          <Typography variant="caption" color="text.secondary">Max 10MB for uploads. For larger videos, consider using a hosted URL.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleCreateMaterial} disabled={matLoading} variant="contained">{matLoading ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
      {/* Enroll success toast */}
      <Snackbar
        open={enrollToastOpen}
        autoHideDuration={3000}
        onClose={() => setEnrollToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setEnrollToastOpen(false)} severity="success" sx={{ width: '100%' }}>
          Course has been enrolled
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseDetail;