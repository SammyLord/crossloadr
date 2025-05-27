import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert
} from '@mui/material';
import api from '../api'; // Assuming you have an api client
import { toast } from 'react-toastify';

export default function DeveloperLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/api/developer/login', { email });
      console.log('Developer login API response:', response.data);

      if (response.data && response.data.email) {
        localStorage.setItem('developerEmail', response.data.email);
        toast.success(response.data.message || 'Logged in successfully!');
        navigate('/developer');
      } else {
        setError('Login failed: Unexpected response from server.');
        toast.error('Login failed: Unexpected response.');
      }
    } catch (err: any) {
      console.error('Developer login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
        }}
      >
        <Typography component="h1" variant="h5">
          Developer Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 1 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login / Register'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 