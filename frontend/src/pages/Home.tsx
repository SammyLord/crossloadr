import { Box, Button, Container, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bg: 'hero-image.svg',
          color: 'primary.contrastText',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Welcome to CrossLoadr
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom>
                Your trusted source for secure web apps with iOS Web Clip Profiles
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={() => navigate('/store')}
                  sx={{ mr: 2 }}
                >
                  Browse Apps
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => navigate('/submit')}
                >
                  Submit Your App
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Why Choose CrossLoadr?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Secure Apps
              </Typography>
              <Typography>
                All apps undergo rigorous security scanning and regular checks to ensure your safety.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                iOS Web Clips
              </Typography>
              <Typography>
                Get native-like iOS Web Clip profiles for your favorite web apps.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Developer Friendly
              </Typography>
              <Typography>
                Easy submission process and comprehensive documentation for developers.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'grey.100',
          py: 8,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Join our community of developers and users today.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/submit')}
            sx={{ mt: 2 }}
          >
            Submit Your App Now
          </Button>
        </Container>
      </Box>
    </Box>
  );
} 
