import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { createCourse } from '../redux/slices/courseSlice';

const categories = ['Web Development','Mobile Development','Data Science','Machine Learning','DevOps','UI/UX Design','Other'];
const levels = ['Beginner','Intermediate','Advanced'];

const CourseCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useSelector((s) => s.auth);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [course, setCourse] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    price: 0,
    isFree: true,
    thumbnail: ''
  });
  const [materials, setMaterials] = useState([]); // local list for UI after upload
  const [uploading, setUploading] = useState(false);

  if (!isAuthenticated || (user && user.role !== 'instructor' && user.role !== 'admin')) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">You must be an instructor to create courses.</Alert>
      </Container>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
  };

  const handleCreateCourse = async () => {
    setError('');
    setCreating(true);
    try {
      const action = await dispatch(createCourse(course));
      if (action.error) throw new Error(action.payload?.message || 'Failed to create course');
      const created = action.payload.data;
      navigate(`/courses/${created._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUploadMaterial = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', file.name);
      form.append('description', '');
      // Guess fileType
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : 'document';
      form.append('fileType', type);

      // We need course _id to upload, so create course first if not created
      if (!course._id) {
        // create a temp course silently
        const action = await dispatch(createCourse(course));
        if (action.error) throw new Error(action.payload?.message || 'Failed to create course');
        const created = action.payload.data;
        setCourse((prev) => ({ ...prev, _id: created._id }));
      }

      form.append('course', course._id);

      const res = await axios.post('/api/materials', form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMaterials((prev) => [...prev, res.data.data]);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Create New Course
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Fill in the course details. You can upload materials after creating.
        </Typography>
        <Divider sx={{ my: 2 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Title" name="title" value={course.title} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Category" name="category" value={course.category} onChange={handleChange}>
              {categories.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={4} label="Description" name="description" value={course.description} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Level" name="level" value={course.level} onChange={handleChange}>
              {levels.map((l) => (
                <MenuItem key={l} value={l}>{l}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" label="Price" name="price" value={course.price} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Thumbnail URL" name="thumbnail" value={course.thumbnail} onChange={handleChange} />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleCreateCourse} disabled={creating}>
            {creating ? <CircularProgress size={22} /> : 'Create Course'}
          </Button>
          <Button variant="outlined" component="label" disabled={uploading || !course._id}>
            {uploading ? <CircularProgress size={22} /> : 'Upload Material'}
            <input type="file" hidden onChange={handleUploadMaterial} />
          </Button>
          {!course._id && (
            <Chip color="warning" label="Create course first to enable material upload" />
          )}
        </Box>

        {materials.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Uploaded Materials</Typography>
            {materials.map((m) => (
              <Box key={m._id} sx={{ mb: 1 }}>
                <Typography variant="body2">{m.title} • {m.fileType}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CourseCreate;
