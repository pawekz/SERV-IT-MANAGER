import axios from 'axios';

// Set default adapter globally to prevent fetch adapter issues in axios 1.12.0
// This must be done before creating any axios instances
if (typeof window !== 'undefined') {
  // Ensure XHR adapter is used by default in browser environment
  // This prevents "Cannot destructure property 'fetch' of 'undefined'" errors
  axios.defaults.adapter = 'xhr';
}

// Default to the production backend if VITE_API_BASE_URL is not provided at build/runtime.
// During local development teammates can create a .env file with VITE_API_BASE_URL=http://localhost:8080
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://servit-backendv2-b6arhyfsadg4fbhc.southeastasia-01.azurewebsites.net";

// Helper to decode JWT and check expiration and role
export function parseJwt(token) {
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

const api = axios.create({
  baseURL: API_BASE_URL,
  // Explicitly use XHR adapter for browser compatibility with axios 1.12.0
  // This prevents issues with fetch adapter trying to destructure undefined config
  adapter: 'xhr',
});

// Request interceptor: attach token, validate, handle expiration
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');

    if (token) {
      // Validate token format
      if (!token.includes('.') || token.split('.').length !== 3) {
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('tokenExpired'));
        // Create a cancellation error that axios 1.12.0 will recognize
        const cancelError = axios.CancelToken.source();
        cancelError.cancel('Invalid token format. Please log in again.');
        config.cancelToken = cancelError.token;
        return config; // Return config with cancelToken - axios will handle cancellation
      }

      // Parse and validate token
      const payload = parseJwt(token);

      if (!payload) {
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('tokenExpired'));
        const cancelError = axios.CancelToken.source();
        cancelError.cancel('Invalid token. Please log in again.');
        config.cancelToken = cancelError.token;
        return config;
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);

      if (!payload.exp || payload.exp < now) {
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('tokenExpired'));
        const cancelError = axios.CancelToken.source();
        cancelError.cancel('Session expired. Please log in again.');
        config.cancelToken = cancelError.token;
        return config;
      }

      // Token is valid - add to headers
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: handle token expiration and errors globally
api.interceptors.response.use(
  response => response,
  error => {
    // Skip handling if request was cancelled (including our own cancellations)
    if (axios.isCancel(error)) {
      // Only dispatch tokenExpired if it's not already being handled (e.g., during logout)
      // Check if token still exists to avoid duplicate events during logout
      if (localStorage.getItem('authToken')) {
        window.dispatchEvent(new CustomEvent('tokenExpired', { detail: error.message }));
      }
      return Promise.reject(error);
    }

    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (error.response && error.response.status === 401 && !isLoginRequest) {
      const hadToken = !!localStorage.getItem('authToken');
      if (hadToken) {
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('tokenExpired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Expose a global for quick access from legacy modules that don't import the helper.
// Useful for incremental migration. Teammates can override via VITE_API_BASE_URL in .env during local dev.
if (typeof window !== 'undefined') {
  // You can comment/uncomment the next line to force localhost during dev if needed:
  // window.__API_BASE__ = 'http://localhost:8080';
  window.__API_BASE__ = API_BASE_URL;
}