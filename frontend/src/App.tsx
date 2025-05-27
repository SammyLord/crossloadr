import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { theme } from './theme';
import Layout from './components/Layout';
import Home from './pages/Home';
import AppStore from './pages/AppStore';
import AppSubmission from './pages/AppSubmission';
import AdminDashboard from './pages/AdminDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';
import Documentation from './pages/Documentation';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/store" element={<AppStore />} />
              <Route path="/submit" element={<AppSubmission />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/developer/*" element={<DeveloperDashboard />} />
              <Route path="/docs/*" element={<Documentation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
        <ToastContainer position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 