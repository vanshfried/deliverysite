// D:\codeandstufff\Moneymakers\deliverysite\frontend\src\pages\Store\api\api.js
import axios from "axios";

// Track store-owner login (controlled by StoreOwnerAuthContext maybe)
let isStoreOwnerLoggedIn = false;

const API = axios.create({
  baseURL: import.meta.env.VITE_URL,
  withCredentials: true, // required for cookies
});

// Update login state
export const setStoreOwnerLoggedInFlag = (flag) => {
  isStoreOwnerLoggedIn = flag;
};

// Silent handler for unauthorized
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      if (isStoreOwnerLoggedIn) {
        console.warn("⚠️ Store Owner session expired — please login again");
      }
      return Promise.resolve(null);
    }

    return Promise.reject(error);
  }
);

API.URL = import.meta.env.VITE_URL;
export default API;
