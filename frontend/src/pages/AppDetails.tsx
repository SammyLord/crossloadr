import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import {
  Security as SecurityIcon,
  Language as LanguageIcon,
  Update as UpdateIcon,
  Storage as StorageIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Info as InfoIcon,
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  StarHalf as StarHalfIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'react-toastify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

interface AppDetails {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  developer: string;
  category: string;
  status: 'active' | 'pending' | 'suspended';
  lastScan: string;
  scanResult: {
    status: 'pass' | 'fail';
    vulnerabilities: string[];
    details: {
      ssl: boolean;
      contentSecurity: boolean;
      xss: boolean;
      dataPrivacy: boolean;
    };
  };
  rating?: number;
  downloads?: number;
  featured?: boolean;
  ageRating?: string;
  inAppPurchases?: boolean;
  screenshots?: string[];
  size?: string;
  version?: string;
  releaseDate?: string;
  features?: string[];
  requirements?: string[];
  privacyPolicy?: string;
  supportUrl?: string;
  developerWebsite?: string;
  developerEmail?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`app-tabpanel-${index}`}
      aria-labelledby={`app-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AppDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);

  const { data: app, isLoading, error } = useQuery<AppDetails>({
    queryKey: ['app', id],
    queryFn: async () => {
      const response = await api.get(`/api/apps/${id}`);
      return response.data;
    }
  });

  const handleInstall = async () => {
    try {
      window.location.href = `/api/apps/${id}/profile`;
      toast.success('Installation profile downloaded');
    } catch (error) {
      toast.error('Failed to download installation profile');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !app) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Error loading app details. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', py: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" component="h1" noWrap>
              {app.name}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* App Info */}
          <Grid item xs={12} md={8}>
            {/* App Header */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
              <Avatar
                src={app.icon}
                alt={app.name}
                variant="rounded"
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 2,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {app.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {app.developer}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {app.category && (
                    <Chip
                      label={app.category}
                      size="small"
                      sx={{
                        bgcolor: 'primary.50',
                        color: 'primary.main',
                        fontWeight: 500,
                      }}
                    />
                  )}
                  {app.ageRating && (
                    <Chip
                      label={app.ageRating}
                      size="small"
                      sx={{
                        bgcolor: 'grey.100',
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    />
                  )}
                  {app.inAppPurchases && (
                    <Chip
                      icon={<ShoppingCartIcon />}
                      label="In-App Purchases"
                      size="small"
                      sx={{
                        bgcolor: 'grey.100',
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    />
                  )}
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<DownloadIcon />}
                  onClick={handleInstall}
                  sx={{ textTransform: 'none' }}
                >
                  Install
                </Button>
              </Box>
            </Box>

            {/* Screenshots */}
            {app.screenshots && app.screenshots.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Swiper
                  modules={[Navigation, Pagination, FreeMode]}
                  spaceBetween={16}
                  slidesPerView={isMobile ? 1.2 : 2.5}
                  freeMode
                  navigation
                  pagination={{ clickable: true }}
                  style={{
                    '--swiper-navigation-color': theme.palette.primary.main,
                    '--swiper-pagination-color': theme.palette.primary.main,
                  } as any}
                >
                  {app.screenshots.map((screenshot, index) => (
                    <SwiperSlide key={index}>
                      <Box
                        component="img"
                        src={screenshot}
                        alt={`${app.name} screenshot ${index + 1}`}
                        sx={{
                          width: '100%',
                          borderRadius: 2,
                          aspectRatio: '16/9',
                          objectFit: 'cover',
                        }}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Box>
            )}

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                  },
                }}
              >
                <Tab label="Overview" />
                <Tab label="Information" />
                <Tab label="Security" />
                <Tab label="Reviews" />
              </Tabs>
            </Box>

            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="body1" paragraph>
                {app.description}
              </Typography>
              {app.features && app.features.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Features
                  </Typography>
                  <List>
                    {app.features.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <StarIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </TabPanel>

            {/* Information Tab */}
            <TabPanel value={tabValue} index={1}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Developer"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span">{app.developer}</Typography>
                        {app.developerWebsite && (
                          <Button
                            href={app.developerWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            startIcon={<LanguageIcon />}
                            size="small"
                          >
                            Website
                          </Button>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Size"
                    secondary={app.size || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <UpdateIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Version"
                    secondary={app.version || 'Not specified'}
                  />
                </ListItem>
                {app.requirements && app.requirements.length > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Requirements"
                      secondary={app.requirements.join(', ')}
                    />
                  </ListItem>
                )}
              </List>
            </TabPanel>

            {/* Security Tab */}
            <TabPanel value={tabValue} index={2}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SecurityIcon
                    color={app.scanResult.status === 'pass' ? 'success' : 'error'}
                    sx={{ fontSize: 40 }}
                  />
                  <Box>
                    <Typography variant="h6">
                      Security Status: {app.scanResult.status === 'pass' ? 'Verified' : 'Issues Found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last scanned: {new Date(app.lastScan).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Alert
                      severity={app.scanResult.details.ssl ? 'success' : 'error'}
                      sx={{ mb: 1 }}
                    >
                      SSL Certificate
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Alert
                      severity={app.scanResult.details.contentSecurity ? 'success' : 'error'}
                      sx={{ mb: 1 }}
                    >
                      Content Security
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Alert
                      severity={app.scanResult.details.xss ? 'success' : 'error'}
                      sx={{ mb: 1 }}
                    >
                      XSS Protection
                    </Alert>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Alert
                      severity={app.scanResult.details.dataPrivacy ? 'success' : 'error'}
                      sx={{ mb: 1 }}
                    >
                      Data Privacy
                    </Alert>
                  </Grid>
                </Grid>

                {app.scanResult.vulnerabilities.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Security Issues:
                    </Typography>
                    <List>
                      {app.scanResult.vulnerabilities.map((vulnerability, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <SecurityIcon color="error" />
                          </ListItemIcon>
                          <ListItemText primary={vulnerability} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            </TabPanel>

            {/* Reviews Tab */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  No reviews yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Be the first to review this app
                </Typography>
              </Box>
            </TabPanel>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                App Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Category"
                    secondary={app.category}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Age Rating"
                    secondary={app.ageRating || 'Not specified'}
                  />
                </ListItem>
                {app.inAppPurchases && (
                  <ListItem>
                    <ListItemText
                      primary="In-App Purchases"
                      secondary="Yes"
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText
                    primary="Size"
                    secondary={app.size || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Version"
                    secondary={app.version || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Updated"
                    secondary={new Date(app.lastScan).toLocaleDateString()}
                  />
                </ListItem>
              </List>
            </Paper>

            {app.privacyPolicy && (
              <Button
                href={app.privacyPolicy}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              >
                Privacy Policy
              </Button>
            )}
            {app.supportUrl && (
              <Button
                href={app.supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                fullWidth
                variant="outlined"
              >
                Support
              </Button>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 