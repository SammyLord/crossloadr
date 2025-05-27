import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL || 'https://crossapi.nodemixaholic.com',
  withCredentials: false, // set to true if you need cookies
});

export default api; 