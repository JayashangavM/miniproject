import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Box,
  Button,
  Divider,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Alert
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

const emptyQuestion = () => ({
  question: '',
  type: 'multiple-choice',
  options: ['', '', '', ''],
  correctAnswer: 0,
  points: 1
});

const InstructorQuizCreate = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((s) => s.auth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(20);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdQuizId, setCreatedQuizId] = useState(null);

  const handleAddQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const handleRemoveQuestion = (idx) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...(q.options || [])];
      options[optIdx] = value;
      return { ...q, options };
    }));
  };

  const addOption = (qIdx) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...(q.options || []), ''];
      return { ...q, options };
    }));
  };

  const removeOption = (qIdx, optIdx) => {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = (q.options || []).filter((_, j) => j !== optIdx);
      // adjust correctAnswer if needed
      let correctAnswer = q.correctAnswer;
      if (typeof correctAnswer === 'number' && optIdx <= correctAnswer) {
        correctAnswer = Math.max(0, correctAnswer - 1);
      }
      return { ...q, options, correctAnswer };
    }));
  };

  const handleCreate = async () => {
    try {
      setError('');
      setSuccess('');
      const payload = {
        title,
        description,
        course: courseId,
        timeLimit: Number(timeLimit) || 20,
        questions: questions.map((q) => ({
          question: q.question,
          type: q.type,
          options: q.type === 'multiple-choice' ? q.options : [],
          correctAnswer: q.type === 'multiple-choice' ? q.options[q.correctAnswer] : (q.type === 'true-false' ? Boolean(q.correctAnswer) : ''),
          points: Number(q.points) || 1
        }))
      };
      const res = await axios.post('/api/quizzes', payload, { headers: { Authorization: `Bearer ${token}` } });
      setCreatedQuizId(res.data.data._id);
      setSuccess('Quiz created as draft. You can publish it now.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handlePublish = async () => {
    if (!createdQuizId) return;
    try {
      setError('');
      await axios.post(`/api/quizzes/${createdQuizId}/publish`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Quiz published successfully.');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to publish quiz');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>Create Quiz</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField type="number" label="Time Limit (minutes)" fullWidth value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {questions.map((q, idx) => (
          <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">Question {idx + 1}</Typography>
              <IconButton onClick={() => handleRemoveQuestion(idx)}><Delete /></IconButton>
            </Box>
            <TextField label="Question" fullWidth sx={{ mt: 1, mb: 2 }} value={q.question} onChange={(e) => updateQuestion(idx, { question: e.target.value })} />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Select size="small" value={q.type} onChange={(e) => updateQuestion(idx, { type: e.target.value })}>
                <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                <MenuItem value="true-false">True / False</MenuItem>
              </Select>
              <TextField type="number" size="small" label="Points" value={q.points} onChange={(e) => updateQuestion(idx, { points: e.target.value })} />
            </Box>

            {q.type === 'multiple-choice' && (
              <Box>
                {q.options.map((opt, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <TextField label={`Option ${i + 1}`} value={opt} onChange={(e) => updateOption(idx, i, e.target.value)} sx={{ flexGrow: 1 }} />
                    <Button variant={q.correctAnswer === i ? 'contained' : 'outlined'} size="small" onClick={() => updateQuestion(idx, { correctAnswer: i })}>Correct</Button>
                    <IconButton onClick={() => removeOption(idx, i)}><Delete /></IconButton>
                  </Box>
                ))}
                <Button startIcon={<Add />} size="small" onClick={() => addOption(idx)}>Add Option</Button>
              </Box>
            )}

            {q.type === 'true-false' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant={q.correctAnswer === true ? 'contained' : 'outlined'} size="small" onClick={() => updateQuestion(idx, { correctAnswer: true })}>True</Button>
                <Button variant={q.correctAnswer === false ? 'contained' : 'outlined'} size="small" onClick={() => updateQuestion(idx, { correctAnswer: false })}>False</Button>
              </Box>
            )}
          </Paper>
        ))}

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Add />} onClick={handleAddQuestion}>Add Question</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Save Draft</Button>
          <Button variant="contained" color="success" onClick={handlePublish} disabled={!createdQuizId}>Publish</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default InstructorQuizCreate;
