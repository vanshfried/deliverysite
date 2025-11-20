// frontend\src\pages\Store\api\api.js
import API from "./api";

export const storeOwnerSignup = (data) =>
  API.post("/store-owner/signup", data);

export const storeOwnerLogin = (data) =>
  API.post("/store-owner/login", data);

export const storeOwnerLogout = () =>
  API.post("/store-owner/logout");

export const storeOwnerMe = () =>
  API.get("/store-owner/me");
