import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [courseName, setCourseName] = useState<string>("");

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
          .select("status, course_id, courses(title)")
          .eq("gateway_order_id", orderId)
          .single();

        if (error) throw error;

        if (payment?.status === "completed") {
          setStatus("success");
          setCourseName((payment as any).courses?.title || "your course");
        } else if (payment?.status === "failed") {
          setStatus("failed");
        } else {
          // Payment still pending, wait and retry
          setTimeout(verifyPayment, 2000);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setStatus("failed");
      }
    };

    verifyPayment();
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="text-center max-w-md mx-auto px-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Verifying Payment...</h1>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
              <p className="text-muted-foreground mb-8">
                You're now enrolled in {courseName}. Start learning today!
              </p>
              <div className="flex flex-col gap-4">
                <Button asChild size="lg">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/courses">Browse More Courses</Link>
                </Button>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
              <p className="text-muted-foreground mb-8">
                Something went wrong with your payment. Please try again or contact support.
              </p>
              <div className="flex flex-col gap-4">
                <Button asChild size="lg">
                  <Link to="/courses">Try Again</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
