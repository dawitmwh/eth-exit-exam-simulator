// src/api/client.ts
import axios from 'axios';

const getBackendUrl = () => {
  const { hostname, protocol } = window.location;
  
  // Local development handling (e.g., aau.localhost:3000 -> aau.localhost:8000)
  if (hostname.includes('localhost')) {
    const subdomain = hostname.split('.')[0];
    return `${protocol}//${subdomain}.localhost:8000/api/`;
  }
  
  // Production handling (e.g., aau.company.com -> aau.api.company.com)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const subdomain = parts[0];
    const domain = parts.slice(1).join('.');
    return `${protocol}//${subdomain}.api.${domain}/api/`;
  }

  return 'http://127.0.0.1:8000/api/';
};

const apiClient = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});
// Paths that MUST NEVER have tokens attached or trigger 401 refresh interceptors
const bypassUrls = ['token/', 'users/register/', 'tenant/config/'];

// Outgoing Request Interceptor: Inject Access Token for every single call automatically
apiClient.interceptors.request.use(
  (config) => {
    const isBypassUrl = bypassUrls.some((url) => config.url?.includes(url));
    const token = localStorage.getItem('access_token');
    if (token && !isBypassUrl) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Incoming Response Interceptor: Trap expired tokens globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns a 401, the access token is invalid or expired
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized request detected or token expired. Clearing session.");
      
      // Clear out the stale authentication tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      
      
      // Force user back to the login screen cleanly
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;