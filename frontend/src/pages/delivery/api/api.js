// frontend/src/pages/delivery/api.js
import axios from "axios";

// Track delivery partner login (controlled by deliveryAuthContext)
let isDeliveryLoggedIn = false;

const API = axios.create({
  baseURL: import.meta.env.VITE_URL,
  withCredentials: true, // ✅ required for cookies
});

// Update login-state from AuthContext
export const setDeliveryLoggedInFlag = (flag) => {
  isDeliveryLoggedIn = flag;
};

// ✅ Silent on expected 401, warn only if session was active before
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      if (isDeliveryLoggedIn) {
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
