import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper to decode JWT and check expiration and role
function parseJwt(token) {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return null;
    }
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT:', e);
    return null;
  }
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    // Validate token format as it will trigger the error handling
    if (!token.includes('.') || token.split('.').length !== 3) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('tokenExpired'));
      throw new axios.Cancel('Invalid token format. Please log in again.');
    }

    // Parse and validate token
    const payload = parseJwt(token);
    if (!payload) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('tokenExpired'));
      throw new axios.Cancel('Invalid token. Please log in again.');
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('tokenExpired'));
      throw new axios.Cancel('Session expired. Please log in again.');
    }

    // Add token to headers
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Handle token expiration and other errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (axios.isCancel(error)) {
      window.dispatchEvent(new CustomEvent('tokenExpired', { detail: error.message }));
    } else if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token on authentication/authorization errors
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('tokenExpired'));
    }
    return Promise.reject(error);
  }
);

export default api; 