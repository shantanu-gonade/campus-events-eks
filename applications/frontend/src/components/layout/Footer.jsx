import { Box, Container, Typography, Link as MuiLink } from '@mui/material';

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
        <Typography variant="body2" color="text.secondary" align="center">
          Campus Events Management System
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          ENPM818R - Cloud Computing | University of Maryland
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          {'© '}
          {new Date().getFullYear()}
          {' - Built with AWS EKS, React, and Material-UI'}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
