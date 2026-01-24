import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, XCircle, GraduationCap, Clock, Receipt, ArrowRight, Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { courses } from "@/data/courses";
import { format } from "date-fns";
import { motion } from "framer-motion";

const MAX_RETRY_COUNT = 15; // Max 30 seconds (15 * 2 seconds)
const REDIRECT_DELAY = 8; // seconds

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");
  const courseSlugParam = searchParams.get("course");
  
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading");
  const [courseName, setCourseName] = useState<string>("");
  const [courseSlug, setCourseSlug] = useState<string>("");
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number;
    orderId: string;
    paymentDate: string;
    customerName: string;
    customerEmail: string;
  } | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(REDIRECT_DELAY);
  const retryCount = useRef(0);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setStatus("failed");
        return;
      }

      try {
        // Check payment status in database
        const { data: payment, error } = await supabase
          .from("payments")
          .select("status, course_id, amount, created_at, metadata, courses(title, slug)")
          .eq("gateway_order_id", orderId)
          .single();

        if (error) throw error;

        const dbTitle = (payment as any).courses?.title as string | undefined;
        const dbSlug = (payment as any).courses?.slug as string | undefined;
        const slug = courseSlugParam || (payment as any).metadata?.course_slug as string | undefined || dbSlug;
        const localCourse = slug ? courses.find((c) => c.slug === slug) : undefined;
        const localTitle = localCourse?.title;
        const metadata = (payment as any).metadata || {};

        if (payment?.status === "completed") {
          setStatus("success");
          setCourseName(dbTitle || localTitle || "your course");
          setCourseSlug(slug || "");
          setPaymentDetails({
            amount: Number(payment.amount) || 0,
            orderId: orderId,
            paymentDate: payment.created_at || new Date().toISOString(),
            customerName: metadata.customer_name || "Customer",
            customerEmail: metadata.customer_email || "",
          });
        } else if (payment?.status === "failed") {
          setStatus("failed");
        } else {
          // Payment still pending
          retryCount.current += 1;
          
          if (retryCount.current >= MAX_RETRY_COUNT) {
            // After max retries, treat as cancelled/timeout
            setStatus("cancelled");
            return;
          }
          
          // Wait and retry
          setTimeout(verifyPayment, 2000);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [orderId, courseSlugParam]);

  // Auto-redirect countdown for successful payments
  useEffect(() => {
    if (status !== "success" || !courseSlug) return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/course-player/${courseSlug}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, courseSlug, navigate]);

  const progressPercentage = ((REDIRECT_DELAY - redirectCountdown) / REDIRECT_DELAY) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/95">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-2xl mx-auto">
          {status === "loading" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Verifying Payment...</h1>
              <p className="text-muted-foreground mb-4">
                Please wait while we confirm your payment.
              </p>
              <p className="text-sm text-muted-foreground">
                Attempt {retryCount.current + 1} of {MAX_RETRY_COUNT}
              </p>
            </motion.div>
          )}

          {status === "success" && paymentDetails && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Success Header */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                    <CheckCircle className="h-20 w-20 text-green-500 relative" />
                  </div>
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mt-6 mb-2"
                >
                  Payment Successful! 🎉
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground"
                >
                  Thank you for your purchase. You now have full access to the course.
                </motion.p>
              </div>

              {/* Invoice Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Receipt className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Order Confirmation</span>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {/* Course Info */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{courseName}</h3>
                        <p className="text-sm text-muted-foreground">Lifetime Access</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Order Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Order ID</p>
                        <p className="font-mono text-xs mt-1 break-all">{paymentDetails.orderId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium mt-1">
                          {format(new Date(paymentDetails.paymentDate), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium mt-1">{paymentDetails.customerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium mt-1 break-all text-xs">{paymentDetails.customerEmail}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Amount */}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="text-2xl font-bold text-green-500">
                        ₹{paymentDetails.amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Invoice Note */}
                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                      <p>📧 A confirmation email with invoice details has been sent to your email address.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Auto-redirect Progress */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Redirecting to your course in {redirectCountdown}s...
                  </span>
                  <span className="text-primary font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button asChild size="lg" className="flex-1">
                  <Link to={`/course-player/${courseSlug}`}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Learning Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="flex-1">
                  <Link to="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </motion.div>

              {/* What's Next */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-muted/30 rounded-lg p-4 space-y-3"
              >
                <h4 className="font-medium">What's next?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Access all course lessons and materials
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Download resources and project files
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Track your progress in the dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Earn a certificate upon completion
                  </li>
                </ul>
              </motion.div>
            </motion.div>
          )}

          {status === "failed" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
              <p className="text-muted-foreground mb-8">
                Something went wrong with your payment. Please try again or contact support.
              </p>
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <Button asChild size="lg">
                  <Link to="/courses">Try Again</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </motion.div>
          )}

          {status === "cancelled" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <XCircle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Payment Cancelled or Timed Out</h1>
              <p className="text-muted-foreground mb-8">
                Your payment was cancelled or could not be verified. No charges were made to your account.
              </p>
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <Button asChild size="lg">
                  <Link to={courseSlugParam ? `/course/${courseSlugParam}` : "/courses"}>
                    Try Again
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;