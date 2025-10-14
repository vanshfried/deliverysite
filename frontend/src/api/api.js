// src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_URL, // your backend URL
  withCredentials: true, // important: sends cookies automatically
});

// No need to attach token manually anymore
// API.interceptors.request.use(...) can be removed
API.URL = import.meta.env.VITE_URL
export default API;
