import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import AdminStatistics from "./pages/AdminStatistics";
import AdminManagement from "./pages/AdminManagement";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminFormsPage from "./pages/AdminFormsPage";
import DesignerDashboard from "./pages/DesignerDashboard";
import DesignerFormsPage from "./pages/DesignerFormsPage";
import ConsentFormPage from "./pages/ConsentFormPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminStatistics /></ProtectedRoute>} />
            <Route path="/admin/management" element={<ProtectedRoute allowedRoles={['admin']}><AdminManagement /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/admin/forms" element={<ProtectedRoute allowedRoles={['admin']}><AdminFormsPage /></ProtectedRoute>} />
            <Route path="/designer" element={<ProtectedRoute allowedRoles={['designer']}><DesignerDashboard /></ProtectedRoute>} />
            <Route path="/designer/forms" element={<ProtectedRoute allowedRoles={['designer']}><DesignerFormsPage /></ProtectedRoute>} />
            <Route path="/forms/new" element={<ProtectedRoute allowedRoles={['admin', 'designer']}><ConsentFormPage /></ProtectedRoute>} />
            <Route path="/forms/:id" element={<ProtectedRoute allowedRoles={['admin', 'designer']}><ConsentFormPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
