import express from "express";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

// Admin routes
import createAdminRoute from "./routes/admin/createAdmin.js";
import adminLoginRoute from "./routes/admin/adminLogin.js";
import adminMeRoute from "./routes/admin/me.js";
import adminLogoutRoute from "./routes/admin/logout.js";
import adminProductRoutes from "./routes/admin/products/productRoutes.js";

// Public product routes
import publicProductRoutes from "./routes/public/products.js";

// User routes (OTP + /me)
import userRoutes from "./routes/user/userRoutes.js"; // renamed for clarity

// Cart routes
import cartRoutes from "./routes/user/cartRoutes.js";

dotenv.config();
const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // send cookies automatically
  })
);

// --- Public routes ---
app.use("/products", publicProductRoutes);

// --- User routes ---
app.use("/users", userRoutes); // handles: /users/otp, /users/verify-otp, /users/logout, /users/me

// --- Cart routes (requires authentication) ---
app.use("/api/cart", cartRoutes); // mounted at /api/cart

// --- Admin routes ---
app.use("/admin/login", adminLoginRoute); // POST login
app.use("/admin/logout", adminLogoutRoute); // POST logout
app.use("/admin/me", adminMeRoute); // GET current admin
app.use("/admin/create-admin", createAdminRoute); // POST create admin
app.use("/admin/products", adminProductRoutes); // CRUD products

// --- MongoDB connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Server start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
