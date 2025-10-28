// src/api/api.js
import axios from "axios";

// Track user login (controlled by AuthContext)
let isUserLoggedIn = false;

const API = axios.create({
  baseURL: import.meta.env.VITE_URL,
  withCredentials: true, // ✅ required for cookies
});

// Update login-state from AuthContext
export const setUserLoggedInFlag = (flag) => {
  isUserLoggedIn = flag;
};

// ✅ Endpoints where 401 is acceptable (session restore checks)
const ignore401Endpoints = ["/admin/me", "/users/me"];

// ✅ Clean interceptor for handling unauthorized responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const urlPath = new URL(error.config?.url, import.meta.env.VITE_URL).pathname;
    const status = error.response?.status;

    if (status === 401) {
      if (ignore401Endpoints.includes(urlPath)) {
        // ✅ Treat missing session as "not logged in" but not error
        return Promise.resolve({ data: { success: false } });
      }

      if (isUserLoggedIn) {
        console.warn("⚠️ Session expired — user was logged in.");
      }
    }

    return Promise.reject(error);
  }
);

API.URL = import.meta.env.VITE_URL;
export default API;
