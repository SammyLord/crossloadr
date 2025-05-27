import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';

interface App {
  id: string;
  name: string;
  description: string;
  url: string;
  developer: {
    name: string;
    email: string;
  };
  status: 'pending' | 'active' | 'suspended';
  lastScan: string;
  scanResult: {
    status: 'pass' | 'fail';
    vulnerabilities: string[];
  };
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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminDashboard() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  const { data: apps, isLoading, error } = useQuery<App[]>({
    queryKey: ['admin-apps'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/apps', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    }
  });

  const { mutate: approveApp, isLoading: isApproving } = useMutation({
    mutationFn: async (appId: string) => {
      const response = await axios.post(`/api/admin/apps/${appId}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apps'] });
      toast.success('App approved successfully');
    },
    onError: (error) => {
      toast.error('Error approving app');
      console.error('Approval error:', error);
    }
  });

  const { mutate: rejectApp, isLoading: isRejecting } = useMutation({
    mutationFn: async ({ appId, reason }: { appId: string; reason: string }) => {
      const response = await axios.post(`/api/admin/apps/${appId}/reject`, { reason }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apps'] });
      setRejectDialogOpen(false);
      setRejectReason('');
      toast.success('App rejected successfully');
    },
    onError: (error) => {
      toast.error('Error rejecting app');
      console.error('Rejection error:', error);
    }
  });

  const { mutate: deleteApp, isLoading: isDeleting } = useMutation({
    mutationFn: async (appId: string) => {
      const response = await axios.delete(`/api/admin/apps/${appId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apps'] });
      toast.success('App deleted successfully');
    },
    onError: (error) => {
      toast.error('Error deleting app');
      console.error('Deletion error:', error);
    }
  });

  const { mutate: rescanApp, isLoading: isRescanning } = useMutation({
    mutationFn: async (appId: string) => {
      const response = await axios.post(`/api/admin/apps/${appId}/scan`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apps'] });
      toast.success('App rescanned successfully');
    },
    onError: (error) => {
      toast.error('Error rescanning app');
      console.error('Rescan error:', error);
    }
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRejectClick = (app: App) => {
    setSelectedApp(app);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (selectedApp && rejectReason) {
      rejectApp({ appId: selectedApp.id, reason: rejectReason });
    }
  };

  const filteredApps = apps?.filter((app) => {
    switch (tabValue) {
      case 0:
        return app.status === 'pending';
      case 1:
        return app.status === 'active';
      case 2:
        return app.status === 'suspended';
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Error loading apps. Please try again later.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Pending" />
          <Tab label="Active" />
          <Tab label="Suspended" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Developer</TableCell>
                  <TableCell>Last Scan</TableCell>
                  <TableCell>Scan Result</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApps?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Typography variant="subtitle1">{app.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {app.url}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.developer.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {app.developer.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(app.lastScan).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={app.scanResult.status}
                        color={app.scanResult.status === 'pass' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="success"
                        onClick={() => approveApp(app.id)}
                        disabled={isApproving || app.scanResult.status === 'fail'}
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleRejectClick(app)}
                        disabled={isRejecting}
                      >
                        <CloseIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => rescanApp(app.id)}
                        disabled={isRescanning}
                      >
                        <RefreshIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => deleteApp(app.id)}
                        disabled={isDeleting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredApps?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Similar table structure for active apps */}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Similar table structure for suspended apps */}
        </TabPanel>
      </Paper>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject App</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectSubmit}
            color="error"
            disabled={!rejectReason || isRejecting}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 