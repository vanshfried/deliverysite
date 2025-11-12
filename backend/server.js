import express from "express";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

// --- Admin routes ---
import createAdminRoute from "./routes/admin/createAdmin.js";
import adminLoginRoute from "./routes/admin/adminLogin.js";
import adminMeRoute from "./routes/admin/me.js";
import adminLogoutRoute from "./routes/admin/logout.js";
import adminProductRoutes from "./routes/admin/products/productRoutes.js";
import extraRoutes from "./routes/admin/products/extraRoutes.js";
import categoryTagAdminRoutes from "./routes/admin/products/categoryTagAdminRoutes.js";
import adminUserRoutes from "./routes/admin/adminUserRoutes.js";
import orderAdminRoutes from "./routes/admin/orderAdminRoutes.js"; // ✅ You missed adding this
import adminDeliveryRoutes from "./routes/admin/delivery/adminDeliveryRoutes.js"

// --- User & public routes ---
import orderRoutes from "./routes/order/orderRoutes.js";
import publicProductRoutes from "./routes/public/products.js";
import userRoutes from "./routes/user/userRoutes.js";
import cartRoutes from "./routes/user/cartRoutes.js";

// --- Delivery Partner routes ---
import deliveryAuthRoutes from "./routes/delivery/authRoutes.js";
import deliveryOrderRoutes from "./routes/delivery/deliveryRoutes.js";

dotenv.config();
const app = express();

// ✅ Setup HTTP + Socket.IO server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// ✅ Attach Socket.IO to Express
app.set("io", io);

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Serve static uploads
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// ✅ Public routes
app.use("/products", publicProductRoutes);

// ✅ User routes
app.use("/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/orders", orderRoutes);

// ✅ Admin routes
app.use("/admin/login", adminLoginRoute);
app.use("/admin/logout", adminLogoutRoute);
app.use("/admin/me", adminMeRoute);
app.use("/admin/create-admin", createAdminRoute);
app.use("/admin/products", adminProductRoutes);
app.use("/admin/products/extras", extraRoutes);
app.use("/admin/products/manage", categoryTagAdminRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin/orders", orderAdminRoutes); // ✅ now linked correctly
app.use("/api/admin/delivery", adminDeliveryRoutes); // all delivery routess for admin

// ✅ Delivery Partner routes
app.use("/api/delivery", deliveryAuthRoutes); // signup + login + logout + me
app.use("/api/delivery/orders", deliveryOrderRoutes); // delivery-specific order handling

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Socket.IO events

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
