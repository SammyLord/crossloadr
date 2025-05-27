import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Rating,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Security as SecurityIcon,
  ShoppingCart as ShoppingCartIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  developer: { name: string; email?: string; website?: string };
  category: string;
  status: 'active' | 'pending' | 'suspended';
  lastScan: string;
  scanResult?: {
    status: 'pass' | 'fail';
    vulnerabilities: string[];
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
}

interface AppCardProps {
  app: App;
  variant?: 'default' | 'compact';
}

export default function AppCard({ app, variant = 'default' }: AppCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isCompact = variant === 'compact';

  return (
    <Card
      component={Link}
      to={`/store/app/${app.id}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: isCompact ? 'row' : 'column',
        textDecoration: 'none',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
        },
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* App Icon */}
      <Box
        sx={{
          position: 'relative',
          width: isCompact ? 80 : '100%',
          paddingTop: isCompact ? '80px' : '100%',
          flexShrink: 0,
        }}
      >
        <CardMedia
          component="img"
          image={app.icon}
          alt={app.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: isCompact ? 1 : '12px 12px 0 0',
          }}
        />
        {app.inAppPurchases && (
          <Tooltip title="In-App Purchases">
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.8)',
                },
              }}
            >
              <ShoppingCartIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* App Info */}
      <CardContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: isCompact ? 1 : 2,
          '&:last-child': { pb: isCompact ? 1 : 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant={isCompact ? 'subtitle1' : 'h6'}
              component="h2"
              noWrap
              sx={{ fontWeight: 600 }}
            >
              {app.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ mb: 0.5 }}
            >
              {app.developer.name}
            </Typography>
          </Box>
          {app.ageRating && (
            <Chip
              label={app.ageRating}
              size="small"
              sx={{
                bgcolor: 'grey.100',
                color: 'text.secondary',
                fontWeight: 500,
                height: 20,
              }}
            />
          )}
        </Box>

        {!isCompact && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {app.rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating
                    value={app.rating}
                    precision={0.5}
                    size="small"
                    readOnly
                  />
                  <Typography variant="body2" color="text.secondary">
                    ({app.rating.toFixed(1)})
                  </Typography>
                </Box>
              )}
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
            </Box>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                mb: 1,
              }}
            >
              {app.description}
            </Typography>

            <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
              {app.scanResult && app.scanResult.status === 'pass' ? (
                <Tooltip title="Security Verified">
                  <SecurityIcon color="success" fontSize="small" />
                </Tooltip>
              ) : app.scanResult && app.scanResult.status === 'fail' ? (
                <Tooltip title="Security Issues Detected">
                  <SecurityIcon color="error" fontSize="small" />
                </Tooltip>
              ) : (
                <Tooltip title="Scan status unknown">
                  <SecurityIcon color="disabled" fontSize="small" />
                </Tooltip>
              )}
              {app.size && (
                <Typography variant="caption" color="text.secondary">
                  {app.size}
                </Typography>
              )}
              {app.version && (
                <Typography variant="caption" color="text.secondary">
                  Version {app.version}
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
} 