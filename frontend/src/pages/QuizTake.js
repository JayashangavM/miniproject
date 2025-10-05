import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Divider,
  FormControl,
  FormLabel
} from '@mui/material';

const QuizTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useSelector((s) => s.auth);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`/api/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuiz(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, token, isAuthenticated, navigate]);

  const handleChange = (qIndex, value) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      const ordered = quiz.questions.map((_, idx) => answers[idx]);
      const res = await axios.post(`/api/quizzes/${quiz._id}/submit`, { answers: ordered }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Do not show result immediately. Mark as submitted, then try to fetch published results.
      setSubmitted(true);
      try {
        const r = await axios.get(`/api/quizzes/${quiz._id}/results`, { headers: { Authorization: `Bearer ${token}` } });
        // If results are published, backend returns latest attempt
        setResult(r.data?.data || null);
      } catch (e) {
        // Ignore 403 (results not published yet)
        setResult(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz');
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

  if (!quiz) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">Quiz not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>{quiz.title}</Typography>
        {quiz.description && (
          <Typography variant="body1" color="text.secondary" paragraph>
            {quiz.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {quiz.questions.map((q, idx) => (
          <Box key={idx} sx={{ mb: 3 }}>
            <FormControl>
              <FormLabel sx={{ mb: 1 }}>{idx + 1}. {q.question}</FormLabel>
              {q.type === 'multiple-choice' && (
                <RadioGroup
                  value={answers[idx] ?? ''}
                  onChange={(e) => handleChange(idx, e.target.value)}
                >
                  {q.options.map((opt, i) => (
                    <FormControlLabel key={i} value={opt} control={<Radio />} label={opt} />
                  ))}
                </RadioGroup>
              )}
              {q.type === 'true-false' && (
                <RadioGroup
                  value={answers[idx] ?? ''}
                  onChange={(e) => handleChange(idx, e.target.value === 'true')}
                >
                  <FormControlLabel value={true} control={<Radio />} label="True" />
                  <FormControlLabel value={false} control={<Radio />} label="False" />
                </RadioGroup>
              )}
              {/* Short-answer not auto-graded here; could add TextField for manual review */}
            </FormControl>
          </Box>
        ))}

        {!submitted ? (
          <Button variant="contained" onClick={handleSubmit}>
            Submit Quiz
          </Button>
        ) : result ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success">
              Score: {result.score} / {result.totalPoints} ({result.percentage}%)
            </Alert>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info">Your submission was received. Results will be visible after the instructor publishes them.</Alert>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default QuizTake;
