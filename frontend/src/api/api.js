// src/api/api.js
import axios from "axios";

// Track user login (controlled by AuthContext)
let isUserLoggedIn = false;

const API = axios.create({
  baseURL: import.meta.env.VITE_URL,
  withCredentials: true, // ✅ required for cookies
});
export const getAllStores = () => API.get("/stores");

// Update login-state from AuthContext
export const setUserLoggedInFlag = (flag) => {
  isUserLoggedIn = flag;
};

// ✅ Silent on expected 401, warn only if session was active before
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      if (isUserLoggedIn) {
        console.warn("⚠️ Session expired — please login again");
      }
      // ✅ Silent fail for unauthenticated state
      return Promise.resolve(null);
    }

    return Promise.reject(error);
  }
);

API.URL = import.meta.env.VITE_URL;
export default API;
