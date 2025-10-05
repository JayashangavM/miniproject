import React from 'react';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body1" align="center">
          © {new Date().getFullYear()} BrainBytes Learning Management System
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {'Built with '}
          <MuiLink color="inherit" href="https://mui.com/">
            Material-UI
          </MuiLink>
          {' and '}
          <MuiLink color="inherit" href="https://reactjs.org/">
            React
          </MuiLink>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;