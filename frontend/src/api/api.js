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

// Response interceptor for 401s
API.interceptors.response.use(
  response => response,
  error => {
    // Only log if user was previously logged in
    if (error.response?.status === 401 && isUserLoggedIn) {
      console.warn("Unauthorized request - logging out user if logged in");
    }
    return Promise.reject(error);
  }
);

API.URL = import.meta.env.VITE_URL;
export default API;
