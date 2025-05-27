import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'react-toastify';

const categories = [
  'Productivity',
  'Entertainment',
  'Social',
  'Tools',
  'Education'
];

const steps = ['App Details', 'Developer Info', 'Review & Submit'];

interface AppSubmission {
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  developer: {
    name: string;
    email: string;
    website?: string;
  };
}

export default function AppSubmission() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<AppSubmission>({
    name: '',
    description: '',
    url: '',
    icon: '',
    category: '',
    developer: {
      name: '',
      email: '',
      website: ''
    }
  });

  const { mutate: submitApp, isLoading } = useMutation({
    mutationFn: async (data: AppSubmission) => {
      const response = await api.post('/api/apps', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('App submitted successfully! It will be reviewed by our team.');
      navigate('/developer');
    },
    onError: (error) => {
      toast.error('Error submitting app. Please try again.');
      console.error('Submission error:', error);
    }
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      submitApp(formData);
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof AppSubmission],
          [child]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="App Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="App URL"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                helperText="The URL where your web app is hosted"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Icon URL"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                helperText="URL to your app's icon (should be a square image)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Developer Name"
                value={formData.developer.name}
                onChange={(e) => handleChange('developer.name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="email"
                label="Developer Email"
                value={formData.developer.email}
                onChange={(e) => handleChange('developer.email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Developer Website"
                value={formData.developer.website}
                onChange={(e) => handleChange('developer.website', e.target.value)}
                helperText="Optional"
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your app details before submission. Your app will undergo a security scan
              and review process before being published.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">App Details</Typography>
                <Typography><strong>Name:</strong> {formData.name}</Typography>
                <Typography><strong>Category:</strong> {formData.category}</Typography>
                <Typography><strong>URL:</strong> {formData.url}</Typography>
                <Typography><strong>Description:</strong> {formData.description}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Developer Information</Typography>
                <Typography><strong>Name:</strong> {formData.developer.name}</Typography>
                <Typography><strong>Email:</strong> {formData.developer.email}</Typography>
                {formData.developer.website && (
                  <Typography><strong>Website:</strong> {formData.developer.website}</Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Submit Your App
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || isLoading}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isLoading}
            endIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 