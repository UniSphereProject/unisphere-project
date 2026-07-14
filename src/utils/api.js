import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL,
  withCredentials: true, // required for refresh-token cookie
});

// ── Request interceptor: attach Bearer token ─────────────────────────────────
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ─────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry for login / refresh / register endpoints
    const skipUrls = ["/api/auth/login", "/api/auth/refresh", "/api/auth/register"];
    if (
      error.response?.status !== 401 ||
      skipUrls.some((url) => originalRequest.url?.includes(url)) ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue up while another refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return API(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = res.data?.access_token;
      localStorage.setItem("token", newToken);
      API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return API(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh failed — force logout
      localStorage.removeItem("token");
      window.location.href = "/";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default API;
