import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper to decode JWT and check expiration and role
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    /*testing, uncomment after debugging*/
    /*const payload = parseJwt(token);
    const now = Math.floor(Date.now() / 1000);
    if (!payload || !payload.exp || payload.exp < now) {
      // Token expired
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('tokenExpired'));
      throw new axios.Cancel('Session expired. Please log in again.');
    }
    // Only allow if user is ADMIN
    if (!payload.role || payload.role !== 'ADMIN') {
      throw new axios.Cancel('Access denied: Administrator only.');
    }*/
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optionally, handle token expiration globally
api.interceptors.response.use(
  response => response,
  error => {
    if (axios.isCancel(error)) {
      // Optionally show a toast or redirect to login
      window.dispatchEvent(new CustomEvent('tokenExpired', { detail: error.message }));
    }
    return Promise.reject(error);
  }
);

export default api; 