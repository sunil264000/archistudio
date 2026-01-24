import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Download, 
  Loader2, 
  XCircle,
  FileText,
  BookOpen,
  ArrowRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

const MAX_RETRY_COUNT = 15;
const REDIRECT_DELAY = 8;

interface PaymentDetails {
  amount: number;
  orderId: string;
  paymentDate: string;
  bookCount: number;
  isFullBundle: boolean;
}

const EbookPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");
  
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(REDIRECT_DELAY);
  const retryCount = useRef(0);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setStatus("failed");
        return;
      }

      try {
        // Check ebook_purchases status
        const { data: purchase, error } = await supabase
          .from("ebook_purchases")
          .select("status, total_amount, created_at, ebook_ids, is_full_bundle")
          .eq("payment_id", orderId)
          .single();

        if (error) throw error;

        if (purchase?.status === "completed") {
          setStatus("success");
          setPaymentDetails({
            amount: Number(purchase.total_amount) || 0,
            orderId: orderId,
            paymentDate: purchase.created_at || new Date().toISOString(),
            bookCount: purchase.ebook_ids?.length || 0,
            isFullBundle: purchase.is_full_bundle || false,
          });
        } else if (purchase?.status === "failed") {
          setStatus("failed");
        } else {
          // Payment still pending
          retryCount.current += 1;
          
          if (retryCount.current >= MAX_RETRY_COUNT) {
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
  }, [orderId]);

  // Auto-redirect countdown
  useEffect(() => {
    if (status !== "success") return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-lg">
          {status === "loading" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
              <p className="text-muted-foreground mb-4">
                Please wait while we confirm your purchase...
              </p>
              <p className="text-xs text-muted-foreground">
                Attempt {retryCount.current + 1} of {MAX_RETRY_COUNT}
              </p>
            </motion.div>
          )}

          {status === "success" && paymentDetails && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
                <CheckCircle className="h-20 w-20 text-success relative" />
              </div>
              
              <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-8">
                Your eBooks are ready to download
              </p>

              {/* Invoice Card */}
              <Card className="mb-6 border-success/30 bg-gradient-to-br from-success/5 to-background">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                    <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-success" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Purchase Invoice</p>
                      <p className="text-xs text-muted-foreground">{orderId}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{new Date(paymentDetails.paymentDate).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Package</span>
                      <span className="font-medium">
                        {paymentDetails.isFullBundle 
                          ? 'Complete Bundle' 
                          : `${paymentDetails.bookCount} eBook${paymentDetails.bookCount > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border/50">
                      <span className="font-medium">Total Paid</span>
                      <span className="text-xl font-bold text-success">
                        ₹{paymentDetails.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Auto-redirect Progress */}
              <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm">Redirecting to dashboard in {redirectCountdown}s</span>
                </div>
                <Progress value={(1 - redirectCountdown / REDIRECT_DELAY) * 100} className="h-1.5" />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/dashboard">
                    <Download className="h-4 w-4" />
                    Download eBooks Now
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/ebooks">
                    <BookOpen className="h-4 w-4" />
                    Browse More eBooks
                  </Link>
                </Button>
              </div>
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
                  <Link to="/ebooks">Try Again</Link>
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
                Your payment was cancelled or could not be verified. No charges were made.
              </p>
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <Button asChild size="lg">
                  <Link to="/ebooks">Try Again</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Contact Support</Link>
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

export default EbookPaymentSuccess;
