import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ForgotPasswordPage from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import VendorsPage from "./pages/Vendors";
import RFQsPage from "./pages/RFQs";
import RFQCreatePage from "./pages/RFQCreate";
import RFQDetail from "./pages/RFQDetail";
import ApprovalsPage from "./pages/Approvals";
import PurchaseOrdersPage from "./pages/PurchaseOrders";
import InvoicesPage from "./pages/Invoices";
import ReportsPage from "./pages/Reports";
import NotificationsPage from "./pages/Notifications";
import ActivityPage from "./pages/Activity";
import UsersPage from "./pages/Users";
import VendorRFQs from "./pages/VendorRFQs";
import VendorQuotations, { VendorOrders } from "./pages/VendorQuotations";

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route path="/vendors" element={<ProtectedRoute roles={["ADMIN", "PROCUREMENT_OFFICER"]}><VendorsPage /></ProtectedRoute>} />

            <Route path="/rfqs" element={<ProtectedRoute roles={["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]}><RFQsPage /></ProtectedRoute>} />
            <Route path="/rfqs/new" element={<ProtectedRoute roles={["ADMIN", "PROCUREMENT_OFFICER"]}><RFQCreatePage /></ProtectedRoute>} />
            <Route path="/rfqs/:id" element={<ProtectedRoute roles={["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]}><RFQDetail /></ProtectedRoute>} />

            <Route path="/approvals" element={<ProtectedRoute roles={["ADMIN", "MANAGER"]}><ApprovalsPage /></ProtectedRoute>} />
            <Route path="/purchase-orders" element={<ProtectedRoute roles={["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]}><PurchaseOrdersPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/reports" element={<ProtectedRoute roles={["ADMIN", "PROCUREMENT_OFFICER", "MANAGER"]}><ReportsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/activity" element={<ProtectedRoute roles={["ADMIN"]}><ActivityPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute roles={["ADMIN"]}><UsersPage /></ProtectedRoute>} />

            <Route path="/vendor/rfqs" element={<ProtectedRoute roles={["VENDOR"]}><VendorRFQs /></ProtectedRoute>} />
            <Route path="/vendor/quotations" element={<ProtectedRoute roles={["VENDOR"]}><VendorQuotations /></ProtectedRoute>} />
            <Route path="/vendor/orders" element={<ProtectedRoute roles={["VENDOR"]}><VendorOrders /></ProtectedRoute>} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}