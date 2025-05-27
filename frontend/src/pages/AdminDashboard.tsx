import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  HourglassEmpty,
  CheckCircleOutline,
  Block,
  ErrorOutline,
  HelpOutline as HelpOutlineIcon,
  RemoveRedEye
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import api from '../api';
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
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  lastScan?: string | null;
  scanIssues?: string[];
  scanResult?: {
    status: 'pass' | 'fail';
    details?: Record<string, any>;
  };
  submittedAt: string;
  approvedAt?: string | null;
  suspendedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
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
      {value === index && <Box sx={{ py: 3, px: { xs: 1, sm: 2 } }}>{children}</Box>}
    </div>
  );
}

function AppStatusChip({ status }: { status: App['status'] }) {
  let icon = <HourglassEmpty />;
  let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";

  switch (status) {
    case 'pending':
      icon = <HourglassEmpty />;
      color = "warning";
      break;
    case 'active':
      icon = <CheckCircleOutline />;
      color = "success";
      break;
    case 'suspended':
      icon = <Block />;
      color = "error";
      break;
    case 'rejected':
      icon = <ErrorOutline />;
      color = "error";
      break;
    default:
      icon = <HelpOutlineIcon />;
      color = "default";
  }
  return <Chip icon={icon} label={status.charAt(0).toUpperCase() + status.slice(1)} color={color} size="small" />;
}

