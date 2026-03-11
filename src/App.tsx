import { useEffect, useState, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CartProvider } from "@/contexts/CartContext";
import { PurchaseNotification } from "@/components/social-proof/PurchaseNotification";
import { FestivalDecorations } from "@/components/festival/FestivalDecorations";
import { SaleBanner } from "@/components/sales/SaleBanner";
import { AmbientAudio } from "@/components/audio/AmbientAudio";
import { LoginGiftModal } from "@/components/gift/LoginGiftModal";
import { WelcomePromotionModal } from "@/components/welcome/WelcomePromotionModal";
import { WelcomePopup } from "@/components/welcome/WelcomePopup";
import { NewUserOnboardingDialog } from "@/components/auth/NewUserOnboardingDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingAIMentor } from "@/components/ai/FloatingAIMentor";
import { AchievementUnlockToast } from "@/components/gamification/AchievementUnlockToast";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useContentProtection } from "@/hooks/useContentProtection";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { initializeGA4 } from "@/hooks/useGoogleAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
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
import VerifyCertificate from "./pages/VerifyCertificate";
import Sitemap from "./pages/Sitemap";
import Studio from "./pages/Studio";
import SheetReviews from "./pages/SheetReviews";
import SheetDetail from "./pages/SheetDetail";
import Forum from "./pages/Forum";
import ForumTopic from "./pages/ForumTopic";
import PortfolioBuilder from "./pages/PortfolioBuilder";
import PortfolioView from "./pages/PortfolioView";
import Internships from "./pages/Internships";
import Competitions from "./pages/Competitions";
import Roadmaps from "./pages/Roadmaps";
import StudentProfile from "./pages/StudentProfile";
import ResourceLibrary from "./pages/ResourceLibrary";
import Leaderboard from "./pages/Leaderboard";
import DailyChallenges from "./pages/DailyChallenges";
import PublicProfile from "./pages/PublicProfile";
import PortfolioDiscovery from "./pages/PortfolioDiscovery";
import CaseStudies from "./pages/CaseStudies";
import LearningMap from "./pages/LearningMap";
import Explore from "./pages/Explore";
import StudioRooms from "./pages/StudioRooms";
import { queryClient, prefetchCriticalData } from "@/lib/queryClient";

