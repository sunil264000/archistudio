import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { PurchaseNotification } from "@/components/social-proof/PurchaseNotification";
import { FestivalDecorations } from "@/components/festival/FestivalDecorations";
import { useContentProtection } from "@/hooks/useContentProtection";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CoursePlayer from "./pages/CoursePlayer";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Refunds from "./pages/Refunds";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useContentProtection();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppContent />
            <FestivalDecorations />
            <PurchaseNotification />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/course/:slug" element={<CourseDetail />} />
              <Route path="/learn/:slug" element={<CoursePlayer />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-failed" element={<PaymentFailed />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refunds" element={<Refunds />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