function getScanStatusChip({ scanResult, scanIssues }: { scanResult?: App['scanResult'], scanIssues?: App['scanIssues'] }) {
  if (!scanResult) {
    return <Chip icon={<HelpOutlineIcon />} label="Not Scanned" color="default" size="small" />;
  }
  if (scanResult.status === 'pass') {
    return <Chip icon={<CheckCircleOutline />} label="Scan Passed" color="success" size="small" />;
  }
  if (scanResult.status === 'fail') {
    return <Chip icon={<ErrorOutline />} label={`Scan Failed (${scanIssues?.length || 0} issues)`} color="error" size="small" />;
  }
  return <Chip label="Scan Unknown" color="default" size="small" />;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabValue, setTabValue] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAppForReject, setSelectedAppForReject] = useState<App | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      toast.error("Admin access required. Please log in.");
      navigate('/admin/login');
    }
  }, [navigate]);

  const { data: apps, isLoading: isLoadingApps, error: appsError, refetch } = useQuery<App[], Error>({
    queryKey: ['admin-apps'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await api.get('/api/admin/apps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: !!localStorage.getItem('adminToken'),
  });

  const handleApiError = (error: any, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const message = error?.response?.data?.error || error?.message || defaultMessage;
    toast.error(message);
  };

  const approveAppMutation = useMutation<App, Error, string>({
    mutationFn: (appId) => api.post(`/api/admin/apps/${appId}/approve`, {}, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }).then(res => res.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-apps'] }); toast.success('App approved'); },
    onError: (err) => handleApiError(err, 'Error approving app'),
  });

  const rejectAppMutation = useMutation<App, Error, { appId: string; reason: string }>({
    mutationFn: ({ appId, reason }) => api.post(`/api/admin/apps/${appId}/reject`, { reason }, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }).then(res => res.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-apps'] }); setRejectDialogOpen(false); setRejectReason(''); toast.success('App rejected'); },
    onError: (err) => handleApiError(err, 'Error rejecting app'),
  });

  const deleteAppMutation = useMutation<void, Error, string>({
    mutationFn: (appId) => api.delete(`/api/admin/apps/${appId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }).then(res => res.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-apps'] }); toast.success('App deleted'); },
    onError: (err) => handleApiError(err, 'Error deleting app'),
  });

  const rescanAppMutation = useMutation<App, Error, string>({
    mutationFn: (appId) => api.post(`/api/admin/apps/${appId}/scan`, {}, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }).then(res => res.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-apps'] }); toast.success('App rescan initiated'); },
    onError: (err) => handleApiError(err, 'Error rescanning app'),
  });

  const suspendAppMutation = useMutation<App, Error, string>({
    mutationFn: (appId) => api.post(`/api/admin/apps/${appId}/suspend`, {}, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }).then(res => res.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-apps'] }); toast.success('App suspended'); },
    onError: (err) => handleApiError(err, 'Error suspending app'),
  });

  const reactivateAppMutation = useMutation<App, Error, string>({
    mutationFn: (appId: string) => 
        api.post(`/api/admin/apps/${appId}/reactivate`, {}, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` } }).then(res => res.data),
    onSuccess: () => {
        toast.success('App reactivated successfully!');
        queryClient.invalidateQueries({ queryKey: ['admin-apps'] });
    },
    onError: (err) => handleApiError(err, 'Error reactivating app'),
  });

  const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); };
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => { setTabValue(newValue); setPage(0); };

  const handleApproveClick = (app: App) => {
    if (app.status === 'pending') {
      if (!app.scanResult || app.scanResult.status === 'fail' || (app.scanIssues && app.scanIssues.length > 0)) {
        if (window.confirm(`This app scan status is '${app.scanResult?.status || 'Not Scanned'}' with ${app.scanIssues?.length || 0} issues. Approve anyway?`)) {
          approveAppMutation.mutate(app.id);
        }
      } else {
        approveAppMutation.mutate(app.id);
      }
    }
  };
  
  const handleRejectClick = (app: App) => { setSelectedAppForReject(app); setRejectDialogOpen(true); };
  const handleConfirmReject = () => {
    if (selectedAppForReject && rejectReason.trim()) {
      rejectAppMutation.mutate({ appId: selectedAppForReject.id, reason: rejectReason.trim() });
    } else if (!rejectReason.trim()) {
      toast.warn('Rejection reason cannot be empty.');
    }
  };
  
  const handleSuspendClick = (app: App) => {
    if (window.confirm(`Suspend "${app.name}"? It will be unavailable in the public store.`)) {
      suspendAppMutation.mutate(app.id);
    }
  };

  const getFilteredApps = () => {
    if (!apps) return [];
    const statusMap = ['pending', 'active', 'suspended', 'rejected']; // Assuming 4th tab for rejected if added
    return apps.filter((app) => app.status === statusMap[tabValue]);
  };

  const filteredAppsList = getFilteredApps();

  if (isLoadingApps) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  if (appsError) return <Container sx={{py:3}}><Alert severity="error">Error: {appsError.message} <Button onClick={() => refetch()}>Retry</Button></Alert></Container>;
  
  // Helper to check current mutation state for a specific app ID
  const isMutationPendingForApp = (mutation: UseMutationResult<any, Error, string, any>, appId: string): boolean => 
    mutation.isPending && mutation.variables === appId;

  const isRejectMutationPendingForApp = (mutation: UseMutationResult<any, Error, { appId: string; reason: string; }, any>, appId: string): boolean =>
    mutation.isPending && mutation.variables?.appId === appId;

  return (
    <Container maxWidth={false} sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" component="h1" gutterBottom>Admin Dashboard</Typography>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label={`Pending (${apps?.filter(a => a.status === 'pending').length || 0})`} />
          <Tab label={`Active (${apps?.filter(a => a.status === 'active').length || 0})`} />
          <Tab label={`Suspended (${apps?.filter(a => a.status === 'suspended').length || 0})`} />
          {/* <Tab label={`Rejected (${apps?.filter(a => a.status === 'rejected').length || 0})`} /> */}
        </Tabs>
        <TableContainer>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Developer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Scan</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Submitted</TableCell>
                  <TableCell sx={{ minWidth: { xs: 180, sm: 200, md: 240 }}}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppsList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center"><Typography sx={{ p: 3 }}>No apps here.</Typography></TableCell></TableRow>
                ) : (
                  filteredAppsList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{app.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', md: 'none' } }}> {app.developer.name} </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{app.developer.name} ({app.developer.email})</TableCell>
                    <TableCell><AppStatusChip status={app.status} /></TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{getScanStatusChip({ scanResult: app.scanResult, scanIssues: app.scanIssues })}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{new Date(app.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {app.status === 'pending' && (
                        <>
                          <Tooltip title="Approve"><IconButton color="success" onClick={() => handleApproveClick(app)} disabled={isMutationPendingForApp(approveAppMutation, app.id)}>{isMutationPendingForApp(approveAppMutation, app.id) ? <CircularProgress size={20}/> : <CheckIcon />}</IconButton></Tooltip>
                          <Tooltip title="Reject"><IconButton color="error" onClick={() => handleRejectClick(app)} disabled={isRejectMutationPendingForApp(rejectAppMutation, app.id)}><CloseIcon /></IconButton></Tooltip>
                          <Tooltip title="Rescan"><IconButton color="info" onClick={() => rescanAppMutation.mutate(app.id)} disabled={isMutationPendingForApp(rescanAppMutation, app.id)}>{isMutationPendingForApp(rescanAppMutation, app.id)?<CircularProgress size={20}/>:<RefreshIcon />}</IconButton></Tooltip>
                        </>
                      )}
                      {app.status === 'active' && (
                        <>
                          <Tooltip title="Suspend"><IconButton color="warning" onClick={() => handleSuspendClick(app)} disabled={isMutationPendingForApp(suspendAppMutation, app.id)}>{isMutationPendingForApp(suspendAppMutation, app.id)?<CircularProgress size={20}/>:<PauseIcon />}</IconButton></Tooltip>
                          <Tooltip title="Rescan"><IconButton color="info" onClick={() => rescanAppMutation.mutate(app.id)} disabled={isMutationPendingForApp(rescanAppMutation, app.id)}>{isMutationPendingForApp(rescanAppMutation, app.id)?<CircularProgress size={20}/>:<RefreshIcon />}</IconButton></Tooltip>
                        </>
                      )}
                      {app.status === 'suspended' && (
                        <>
                          <Tooltip title="Reactivate App">
                            <IconButton 
                                color="success" 
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to reactivate the app "${app.name}"? It will become available in the public store again.`)) {
                                        reactivateAppMutation.mutate(app.id);
                                    }
                                }}
                                disabled={isMutationPendingForApp(reactivateAppMutation, app.id) || app.status !== 'suspended'}
                            >
                              {isMutationPendingForApp(reactivateAppMutation, app.id) ? <CircularProgress size={20}/> : <PlayArrowIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Rescan"><IconButton color="info" onClick={() => rescanAppMutation.mutate(app.id)} disabled={isMutationPendingForApp(rescanAppMutation, app.id)}>{isMutationPendingForApp(rescanAppMutation, app.id)?<CircularProgress size={20}/>:<RefreshIcon />}</IconButton></Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete"><IconButton color="error" onClick={() => { if(window.confirm(`Delete "${app.name}"? This cannot be undone.`)) deleteAppMutation.mutate(app.id);}} disabled={isMutationPendingForApp(deleteAppMutation, app.id)}>{isMutationPendingForApp(deleteAppMutation, app.id)?<CircularProgress size={20}/>:<DeleteIcon />}</IconButton></Tooltip>
                      <Tooltip title="View (Not Implemented)"><span><IconButton disabled={true}><RemoveRedEye /></IconButton></span></Tooltip>
                    </TableCell>
                  </TableRow>
                )))
              }
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination rowsPerPageOptions={[5, 10, 25, 50]} component="div" count={filteredAppsList.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}/>
      </Paper>
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject App: {selectedAppForReject?.name}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{mb: 2}}>Provide reason for rejection (may be shown to developer).</DialogContentText>
          <TextField autoFocus margin="dense" label="Rejection Reason" type="text" fullWidth variant="outlined" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} multiline rows={4} required />
        </DialogContent>
        <DialogActions sx={{p:2}}>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmReject} color="error" variant="contained" disabled={rejectAppMutation.isPending || !rejectReason.trim()}>{rejectAppMutation.isPending ? <CircularProgress size={24}/> : "Confirm Reject"}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 