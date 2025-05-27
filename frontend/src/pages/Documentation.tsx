import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Link,
  Grid,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  Book as BookIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Phone as PhoneIcon,
  Description as DescriptionIcon,
  Api as ApiIcon
} from '@mui/icons-material';

const sections = [
  {
    title: 'Getting Started',
    icon: <BookIcon />,
    content: [
      {
        title: 'Introduction',
        description: 'Learn about CrossLoadr and its features for web app distribution and iOS Web Clip profiles.'
      },
      {
        title: 'Quick Start Guide',
        description: 'Follow these steps to get your web app listed on CrossLoadr.'
      },
      {
        title: 'Requirements',
        description: 'Technical and security requirements for submitting your web app.'
      }
    ]
  },
  {
    title: 'Security Guidelines',
    icon: <SecurityIcon />,
    content: [
      {
        title: 'Security Best Practices',
        description: 'Essential security practices to ensure your web app passes our security scan.'
      },
      {
        title: 'Common Vulnerabilities',
        description: 'Learn about common security vulnerabilities and how to avoid them.'
      },
      {
        title: 'Security Scan Process',
        description: 'Understanding how our security scanning works and what we check for.'
      }
    ]
  },
  {
    title: 'iOS Web Clips',
    icon: <PhoneIcon />,
    content: [
      {
        title: 'Web Clip Overview',
        description: 'Learn about iOS Web Clips and how they enhance your web app experience.'
      },
      {
        title: 'Web Clip Configuration',
        description: 'How to configure your web app for optimal Web Clip experience.'
      },
      {
        title: 'Best Practices',
        description: 'Tips and best practices for creating great Web Clip experiences.'
      }
    ]
  },
  {
    title: 'API Reference',
    icon: <ApiIcon />,
    content: [
      {
        title: 'Authentication',
        description: 'Learn about our API authentication methods and security.'
      },
      {
        title: 'Endpoints',
        description: 'Complete reference of all available API endpoints.'
      },
      {
        title: 'Rate Limits',
        description: 'Understanding API rate limits and best practices.'
      }
    ]
  }
];

const codeExamples = [
  {
    title: 'Submitting an App',
    language: 'bash',
    code: `curl -X POST https://api.crossloadr.com/apps \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Web App",
    "description": "A great web application",
    "url": "https://myapp.com",
    "category": "Productivity",
    "developer": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'`
  },
  {
    title: 'Generating a Web Clip Profile',
    language: 'bash',
    code: `curl -X GET https://api.crossloadr.com/apps/APP_ID/profile \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -o myapp.mobileconfig`
  }
];

export default function Documentation() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Documentation
      </Typography>

      <Grid container spacing={4}>
        {/* Main Documentation Sections */}
        <Grid item xs={12} md={8}>
          {sections.map((section) => (
            <Paper key={section.title} sx={{ mb: 4, p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {section.icon}
                <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                  {section.title}
                </Typography>
              </Box>
              <List>
                {section.content.map((item, index) => (
                  <Box key={item.title}>
                    <ListItem>
                      <ListItemIcon>
                        <DescriptionIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        secondary={item.description}
                        primaryTypographyProps={{ variant: 'h6' }}
                      />
                    </ListItem>
                    {index < section.content.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Paper>
          ))}
        </Grid>

        {/* Quick Links and Code Examples */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 4 }}>
            <CardHeader title="Quick Links" />
            <CardContent>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Developer Dashboard"
                    secondary={<Link href="/developer">Manage your apps</Link>}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Security Guidelines"
                    secondary={<Link href="#security">View guidelines</Link>}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ApiIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="API Documentation"
                    secondary={<Link href="#api">View API docs</Link>}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Code Examples" />
            <CardContent>
              {codeExamples.map((example) => (
                <Box key={example.title} sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {example.title}
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'grey.900',
                      color: 'grey.100',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto'
                    }}
                  >
                    {example.code}
                  </Paper>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Resources */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Additional Resources
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Community Support
                </Typography>
                <Typography>
                  Join our developer community for support, discussions, and updates.
                </Typography>
                <Link href="https://community.crossloadr.com" target="_blank">
                  Visit Community Forum
                </Link>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Updates
                </Typography>
                <Typography>
                  Stay informed about security updates and best practices.
                </Typography>
                <Link href="/security-updates" target="_blank">
                  View Security Updates
                </Link>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Support
                </Typography>
                <Typography>
                  Need help? Our support team is here to assist you.
                </Typography>
                <Link href="/support" target="_blank">
                  Contact Support
                </Link>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
} 