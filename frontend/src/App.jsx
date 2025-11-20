import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from "react";
import "./App.css";

// 🔹 Public Pages
import HomePage from "./pages/public/HomePage";
import UserLogin from "./pages/public/UserLogin";
import ProductDetails from "./pages/public/ProductDetails";
import SubCategoryPage from "./pages/public/SubCategoryPage";
import NotFound from "./components/NotFound";

// 🔹 Private User Pages
import Cart from "./pages/public/privateuserpages/Cart";
import Checkout from "./pages/public/privateuserpages/Checkout";
import Settings from "./pages/public/privateuserpages/Settings";
import OrdersPage from "./pages/public/privateuserpages/Orders";
import OrderDetail from "./pages/public/privateuserpages/OrderDetail";

// 🔹 Admin Pages
import LoginAdmin from "./pages/admin/pages/LoginAdmin";
import AdminDashboard from "./pages/admin/pages/AdminDashboard";
import AdminProductsPage from "./pages/admin/pages/AdminProductsPage";
import AdminAllUsersPage from "./pages/admin/pages/AllUsersPage";
import AdminUserDetailsPage from "./pages/admin/pages/AdminUserDetailsPage";
import CreateProduct from "./pages/admin/pages/CreateProduct";
import EditProduct from "./pages/admin/pages/EditProduct";
import PendingOrders from "./pages/admin/pages/PendingOrders"; // ✅ Added here
import ActiveOrders from "./pages/admin/pages/ActiveOrders";
import DeliveryApplicants from "./pages/admin/deliverydata/pages/DeliveryApplicants";
import AllDeliveryAgents from "./pages/admin/deliverydata/pages/AllAgents";
import AdminStoreApplications from "./pages/admin/store/jsx/AdminStoreApplications";

// 🔹 Super Admin Pages
import SuperAdminDashboard from "./pages/admin/superAdmin/pages/SuperAdminDashboard";
import CreateAdmin from "./pages/admin/superAdmin/pages/CreateAdmin";
import CreateSuperAdminExtras from "./pages/admin/superAdmin/pages/CreateSuperAdminExtras";

// Deliveryboy pages

import DeliveryDashboard from "./pages/delivery/jsx/pages/DeliveryDashboard";
import DeliveryLogin from "./pages/delivery/jsx/pages/DeliveryLogin";
import DeliverySignUp from "./pages/delivery/jsx/pages/DeliverySignUp";

// 🔹 Layouts & Contexts
import DynamicAdminLayout from "./pages/admin/components/DynamicAdminLayout";
import { AuthProvider } from "./pages/admin/Context/AuthContext";
import { CartProvider } from "./pages/admin/Context/CartContext";
import ProtectedRoute from "./components/ProtectedRoutes";
import UserProtectedRoute from "./pages/public/privateuserpages/UserProtectedRoute";
import UserOnlyHeader from "./pages/public/UserOnlyHeader";

//Store Pages
import StoreOwnerDashboard from "./pages/Store/store-owner/Dashboard";
import StoreOwnerSignup from "./pages/Store/store-owner/Signup";
import StoreOwnerLogin from "./pages/Store/store-owner/Login";
import StoreOwnerProtectedRoute from "./pages/Store/store-owner/StoreOwnerProtectedRoute";

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

            {/* ---------- User Protected Routes ---------- */}
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
              path="/checkout"
              element={
                <UserProtectedRoute>
                  <UserOnlyHeader />
                  <Checkout />
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

            {/* ✅ Recent Orders page for live updates */}
            <Route
              path="/admin/pending-orders"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <PendingOrders />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/active-orders"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <ActiveOrders />
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
            <Route
              path="/admin/delivery-applicants"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <DeliveryApplicants />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/All-delivery-boys"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <AllDeliveryAgents />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/store-applications"
              element={
                <ProtectedRoute>
                  <DynamicAdminLayout>
                    <AdminStoreApplications />
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
              path="/admin/superadmin-extras"
              element={
                <ProtectedRoute requireSuper>
                  <DynamicAdminLayout>
                    <CreateSuperAdminExtras />
                  </DynamicAdminLayout>
                </ProtectedRoute>
              }
            />

            {/* ---------- Catch-all ---------- */}
            <Route
              path="*"
              element={
                <>
                  <UserOnlyHeader />
                  <NotFound />
                </>
              }
            />

            {/* Delivery pages */}
            <Route path="/delivery/signup" element={<DeliverySignUp />} />
            <Route path="/delivery/login" element={<DeliveryLogin />} />
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />

            {/* Store PAges all of them below */}
            {/* Store Owner Auth */}
            <Route path="/store-owner/signup" element={<StoreOwnerSignup />} />
            <Route path="/store-owner/login" element={<StoreOwnerLogin />} />

            {/* Protected (will need middleware later) */}
            <Route
              path="/store-owner/dashboard"
              element={
                <StoreOwnerProtectedRoute>
                  <StoreOwnerDashboard />
                </StoreOwnerProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
