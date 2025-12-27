import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardGuard } from "@/components/DashboardGuard";
import { PricingGuard } from "@/components/guards/PricingGuard";
import { CustomizeGuard } from "@/components/guards/CustomizeGuard";
import { AdminGuard } from "@/components/guards/AdminGuard";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import Customize from "./pages/Customize";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminWidgets from "./pages/admin/AdminWidgets";
import AdminWidgetEdit from "./pages/admin/AdminWidgetEdit";
import AdminPayments from "./pages/admin/AdminPayments";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <PricingGuard>
                    <Pricing />
                  </PricingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customize/*"
              element={
                <ProtectedRoute>
                  <CustomizeGuard>
                    <Customize />
                  </CustomizeGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <Dashboard />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <Dashboard />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/widgets"
              element={
                <AdminGuard>
                  <AdminWidgets />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/widgets/:id"
              element={
                <AdminGuard>
                  <AdminWidgetEdit />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <AdminGuard>
                  <AdminPayments />
                </AdminGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
