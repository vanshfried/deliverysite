import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import "./App.css";

// Pages
import LoginAdmin from "./pages/admin/pages/LoginAdmin";
import AdminDashboard from "./pages/admin/pages/AdminDashboard";
import SuperAdminDashboard from "./pages/admin/superAdmin/pages/SuperAdminDashboard";
import CreateAdmin from "./pages/admin/superAdmin/pages/createAdmin";
import AdminAllUsersPage from "./pages/admin/pages/AllUsersPage";
import AdminUserDetailsPage from "./pages/admin/pages/AdminUserDetailsPage"
import HomePage from "./pages/public/HomePage";
import UserLogin from "./pages/public/UserLogin";
import CreateProduct from "./pages/admin/pages/CreateProduct";
import AdminProductsPage from "./pages/admin/pages/AdminProductsPage";
import ProductDetails from "./pages/public/ProductDetails";
import EditProduct from "./pages/admin/pages/EditProduct";
import Cart from "./pages/public/privateuserpages/Cart";
import CreateSuperAdminExtras from "./pages/admin/superAdmin/pages/CreateSuperAdminExtras";
import SubCategoryPage from "./pages/public/SubCategoryPage";
import Settings from "./pages/public/privateuserpages/Settings";
import Checkout from "./pages/public/privateuserpages/Checkout";
import NotFound from "./components/NotFound";
import OrdersPage from "./pages/public/privateuserpages/Orders";
import OrderDetail from "./pages/public/privateuserpages/OrderDetail";
// Layout
import DynamicAdminLayout from "./pages/admin/components/DynamicAdminLayout";

// Auth + Protected
import { AuthProvider } from "./pages/admin/Context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoutes";
import UserProtectedRoute from "./pages/public/privateuserpages/UserProtectedRoute";
// User Header + Cart Context
import UserOnlyHeader from "./pages/public/UserOnlyHeader";
import { CartProvider } from "./pages/admin/Context/CartContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* ---------- Public Routes ---------- */}

            <Route
              path="/"
              element={
                <>
                  <UserOnlyHeader />
                  <HomePage />
                </>
              }
            />
            <Route
              path="*"
              element={
                <>
                  <UserOnlyHeader />
                  <NotFound />
                </>
              }
            />

            <Route
              path="/login"
              element={
                <>
                  <UserOnlyHeader />
                  <UserLogin />
                </>
              }
            />

            <Route
              path="/product/:slug"
              element={
                <>
                  <UserOnlyHeader />
                  <ProductDetails />
                </>
              }
            />

            <Route
              path="/subcategory/:slug"
              element={
                <>
                  <UserOnlyHeader />
                  <SubCategoryPage />
                </>
              }
            />

            {/* ✅ Cart is now protected */}
            <Route
              path="/cart"
              element={
                <UserProtectedRoute>
                  <UserOnlyHeader />
                  <Cart />
                </UserProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <UserProtectedRoute>
                  <UserOnlyHeader />
                  <OrdersPage />
                </UserProtectedRoute>
              }
            />
            <Route
              path="/orders/:slug"
              element={
                <UserProtectedRoute>
                  <UserOnlyHeader />
                  <OrderDetail />
                </UserProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <UserProtectedRoute>
                  <UserOnlyHeader />
                  <Settings />
                </UserProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <UserProtectedRoute>
                  <UserOnlyHeader />
                  <Checkout />
                </UserProtectedRoute>
              }
            />

            {/* ---------- Admin Login ---------- */}
            <Route path="/admin/login" element={<LoginAdmin />} />

            {/* ---------- Admin Routes ---------- */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <AdminDashboard />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/create-product"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <CreateProduct />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/products"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <AdminProductsPage />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <AdminAllUsersPage />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/user/:id"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <AdminUserDetailsPage />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/edit-product/:id"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <EditProduct />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />

            {/* ---------- Super Admin Routes ---------- */}
            <Route
              path="/admin/superadmin-dashboard"
              element={
                <ProtectedRoute requireSuper>
                  <DynamicAdminLayout>
                    <SuperAdminDashboard />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/create-admin"
              element={
                <ProtectedRoute requireSuper>
                  <DynamicAdminLayout>
                    <CreateAdmin />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/superadmin-products"
              element={
                <ProtectedRoute requireSuper>
                  <DynamicAdminLayout>
                    <AdminProductsPage />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/superadmin-extras"
              element={
                <ProtectedRoute requireSuper>
                  <DynamicAdminLayout>
                    <CreateSuperAdminExtras />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
