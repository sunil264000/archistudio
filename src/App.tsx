import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { BackToTop } from "@/components/layout/BackToTop";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CartProvider } from "@/contexts/CartContext";
import { CouponProvider } from "@/contexts/CouponContext";
import { CouponBanner } from "@/components/coupon/CouponBanner";
import { CouponCelebrationModal } from "@/components/coupon/CouponCelebrationModal";
import { PurchaseNotification } from "@/components/social-proof/PurchaseNotification";
import { FestivalDecorations } from "@/components/festival/FestivalDecorations";
import { SaleBanner } from "@/components/sales/SaleBanner";
import { LoginGiftModal } from "@/components/gift/LoginGiftModal";
import { WelcomePromotionModal } from "@/components/welcome/WelcomePromotionModal";
import { WelcomePopup } from "@/components/welcome/WelcomePopup";
import { NewUserOnboardingDialog } from "@/components/auth/NewUserOnboardingDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingAIMentor } from "@/components/ai/FloatingAIMentor";
import { AchievementUnlockToast } from "@/components/gamification/AchievementUnlockToast";
import { LiveActivityPulse } from "@/components/ui/LiveActivityPulse";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useContentProtection } from "@/hooks/useContentProtection";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { initializeGA4 } from "@/hooks/useGoogleAnalytics";
import { useNetworkSpeed } from "@/hooks/useNetworkSpeed";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { queryClient, prefetchCriticalData } from "@/lib/queryClient";

// ─── Entry Pages (Eagerly loaded — minimal set for immediate paint) ───
import Gateway from "./pages/Gateway";

