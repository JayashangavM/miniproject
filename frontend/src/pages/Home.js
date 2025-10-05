import React from 'react';
import { useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box
} from '@mui/material';

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  const features = [
    {
      title: 'Diverse Courses',
      description: 'Access a wide range of courses across various disciplines and skill levels.',
      image: 'https://source.unsplash.com/random/300x200/?education'
    },
    {
      title: 'Expert Instructors',
      description: 'Learn from industry professionals and academic experts in their fields.',
      image: 'https://source.unsplash.com/random/300x200/?teacher'
    },
    {
      title: 'Interactive Learning',
      description: 'Engage with course materials through quizzes, assignments, and discussions.',
      image: 'https://source.unsplash.com/random/300x200/?learning'
    },
    {
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed progress tracking and analytics.',
      image: 'https://source.unsplash.com/random/300x200/?progress'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="md">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            gutterBottom
          >
            Welcome to BrainBytes
          </Typography>
          <Typography variant="h5" align="center" paragraph>
            A comprehensive learning management system designed to provide an exceptional educational experience.
            Discover courses, enhance your skills, and achieve your learning goals with our platform.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            {isAuthenticated ? (
              <Button
                component={RouterLink}
                to="/dashboard"
                variant="contained"
                color="secondary"
                size="large"
                sx={{ mx: 1 }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="contained"
                  color="secondary"
                  size="large"
                  sx={{ mx: 1 }}
                >
                  Sign Up
                </Button>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  size="large"
                  sx={{ mx: 1, color: 'white', borderColor: 'white' }}
                >
                  Login
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          gutterBottom
        >
          Our Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Card className="course-card" elevation={3}>
                <CardMedia
                  component="img"
                  className="course-image"
                  image={feature.image}
                  alt={feature.title}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Call to Action */}
        <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ready to Start Learning?
          </Typography>
          <Typography variant="body1" paragraph>
            Browse our course catalog and find the perfect course for your needs.
          </Typography>
          <Button
            component={RouterLink}
            to="/courses"
            variant="contained"
            color="primary"
            size="large"
          >
            Explore Courses
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default Home;