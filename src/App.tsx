import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppProvider, useApp } from "@/contexts/AppContext";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import MfaVerify from "./pages/MfaVerify";
import ForgotPassword from "./pages/ForgotPassword";
import SsoLogin from "./pages/SsoLogin";
import Apps from "./pages/Apps";
import Overview from "./pages/Overview";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Credentials from "./pages/Credentials";
import Webhooks from "./pages/Webhooks";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  if (isAuthenticated) return <Navigate to="/apps" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/mfa" element={<PublicRoute><MfaVerify /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/sso" element={<PublicRoute><SsoLogin /></PublicRoute>} />
      <Route path="/apps" element={<ProtectedRoute><Apps /></ProtectedRoute>} />
      <Route path="/apps/:appId/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
      <Route path="/apps/:appId/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/apps/:appId/products/:productId" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
      <Route path="/apps/:appId/credentials" element={<ProtectedRoute><Credentials /></ProtectedRoute>} />
      <Route path="/apps/:appId/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
      <Route path="/apps/:appId/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
      <Route path="/apps/:appId/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/apps/:appId/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
