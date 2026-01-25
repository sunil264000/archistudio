import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { PurchaseNotification } from "@/components/social-proof/PurchaseNotification";
import { FestivalDecorations } from "@/components/festival/FestivalDecorations";
import { SalesPopup } from "@/components/sales/SalesPopup";
import { AmbientAudio } from "@/components/audio/AmbientAudio";
import { LoginGiftModal } from "@/components/gift/LoginGiftModal";
import { useContentProtection } from "@/hooks/useContentProtection";
import { initializeGA4 } from "@/hooks/useGoogleAnalytics";
import { supabase } from "@/integrations/supabase/client";
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
import EbookPaymentSuccess from "./pages/EbookPaymentSuccess";
import EbookPaymentFailed from "./pages/EbookPaymentFailed";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import EbookBundle from "./pages/EbookBundle";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize Google Analytics
const initAnalytics = async () => {
  try {
    const { data } = await supabase.functions.invoke('get-analytics-config');
    if (data?.enabled && data?.ga4_measurement_id) {
      initializeGA4(data.ga4_measurement_id);
    }
  } catch (error) {
    console.log('Analytics config not available');
  }
};

// Call on app load
initAnalytics();

const AppContent = () => {
  useContentProtection();
  const { user } = useAuth();
  const [giftData, setGiftData] = useState<any>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);

  // Check for gift campaigns when user logs in
  useEffect(() => {
    const checkGiftCampaign = async () => {
      if (!user) return;

      try {
        const now = new Date().toISOString();

        // Get active campaigns
        const { data: campaigns } = await supabase
          .from('login_gift_campaigns')
          .select(`
            id,
            name,
            access_duration_hours,
            cta_text,
            custom_messages,
            eligible_users,
            random_percent,
            end_at,
            login_gift_campaign_courses(
              course_id,
              courses:course_id(id, title, slug, thumbnail_url)
            )
          `)
          .eq('is_active', true)
          .lte('start_at', now)
          .gte('end_at', now);

        if (!campaigns || campaigns.length === 0) return;

        for (const campaign of campaigns) {
          // Check if user already claimed this campaign
          const { data: existingClaim } = await supabase
            .from('login_gift_claims')
            .select('id')
            .eq('user_id', user.id)
            .eq('campaign_id', campaign.id)
            .maybeSingle();

          if (existingClaim) continue;

          // Check eligibility
          if (campaign.eligible_users === 'new_only') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('created_at')
              .eq('user_id', user.id)
              .single();
            
            const createdAt = new Date(profile?.created_at || 0);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (createdAt < oneDayAgo) continue;
          }

          if (campaign.eligible_users === 'random_percent' && campaign.random_percent) {
            if (Math.random() * 100 > campaign.random_percent) continue;
          }

          // Get random message
          const messages = campaign.custom_messages as string[] || [];
          const randomMessage = messages.length > 0 
            ? messages[Math.floor(Math.random() * messages.length)]
            : 'Welcome! Enjoy complimentary access to our courses.';

          // Calculate expiry
          const expiresAt = campaign.access_duration_hours
            ? new Date(Date.now() + campaign.access_duration_hours * 60 * 60 * 1000).toISOString()
            : campaign.end_at;

          // Create claim
          await supabase.from('login_gift_claims').insert({
            user_id: user.id,
            campaign_id: campaign.id,
            expires_at: expiresAt,
            shown_message: randomMessage,
          });

          // Get courses for this campaign
          const courses = campaign.login_gift_campaign_courses
            ?.map((cc: any) => cc.courses)
            .filter(Boolean) || [];

          if (courses.length > 0) {
            setGiftData({
              message: randomMessage,
              courses,
              expiresAt,
              ctaText: campaign.cta_text || 'Start Learning',
            });
            setShowGiftModal(true);
          }

          break; // Only process first valid campaign
        }
      } catch (error) {
        console.error('Error checking gift campaign:', error);
      }
    };

    checkGiftCampaign();
  }, [user]);

  return (
    <>
      <LoginGiftModal
        open={showGiftModal}
        onOpenChange={setShowGiftModal}
        giftData={giftData}
      />
    </>
  );
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
            <SalesPopup />
            <AmbientAudio />
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
              <Route path="/ebooks" element={<EbookBundle />} />
              <Route path="/ebook-payment-success" element={<EbookPaymentSuccess />} />
              <Route path="/ebook-payment-failed" element={<EbookPaymentFailed />} />
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
