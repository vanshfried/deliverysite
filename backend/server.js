import express from "express";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

// --- Admin routes ---
import createAdminRoute from "./routes/admin/createAdmin.js";
import adminLoginRoute from "./routes/admin/adminLogin.js";
import adminMeRoute from "./routes/admin/me.js";
import adminLogoutRoute from "./routes/admin/logout.js";
import adminProductRoutes from "./routes/admin/products/productRoutes.js";
import extraRoutes from "./routes/admin/products/extraRoutes.js"; // ✅ new

// --- Public routes ---
import publicProductRoutes from "./routes/public/products.js";

// --- User routes ---
import userRoutes from "./routes/user/userRoutes.js";
import cartRoutes from "./routes/user/cartRoutes.js";
import categoryTagAdminRoutes from "./routes/admin/products/categoryTagAdminRoutes.js";


dotenv.config();
const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies
  })
);

// --- Public routes ---
app.use("/products", publicProductRoutes);

// --- User routes ---
app.use("/users", userRoutes);
app.use("/api/cart", cartRoutes);

// --- Admin routes ---
// Authentication
app.use("/admin/login", adminLoginRoute);
app.use("/admin/logout", adminLogoutRoute);
app.use("/admin/me", adminMeRoute);
app.use("/admin/create-admin", createAdminRoute);

// Products
app.use("/admin/products", adminProductRoutes); // CRUD: create, update, delete products

// Extras (read-only, any admin)
app.use("/admin/products/extras", extraRoutes); // GET /categories, /tags

// Superadmin management for categories & tags
app.use("/admin/products/manage", categoryTagAdminRoutes); 
// POST/PUT/DELETE for /categories and /tags


// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
