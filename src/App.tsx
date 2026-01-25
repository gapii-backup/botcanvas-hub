import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { UnsavedChangesProvider } from "@/contexts/UnsavedChangesContext";
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
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminWidgets from "./pages/admin/AdminWidgets";
import AdminWidgetEdit from "./pages/admin/AdminWidgetEdit";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminTickets from "./pages/admin/AdminTickets";

// Dashboard pages
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardConversations from "./pages/dashboard/DashboardConversations";
import DashboardAnalytics from "./pages/dashboard/DashboardAnalytics";
import DashboardContacts from "./pages/dashboard/DashboardContacts";
import DashboardSupport from "./pages/dashboard/DashboardSupport";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import DashboardSubscription from "./pages/dashboard/DashboardSubscription";
import DashboardUpgrade from "./pages/dashboard/DashboardUpgrade";
import DashboardHelp from "./pages/dashboard/DashboardHelp";
import DashboardKnowledge from "./pages/dashboard/DashboardKnowledge";
import DashboardDocs from "./pages/dashboard/DashboardDocs";
import DashboardPartners from "./pages/dashboard/DashboardPartners";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UnsavedChangesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register key="register" />} />
            <Route path="/login" element={<Login key="login" />} />
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
            {/* Dashboard Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardOverview />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/conversations"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardConversations />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardAnalytics />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/contacts"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardContacts />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardSettings />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/support"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardSupport />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/subscription"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardSubscription />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/narocnina"
              element={<Navigate to="/dashboard/upgrade" replace />}
            />
            <Route
              path="/dashboard/upgrade"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardUpgrade />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/knowledge"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardKnowledge />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/help"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardHelp />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/partners"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardPartners />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/docs"
              element={
                <ProtectedRoute>
                  <DashboardGuard>
                    <DashboardDocs />
                  </DashboardGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-success"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
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
              path="/admin/users"
              element={
                <AdminGuard>
                  <AdminUsers />
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
            <Route
              path="/admin/tickets"
              element={
                <AdminGuard>
                  <AdminTickets />
                </AdminGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UnsavedChangesProvider>
  </AuthProvider>
  </QueryClientProvider>
);

export default App;
