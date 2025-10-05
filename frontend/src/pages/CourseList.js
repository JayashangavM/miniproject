import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { getCourses } from '../redux/slices/courseSlice';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
  Alert,
  Chip,
  Rating
} from '@mui/material';
import { Search, School } from '@mui/icons-material';

const CourseList = () => {
  const dispatch = useDispatch();
  const { courses, loading, error } = useSelector(state => state.courses);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => {
    dispatch(getCourses());
  }, [dispatch]);

  useEffect(() => {
    if (courses) {
      setFilteredCourses(
        courses.filter(course =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [courses, searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Available Courses
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search courses by title or description"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Course Grid */}
      {filteredCourses.length > 0 ? (
        <Grid container spacing={3}>
          {filteredCourses.map(course => (
            <Grid item key={course._id} xs={12} sm={6} md={4}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
                className="course-card"
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={course.thumbnail || 'https://source.unsplash.com/random?education'}
                  alt={course.title}
                  className="course-image"
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {course.title}
                    </Typography>
                    <Chip 
                      icon={<School />} 
                      label={course.level || 'All Levels'} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating 
                      value={course.rating || 0} 
                      precision={0.5} 
                      readOnly 
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({course.reviews?.length || 0} reviews)
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {course.description.length > 120
                      ? `${course.description.substring(0, 120)}...`
                      : course.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Typography variant="h6" color="primary">
                      {course.price ? `$${course.price.toFixed(2)}` : 'Free'}
                    </Typography>
                    <Button 
                      component={RouterLink} 
                      to={`/courses/${course._id}`} 
                      variant="contained" 
                      size="small"
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="textSecondary">
            {searchTerm ? 'No courses match your search criteria' : 'No courses available'}
          </Typography>
          {searchTerm && (
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </Button>
          )}
        </Box>
      )}
    </Container>
  );
};

export default CourseList;