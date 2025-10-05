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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

const InstructorQuizResults = () => {
  const { id: quizId } = useParams();
  const { token } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [published, setPublished] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [quizRes, res] = await Promise.all([
        axios.get(`/api/quizzes/${quizId}`, { headers }),
        axios.get(`/api/quizzes/${quizId}/results`, { headers })
      ]);
      setQuizTitle(quizRes.data?.data?.title || 'Quiz');
      setRows(res.data?.data || []);
      if (typeof res.data?.published === 'boolean') setPublished(res.data.published);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [quizId, token]);

  const togglePublishResults = async () => {
    try {
      setError('');
      if (published) {
        await axios.post(`/api/quizzes/${quizId}/results/unpublish`, {}, { headers });
      } else {
        await axios.post(`/api/quizzes/${quizId}/results/publish`, {}, { headers });
      }
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update results visibility');
    }
  };

  if (loading) {
    return (<Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>);
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Results • {quizTitle}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={togglePublishResults} variant="contained" color={published ? 'warning' : 'success'}>
              {published ? 'Unpublish Results' : 'Publish Results'}
            </Button>
            <Button component={RouterLink} to={-1}>Back</Button>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No attempts yet.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>%</TableCell>
                  <TableCell>Taken At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={r.user?.avatar} alt={r.user?.name} sx={{ width: 28, height: 28 }} />
                        <Box>
                          <Typography variant="body2">{r.user?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{r.user?.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{r.score} / {r.totalPoints}</TableCell>
                    <TableCell>{r.percentage}%</TableCell>
                    <TableCell>{new Date(r.takenAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default InstructorQuizResults;