// Warm cache on app load
prefetchCriticalData().catch(() => {});

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
  useScrollReveal();
  useVisitorTracking();
  const { user, profile } = useAuth();
  const [giftData, setGiftData] = useState<any>(null);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeCampaign, setWelcomeCampaign] = useState<any>(null);
  const giftCheckDone = useRef(false);

  // Check for gift campaigns when user logs in — run only once per user session
  useEffect(() => {
    if (!user) { giftCheckDone.current = false; return; }
    if (giftCheckDone.current) return;
    giftCheckDone.current = true;

    const checkGiftCampaign = async () => {
      try {
        const { data: campaigns, error: campaignError } = await supabase
          .from('login_gift_campaigns')
          .select(`
            id, name, access_duration_hours, cta_text, custom_messages,
            eligible_users, random_percent, start_at, end_at, is_welcome_promotion, coupon_code,
            login_gift_campaign_courses(
              course_id,
              courses:course_id(id, title, slug, thumbnail_url)
            ),
            login_gift_campaign_ebooks(
              ebook_id,
              ebooks:ebook_id(id, title)
            )
          `)
          .eq('is_active', true);

        if (campaignError || !campaigns?.length) return;

        const nowDate = new Date();
        const activeCampaigns = campaigns.filter(c => {
          const startAt = new Date(c.start_at);
          const endAt = new Date(c.end_at);
          if (endAt < startAt) return nowDate >= startAt;
          return nowDate >= startAt && nowDate <= endAt;
        });

        if (!activeCampaigns.length) return;

        for (const campaign of activeCampaigns) {
          const { data: existingClaim } = await supabase
            .from('login_gift_claims').select('id')
            .eq('user_id', user.id).eq('campaign_id', campaign.id).maybeSingle();
          if (existingClaim) continue;

          if (campaign.eligible_users === 'new_only') {
            const { data: profile } = await supabase
              .from('profiles').select('created_at').eq('user_id', user.id).maybeSingle();
            if (!profile) continue;
            const createdAt = new Date(profile.created_at || 0);
            if (createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) continue;
          }

          if (campaign.eligible_users === 'random_percent' && campaign.random_percent) {
            if (Math.random() * 100 > campaign.random_percent) continue;
          }

          if (campaign.is_welcome_promotion) {
            const signupCode = user.user_metadata?.signup_promo_code;
            const campaignCode = campaign.coupon_code || 'WELCOME100';

            if (signupCode?.toUpperCase() !== campaignCode.toUpperCase()) {
              console.log('User not eligible for welcome promotion: code mismatch');
              continue;
            }

            setWelcomeCampaign(campaign);
            setShowWelcomeModal(true);
            break;
          }

          const messages = campaign.custom_messages as string[] || [];
          const randomMessage = messages.length > 0
            ? messages[Math.floor(Math.random() * messages.length)]
            : 'Welcome! Enjoy complimentary access to our courses.';

          const expiresAt = campaign.access_duration_hours
            ? new Date(Date.now() + campaign.access_duration_hours * 60 * 60 * 1000).toISOString()
            : campaign.end_at;

          const giftCourses = campaign.login_gift_campaign_courses
            ?.map((cc: any) => cc.courses).filter(Boolean) || [];
          if (!giftCourses.length) continue;

          const { error: claimError } = await supabase.from('login_gift_claims').insert({
            user_id: user.id, campaign_id: campaign.id,
            expires_at: expiresAt, shown_message: randomMessage,
          }).select().single();
          if (claimError) continue;

          const enrolledCourses: string[] = [];
          for (const course of giftCourses) {
            const { data: existing } = await supabase.from('enrollments').select('id')
              .eq('user_id', user.id).eq('course_id', course.id).maybeSingle();
            if (!existing) {
              await supabase.from('enrollments').insert({
                user_id: user.id, course_id: course.id, status: 'active',
                is_manual: true, granted_by: 'gift_campaign',
                granted_at: new Date().toISOString(), expires_at: expiresAt,
              });
              enrolledCourses.push(course.title);
            }
          }

          const { data: profile } = await supabase.from('profiles')
            .select('email, full_name').eq('user_id', user.id).single();
          if (profile?.email && enrolledCourses.length > 0) {
            supabase.functions.invoke('send-enrollment-email', {
              body: {
                email: profile.email,
                name: profile.full_name || user.email?.split('@')[0] || 'Student',
                courseName: enrolledCourses.length === 1 ? enrolledCourses[0] : `${enrolledCourses.length} Gift Courses`,
                courseSlug: giftCourses[0]?.slug || '', isFree: true, isGift: true,
              }
            }).catch(console.error);
          }

          setGiftData({ message: randomMessage, courses: giftCourses, expiresAt, ctaText: campaign.cta_text || 'Start Learning' });
          setShowGiftModal(true);
          break;
        }
      } catch (error) {
        console.error('Error checking gift campaign:', error);
      }
    };

    const timer = setTimeout(checkGiftCampaign, 1500);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setShowOnboarding(false);
      return;
    }

    const checkOnboarding = async () => {
      const { data } = await (supabase as any)
        .from('user_onboarding_intake')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      setShowOnboarding(!data);
    };

    void checkOnboarding();
  }, [user?.id]);

  return (
    <>
      <LoginGiftModal
        open={showGiftModal}
        onOpenChange={setShowGiftModal}
        giftData={giftData}
      />
      {user?.id && (
        <>
          {welcomeCampaign && (
            <WelcomePromotionModal
              open={showWelcomeModal}
              onOpenChange={setShowWelcomeModal}
              campaign={welcomeCampaign}
              userId={user.id}
            />
          )}
          <NewUserOnboardingDialog
            open={showOnboarding}
            onOpenChange={setShowOnboarding}
            userId={user.id}
            defaultName={profile?.full_name || user.email?.split('@')[0] || ''}
            onCompleted={() => setShowOnboarding(false)}
          />
        </>
      )}
    </>
  );
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        transition={{
          duration: 0.35,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/sitemap" element={<Sitemap />} />
          <Route path="/course/:slug" element={<CourseDetail />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/learn/:slug" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failed" element={<PaymentFailed />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Navigate to="/terms" replace />} />
          <Route path="/about" element={<Navigate to="/contact" replace />} />
          <Route path="/ebooks" element={<EbookBundle />} />
          <Route path="/ebook-payment-success" element={<EbookPaymentSuccess />} />
          <Route path="/ebook-payment-failed" element={<EbookPaymentFailed />} />
          <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
          <Route path="/sheets" element={<SheetReviews />} />
          <Route path="/sheets/:id" element={<SheetDetail />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<ForumTopic />} />
          <Route path="/portfolio/build" element={<ProtectedRoute><PortfolioBuilder /></ProtectedRoute>} />
          <Route path="/portfolio/:slug" element={<PortfolioView />} />
          <Route path="/internships" element={<Internships />} />
          <Route path="/competitions" element={<Competitions />} />
          <Route path="/roadmaps" element={<Roadmaps />} />
          <Route path="/profile/:userId" element={<StudentProfile />} />
          <Route path="/resources" element={<ResourceLibrary />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/challenges" element={<DailyChallenges />} />
          <Route path="/verify/:certNumber" element={<VerifyCertificate />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/portfolios" element={<PortfolioDiscovery />} />
          <Route path="/case-studies" element={<CaseStudies />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/learning-map" element={<LearningMap />} />
          <Route path="/studio-rooms" element={<ProtectedRoute><StudioRooms /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ErrorBoundary>
              <ScrollToTop />
              <AppContent />
              <WelcomePopup />
              <FestivalDecorations />
              <PurchaseNotification />
              <SaleBanner />
              <AnimatedRoutes />
              <AmbientAudio />
              <FloatingAIMentor />
              <AchievementUnlockToast />
            </ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
