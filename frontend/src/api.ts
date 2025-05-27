import axios from 'axios';

const api = axios.create({
  baseURL: 'https://crossapi.nodemixaholic.com',
  withCredentials: false, // set to true if you need cookies
});

export default api; 