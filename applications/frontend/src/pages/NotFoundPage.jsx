import { Container, Typography, Button, Box, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <Container maxWidth="sm">
      <Paper
        elevation={2}
        sx={{
          p: 6,
          textAlign: 'center',
          mt: 8,
        }}
      >
        <Typography variant="h1" color="primary" fontWeight={700} gutterBottom>
          404
        </Typography>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
        >
          Go to Homepage
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFoundPage;
