import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';

const InstructorQuizList = () => {
  const { id: courseId } = useParams();
  const { token } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [courseRes, quizRes] = await Promise.all([
        axios.get(`/api/courses/${courseId}`),
        axios.get(`/api/quizzes/course/${courseId}`, { headers })
      ]);
      setCourseTitle(courseRes.data?.data?.title || 'Course');
      setQuizzes(quizRes.data?.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [courseId, token]);

  const togglePublish = async (quizId, published) => {
    try {
      setError('');
      if (published) {
        await axios.post(`/api/quizzes/${quizId}/unpublish`, {}, { headers });
      } else {
        await axios.post(`/api/quizzes/${quizId}/publish`, {}, { headers });
      }
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update publish state');
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz? This action cannot be undone.')) return;
    try {
      setError('');
      await axios.delete(`/api/quizzes/${quizId}`, { headers });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete quiz');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Quizzes • {courseTitle}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button component={RouterLink} to={`/instructor/course/${courseId}/quiz/new`} variant="contained">Create Quiz</Button>
            <Button component={RouterLink} to={`/courses/${courseId}`} variant="outlined">Back to Course</Button>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
        ) : quizzes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No quizzes yet.</Typography>
        ) : (
          <List>
            {quizzes.map((q) => (
              <ListItem key={q._id} secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={q.published ? 'Published' : 'Draft'} color={q.published ? 'success' : 'default'} size="small" />
                  <Button size="small" variant="outlined" onClick={() => togglePublish(q._id, q.published)}>{q.published ? 'Unpublish' : 'Publish'}</Button>
                  <Button size="small" component={RouterLink} to={`/instructor/quiz/${q._id}/results`}>View Results</Button>
                  <Button size="small" color="error" variant="outlined" onClick={() => deleteQuiz(q._id)}>Delete</Button>
                </Box>
              }>
                <ListItemText primary={q.title} secondary={q.description} />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default InstructorQuizList;
