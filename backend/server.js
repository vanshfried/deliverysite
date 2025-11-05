import express from "express";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http"; // ✅ needed for socket.io server
import { Server } from "socket.io";

// --- Admin routes ---
import createAdminRoute from "./routes/admin/createAdmin.js";
import adminLoginRoute from "./routes/admin/adminLogin.js";
import adminMeRoute from "./routes/admin/me.js";
import adminLogoutRoute from "./routes/admin/logout.js";
import adminProductRoutes from "./routes/admin/products/productRoutes.js";
import extraRoutes from "./routes/admin/products/extraRoutes.js";
import categoryTagAdminRoutes from "./routes/admin/products/categoryTagAdminRoutes.js";
import orderRoutes from "./routes/order/orderRoutes.js";
// --- Public routes ---
import publicProductRoutes from "./routes/public/products.js";
import adminUserRoutes from "./routes/admin/adminUserRoutes.js";
// --- User routes ---
import userRoutes from "./routes/user/userRoutes.js";
import cartRoutes from "./routes/user/cartRoutes.js";

dotenv.config();
const app = express();

// ✅ Create HTTP server for socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // your frontend URL
    credentials: true,
  },
});

// ✅ Make io accessible in routes
app.set("io", io);

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Static files
app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));

// ✅ Public Routes
app.use("/products", publicProductRoutes);

// ✅ User Routes
app.use("/users", userRoutes);
app.use("/api/cart", cartRoutes);

// ✅ Admin Routes
app.use("/admin/login", adminLoginRoute);
app.use("/admin/logout", adminLogoutRoute);
app.use("/admin/me", adminMeRoute);
app.use("/admin/create-admin", createAdminRoute);
app.use("/admin/products", adminProductRoutes);
app.use("/admin/products/extras", extraRoutes);
app.use("/admin/products/manage", categoryTagAdminRoutes);
app.use("/api/admin", adminUserRoutes);

// ✅ Order Routes
app.use("/orders", orderRoutes);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Socket.IO connection logs
io.on("connection", (socket) => {
  console.log("⚡ New client connected", socket.id);

  socket.on("disconnect", () => {
    console.log("⚡ Client disconnected", socket.id);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
