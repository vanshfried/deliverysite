import express from "express";
import mongoose from "mongoose";
import path from "path";
import createAdmin from "./routes/admin/createAdmin.js";
import dotenv from "dotenv";
import cors from "cors"; // <-- add this
import loginRoute from "./routes/admin/adminLogin.js";
import meRoute from "./routes/admin/me.js";
import cookieParser from "cookie-parser";
import logoutRoute from "./routes/admin/logout.js";
import usersRouter from "./routes/user/login.js";
import productRoutes from "./routes/admin/products/productRoutes.js";
import publicProductRoutes from "./routes/public/products.js";

dotenv.config();

const app = express();

// --- Middleware ---
app.use(express.json()); // parse JSON bodies
app.use(cookieParser());
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));
// --- CORS ---
app.use(
  cors({
    origin: "http://localhost:5173", // your frontend URL
    credentials: true, // if you want to send cookies/JWT
  })
);

// --- Routes ---
// Public products for users
app.use("/products", publicProductRoutes);

app.use("/adminlogin", loginRoute);
app.use("/create-admin", createAdmin);
app.use("/adminlogout", logoutRoute);
app.use("/admin", meRoute);
app.use("/users", usersRouter);
app.use("/admin/products", productRoutes);

// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Server Start ---
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