// ─── Lazy-loaded pages (code-split for faster initial load) ───
const Splash = lazy(() => import("./pages/Splash"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Courses = lazy(() => import("./pages/Courses"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const CoursePlayer = lazy(() => import("./pages/CoursePlayer"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));
const EbookPaymentSuccess = lazy(() => import("./pages/EbookPaymentSuccess"));
const EbookPaymentFailed = lazy(() => import("./pages/EbookPaymentFailed"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const EbookBundle = lazy(() => import("./pages/EbookBundle"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const Studio = lazy(() => import("./pages/Studio"));
const SheetReviews = lazy(() => import("./pages/SheetReviews"));
const SheetDetail = lazy(() => import("./pages/SheetDetail"));
const Forum = lazy(() => import("./pages/Forum"));
const ForumTopic = lazy(() => import("./pages/ForumTopic"));
const PortfolioBuilder = lazy(() => import("./pages/PortfolioBuilder"));
const PortfolioView = lazy(() => import("./pages/PortfolioView"));
const Internships = lazy(() => import("./pages/Internships"));
const Competitions = lazy(() => import("./pages/Competitions"));
const Roadmaps = lazy(() => import("./pages/Roadmaps"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const ResourceLibrary = lazy(() => import("./pages/ResourceLibrary"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const DailyChallenges = lazy(() => import("./pages/DailyChallenges"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const PortfolioDiscovery = lazy(() => import("./pages/PortfolioDiscovery"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const LearningMap = lazy(() => import("./pages/LearningMap"));
const Explore = lazy(() => import("./pages/Explore"));
const StudioRooms = lazy(() => import("./pages/StudioRooms"));
const QuickReview = lazy(() => import("./pages/QuickReview"));
const StudentMentorship = lazy(() => import("./pages/StudentMentorship"));
const StudioHubHome = lazy(() => import("./pages/studio-hub/StudioHubHome"));
const StudioHubBrowseProjects = lazy(() => import("./pages/studio-hub/BrowseProjects"));
const StudioHubProjectDetail = lazy(() => import("./pages/studio-hub/ProjectDetail"));
const StudioHubPostProject = lazy(() => import("./pages/studio-hub/PostProject"));
const StudioHubBecomeMember = lazy(() => import("./pages/studio-hub/BecomeMember"));
const StudioHubMembers = lazy(() => import("./pages/studio-hub/MembersDirectory"));
const StudioHubMemberProfile = lazy(() => import("./pages/studio-hub/MemberProfile"));
const StudioHubMyStudio = lazy(() => import("./pages/studio-hub/MyStudio"));
const StudioHubContractDetail = lazy(() => import("./pages/studio-hub/ContractDetail"));
const StudioHubPricing = lazy(() => import("./pages/studio-hub/PricingPage"));

// Warm cache on app load
prefetchCriticalData().catch(() => {});

// Idle-time prefetch for the most-clicked top-nav destinations so navigation
// feels instant. Runs after first paint, never blocks initial render.
if (typeof window !== 'undefined') {
  const warmChunks = () => {
    // Top nav destinations
    import('./pages/studio-hub/StudioHubHome');
    import('./pages/studio-hub/BrowseProjects');
    import('./pages/studio-hub/PricingPage');
    import('./pages/studio-hub/MembersDirectory');
    import('./pages/Courses');
    import('./pages/Explore');
    import('./pages/Auth');
    import('./pages/Dashboard');
    import('./pages/CourseDetail');
    import('./pages/Blog');
  };
  const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: any) => number);
  if (ric) ric(warmChunks, { timeout: 2500 });
  else setTimeout(warmChunks, 1500);
}

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

initAnalytics();

function PageLoader() {
  // Lightweight, on-brand skeleton — no spinner, no "LOADING" text.
  // Mimics the studio layout (top nav strip + hero + cards) so the transition
  // feels like the page is materialising rather than blocking.
  return (
    <div className="min-h-screen bg-background">
      {/* Subtle top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] overflow-hidden bg-transparent">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-accent to-transparent animate-[shimmer_1.1s_ease-in-out_infinite]" />
      </div>

      {/* Faux nav spacer */}
      <div className="h-14 border-b border-border/30" />

      <div className="container-wide py-12 space-y-10 animate-pulse">
        {/* Hero block */}
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="h-5 w-44 mx-auto rounded-full bg-muted/60" />
          <div className="h-10 md:h-12 w-full rounded-xl bg-muted/50" />
          <div className="h-10 md:h-12 w-3/4 mx-auto rounded-xl bg-muted/40" />
          <div className="h-4 w-2/3 mx-auto rounded bg-muted/30 mt-4" />
          <div className="flex gap-3 justify-center pt-3">
            <div className="h-11 w-36 rounded-full bg-muted/55" />
            <div className="h-11 w-32 rounded-full bg-muted/35" />
          </div>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 p-5 space-y-3 bg-card/40">
              <div className="h-32 rounded-xl bg-muted/40" />
              <div className="h-4 w-3/4 rounded bg-muted/40" />
              <div className="h-3 w-1/2 rounded bg-muted/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const GlobalBackground = ({ isSlow }: { isSlow: boolean }) => (
  <div className="fixed inset-0 pointer-events-none z-[-100] overflow-hidden bg-background noise-overlay">
    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxwYXRoIGQ9Ik02MCAwaC02MHY2MGg2MHYtNjB6bS0xIDF2NThoLTU4di01OGg1OHoiIGZpbGw9ImN1cnJlbnRDb2xvciIgZmlsbC1vcGFjaXR5PSIwLjA0Ii8+Cjwvc3ZnPg==')] opacity-[0.15] dark:opacity-[0.06] mix-blend-overlay" />
    
    {!isSlow && (
      <>
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute top-[30%] -right-[15%] w-[45%] h-[45%] rounded-full bg-blueprint/5 blur-[100px] mix-blend-screen" />
      </>
    )}
    
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] mix-blend-multiply" />
  </div>
);

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

            const { data: profileData } = await supabase
              .from('profiles').select('created_at').eq('user_id', user.id).maybeSingle();
            
            const isNewUser = profileData 
              ? new Date(profileData.created_at || 0) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
              : false;

            // Trigger if they explicitly used the code, OR if they are a new user and didn't use a DIFFERENT code
            const isExplicitMatch = signupCode?.toUpperCase() === campaignCode.toUpperCase();
            const isAutoMatch = isNewUser && (!signupCode || signupCode.trim() === '');

            if (!isExplicitMatch && !isAutoMatch) continue;

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

          setGiftData({ 
            message: randomMessage, 
            courses: giftCourses, 
            expiresAt, 
            ctaText: campaign.cta_text || 'Start Learning',
            campaignCode: campaign.coupon_code 
          });
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

function AnimatedRoutes({ isSlow }: { isSlow: boolean }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: isSlow ? 0.08 : 0.15, ease: 'easeOut' }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Gateway />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/learn" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/course/:slug" element={<CourseDetail />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/learn/:slug" element={<CoursePlayer />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/owner-dashboard" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
            <Route path="/studio-rooms" element={<ProtectedRoute><StudioRooms /></ProtectedRoute>} />
            <Route path="/portfolio/build" element={<ProtectedRoute><PortfolioBuilder /></ProtectedRoute>} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/ebooks" element={<EbookBundle />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:id" element={<ForumTopic />} />
            <Route path="/sheets" element={<SheetReviews />} />
            <Route path="/sheets/:id" element={<SheetDetail />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/challenges" element={<DailyChallenges />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/roadmaps" element={<Roadmaps />} />
            <Route path="/resources" element={<ResourceLibrary />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/learning-map" element={<LearningMap />} />
            <Route path="/quick-review" element={<QuickReview />} />
            <Route path="/mentorship" element={<StudentMentorship />} />
            <Route path="/case-studies" element={<CaseStudies />} />
            <Route path="/portfolio/:slug" element={<PortfolioView />} />
            <Route path="/portfolios" element={<PortfolioDiscovery />} />
            <Route path="/profile/:userId" element={<StudentProfile />} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/verify/:certNumber" element={<VerifyCertificate />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failed" element={<PaymentFailed />} />
            <Route path="/ebook-payment-success" element={<EbookPaymentSuccess />} />
            <Route path="/ebook-payment-failed" element={<EbookPaymentFailed />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/studio-hub" element={<StudioHubHome />} />
            <Route path="/studio-hub/projects" element={<StudioHubBrowseProjects />} />
            <Route path="/studio-hub/projects/:id" element={<StudioHubProjectDetail />} />
            <Route path="/studio-hub/post" element={<ProtectedRoute><StudioHubPostProject /></ProtectedRoute>} />
            <Route path="/studio-hub/become-member" element={<ProtectedRoute><StudioHubBecomeMember /></ProtectedRoute>} />
            <Route path="/studio-hub/members" element={<StudioHubMembers />} />
            <Route path="/studio-hub/members/:userId" element={<StudioHubMemberProfile />} />
            <Route path="/studio-hub/me" element={<ProtectedRoute><StudioHubMyStudio /></ProtectedRoute>} />
            <Route path="/studio-hub/contracts/:id" element={<ProtectedRoute><StudioHubContractDetail /></ProtectedRoute>} />
            <Route path="/studio-hub/pricing" element={<StudioHubPricing />} />
            <Route path="/privacy" element={<Navigate to="/terms" replace />} />
            <Route path="/about" element={<Navigate to="/contact" replace />} />
            <Route path="/marketplace" element={<Navigate to="/studio-hub" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => {
  const { isSlow } = useNetworkSpeed();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <CouponProvider>
                <SmoothScroll>
                  <CustomCursor />
                  <ErrorBoundary>
                    <GlobalBackground isSlow={isSlow} />
                    <ScrollProgress />
                    <ScrollToTop />
                    <AppContent />
                    <WelcomePopup />
                    <FestivalDecorations />
                    <PurchaseNotification />
                    <SaleBanner />
                    <CouponBanner />
                    <CouponCelebrationModal />
                    <AnimatedRoutes isSlow={isSlow} />
                    {!isSlow && (
                      <>
                        <FloatingAIMentor />
                        <AchievementUnlockToast />
                        <LiveActivityPulse />
                      </>
                    )}
                    <BackToTop />
                  </ErrorBoundary>
                </SmoothScroll>
              </CouponProvider>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
