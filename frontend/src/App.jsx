import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React, { useState } from "react";
import "./App.css";

// Pages
import LoginAdmin from "./pages/admin/pages/LoginAdmin";
import AdminDashboard from "./pages/admin/pages/AdminDashboard";
import SuperAdminDashboard from "./pages/admin/superAdmin/pages/SuperAdminDashboard";
import CreateAdmin from "./pages/admin/superAdmin/pages/createAdmin";
import HomePage from "./pages/public/HomePage";
import UserLogin from "./pages/public/UserLogin";
import CreateProduct from "./pages/admin/pages/CreateProduct";
import AdminProductsPage from "./pages/admin/pages/AdminProductsPage";
import ProductDetails from "./pages/public/ProductDetails";
import EditProduct from "./pages/admin/pages/EditProduct";
import Cart from "./pages/public/Cart";
import CreateSuperAdminExtras from "./pages/admin/superAdmin/pages/CreateSuperAdminExtras";

// Layout
import DynamicAdminLayout from "./pages/admin/components/DynamicAdminLayout";

// Components
import UserOnlyHeader from "./pages/public/UserOnlyHeader";
import { CartProvider } from "./pages/admin/Context/CartContext"; // ✅ import CartProvider

// Protected route
import ProtectedRoute from "./components/ProtectedRoutes";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* ---------- Public pages with UserOnlyHeader ---------- */}
          <Route
            path="/"
            element={
              <>
                <UserOnlyHeader
                  isLoggedIn={isLoggedIn}
                  setIsLoggedIn={setIsLoggedIn}
                />
                <HomePage />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <UserOnlyHeader
                  isLoggedIn={isLoggedIn}
                  setIsLoggedIn={setIsLoggedIn}
                />
                <UserLogin setIsLoggedIn={setIsLoggedIn} />
              </>
            }
          />
          <Route
            path="/product/:id"
            element={
              <>
                <UserOnlyHeader
                  isLoggedIn={isLoggedIn}
                  setIsLoggedIn={setIsLoggedIn}
                />
                <ProductDetails />
              </>
            }
          />
          <Route
            path="/cart"
            element={
              <>
                <UserOnlyHeader
                  isLoggedIn={isLoggedIn}
                  setIsLoggedIn={setIsLoggedIn}
                />
                <Cart />
              </>
            }
          />

          {/* ---------- Admin login ---------- */}
          <Route path="/admin/login" element={<LoginAdmin />} />

          {/* ---------- Admin routes ---------- */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireSuper={false}>
                <DynamicAdminLayout>
                  <AdminDashboard />
                </DynamicAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-product"
            element={
              <ProtectedRoute requireSuper={false}>
                <DynamicAdminLayout>
                  <CreateProduct />
                </DynamicAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requireSuper={false}>
                <DynamicAdminLayout>
                  <AdminProductsPage />
                </DynamicAdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ---------- SuperAdmin routes ---------- */}
          <Route
            path="/admin/superadmin-dashboard"
            element={
              <ProtectedRoute requireSuper={true}>
                <DynamicAdminLayout>
                  <SuperAdminDashboard />
                </DynamicAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-admin"
            element={
              <ProtectedRoute requireSuper={true}>
                <DynamicAdminLayout>
                  <CreateAdmin />
                </DynamicAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/superadmin-products"
            element={
              <ProtectedRoute requireSuper={true}>
                <DynamicAdminLayout>
                  <AdminProductsPage />
                </DynamicAdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/superadmin-extras"
            element={
              <ProtectedRoute requireSuper={true}>
                <DynamicAdminLayout>
                  <CreateSuperAdminExtras />
                </DynamicAdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/edit-product/:id"
            element={
              <ProtectedRoute requireSuper={false}>
                <DynamicAdminLayout>
                  <EditProduct />
                </DynamicAdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;
