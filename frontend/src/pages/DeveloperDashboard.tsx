import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider
} from '@mui/material';
import { Web as WebIcon, BugReport as BugReportIcon, CheckCircle as CheckCircleIcon, HourglassEmpty as HourglassEmptyIcon, Block as BlockIcon } from '@mui/icons-material';
import api from '../api';

interface AppScanResult {
  status: 'pass' | 'fail' | 'pending' | 'error';
  vulnerabilities?: string[];
}

interface App {
  id: string;
  name: string;
  url: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  scanResult?: AppScanResult | null;
  submittedAt: string;
}

const DeveloperDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [developerEmail, setDeveloperEmail] = useState<string | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem('developerEmail');
    if (!storedEmail) {
      navigate('/developer/login');
    } else {
      setDeveloperEmail(storedEmail);
      fetchDeveloperApps(storedEmail);
    }
  }, [navigate]);

  const fetchDeveloperApps = async (email: string) => {
    setIsLoadingApps(true);
    setFetchError(null);
    try {
      const response = await api.get(`/api/developer/apps?email=${email}`);
      setApps(response.data as App[]);
    } catch (err: any) {
      setFetchError(err.response?.data?.error || 'Failed to load your applications.');
      console.error('Error fetching developer apps:', err);
      setApps([]);
    } finally {
      setIsLoadingApps(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('developerEmail');
    navigate('/developer/login');
  };

  if (!developerEmail) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Developer Dashboard
          </Typography>
          <Button variant="outlined" onClick={handleLogout}>
            Logout ({developerEmail})
          </Button>
        </Box>
        
        <Typography paragraph>
          Welcome, {developerEmail}! Manage your submitted applications below.
        </Typography>

        <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>My Apps</Typography>
        {isLoadingApps && <CircularProgress />}
        {fetchError && <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>}
        {!isLoadingApps && !fetchError && apps.length === 0 && (
          <Alert severity="info">You have not submitted any apps yet. <Button onClick={() => navigate('/submit')} size="small">Submit your first app</Button></Alert>
        )}
        {!isLoadingApps && !fetchError && apps.length > 0 && (
          <List component={Paper} elevation={1}>
            {apps.map((app, index) => (
              <React.Fragment key={app.id}>
                <ListItem>
                  <ListItemIcon>
                    <WebIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={app.name}
                    secondary={`URL: ${app.url} | Submitted: ${new Date(app.submittedAt).toLocaleDateString()}`}
                  />
                  <Chip 
                    icon={app.status === 'active' ? <CheckCircleIcon /> : app.status === 'pending' ? <HourglassEmptyIcon /> : app.status === 'suspended' ? <BlockIcon /> : <BugReportIcon />}
                    label={app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    color={app.status === 'active' ? 'success' : app.status === 'pending' ? 'warning' : 'error'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {app.scanResult && (
                     <Chip 
                        label={`Scan: ${app.scanResult.status}`}
                        color={app.scanResult.status === 'pass' ? 'success' : app.scanResult.status === 'fail' ? 'error' : 'default'}
                        size="small"
                     />
                  )}
                </ListItem>
                {index < apps.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" onClick={() => navigate('/submit')}>
            Submit New App
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default DeveloperDashboard; 