import axios from "axios";

// Track if a user is currently logged in (set by AuthContext)
let isUserLoggedIn = false;

const API = axios.create({
  baseURL: import.meta.env.VITE_URL,
  withCredentials: true, // sends cookies automatically
});

// Function to update login state (called from AuthContext)
export const setUserLoggedInFlag = (flag) => {
  isUserLoggedIn = flag;
};

// ✅ Response interceptor for 401s
API.interceptors.response.use(
  response => response,
  error => {
    const url = error.config?.url;
    const status = error.response?.status;

    // ✅ Ignore 401 errors only for session-check endpoints
    const ignore401Endpoints = ["/admin/me", "/users/me"];

    if (status === 401 && ignore401Endpoints.includes(url)) {
      return Promise.resolve({ data: {} }); // Pretend success
    }

    // ✅ Only warn if user WAS logged in and token expired
    if (status === 401 && isUserLoggedIn) {
      console.warn("Unauthorized — likely session expired");
    }

    return Promise.reject(error);
  }
);

API.URL = import.meta.env.VITE_URL;
export default API;
