import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Box,
  Avatar,
  LinearProgress,
  Grid,
  Button,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip
} from '@mui/material';

const InstructorCourseStudents = () => {
  const { id } = useParams();
  const { token } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const [courseRes, studentsRes] = await Promise.all([
          axios.get(`/api/courses/${id}`),
          axios.get(`/api/courses/${id}/students`, { headers })
        ]);
        setCourseTitle(courseRes.data?.data?.title || 'Course');
        setStudents(studentsRes.data?.data || []);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Students • {courseTitle}</Typography>
          <Button component={RouterLink} to={`/courses/${id}`} variant="outlined">Back to Course</Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}

        {students.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No students enrolled yet.</Typography>
        ) : (
          <List>
            {students.map((s) => (
              <ListItem key={s._id} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar src={s.avatar} alt={s.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1">{s.name}</Typography>
                      <Chip size="small" label="Enrolled" color="primary" variant="outlined" />
                      {s.completed && (
                        <Chip size="small" label="Completed" color="success" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <LinearProgress variant="determinate" value={s.percentComplete} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">{s.percentComplete}%</Typography>
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(s.enrolledCourses || []).map(c => (
                          <Chip key={c._id} label={c.title} size="small" component={RouterLink} to={`/courses/${c._id}`} clickable />
                        ))}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default InstructorCourseStudents;
