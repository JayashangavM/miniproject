import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';

const StudentQuizResult = () => {
  const { id } = useParams(); // quiz id
  const { token, isAuthenticated } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [quizRes, res] = await Promise.all([
          axios.get(`/api/quizzes/${id}`, { headers }),
          axios.get(`/api/quizzes/${id}/results`, { headers })
        ]);
        setQuizTitle(quizRes.data?.data?.title || 'Quiz');
        setResult(res.data?.data || null);
      } catch (e) {
        const msg = e.response?.data?.message || 'Results are not available yet';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated && token) load();
  }, [id, token, isAuthenticated]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>);
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>My Result • {quizTitle}</Typography>
        <Divider sx={{ my: 2 }} />
        {error && <Alert severity="info" sx={{ mb: 2 }}>{error}</Alert>}
        {result ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>Latest Attempt</Alert>
            <Typography variant="body1">Score: {result.score} / {result.totalPoints}</Typography>
            <Typography variant="body1">Percentage: {result.percentage}%</Typography>
            <Typography variant="body2" color="text.secondary">Taken at: {new Date(result.takenAt).toLocaleString()}</Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">No attempts yet.</Typography>
        )}
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" component={RouterLink} to={-1}>Back</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentQuizResult;
