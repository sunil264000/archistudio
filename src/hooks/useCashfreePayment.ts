import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackPurchaseAttempt, updatePurchaseAttempt } from "@/hooks/useLiveActivity";

declare global {
  interface Window {
    Cashfree: any;
  }
}

interface PaymentDetails {
  courseId: string; // course slug
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Optional course metadata (helps backend create course row if missing)
  courseTitle?: string;
  courseShortDescription?: string;
  courseDescription?: string;
  courseLevel?: string;
}

export const useCashfreePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadCashfreeScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Cashfree) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async (details: PaymentDetails) => {
    setIsLoading(true);
    let attemptId: string | null = null;

    try {
      // Load Cashfree SDK
      await loadCashfreeScript();

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please login to make a payment");
      }

      // Get course ID from slug for tracking
      const { data: courseData } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', details.courseId)
        .single();

      // Track purchase attempt
      if (courseData?.id) {
        attemptId = await trackPurchaseAttempt(
          session.user.id,
          courseData.id,
          details.amount,
          'initiated'
        );
      }

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke("create-cashfree-order", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: details,
      });

      if (error) {
        // Track failed attempt
        if (attemptId) {
          await updatePurchaseAttempt(attemptId, 'failed', { error: error.message });
        }
        throw error;
      }

      const { paymentSessionId } = data;

      // Update attempt to payment started
      if (attemptId) {
        await updatePurchaseAttempt(attemptId, 'payment_started', { paymentSessionId });
      }

      // Initialize Cashfree checkout
      const cashfree = window.Cashfree({
        mode: "production", // Change to "sandbox" for testing
      });

      await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

    } catch (error: any) {
      console.error("Payment error:", error);
      
      // Track failed attempt
      if (attemptId) {
        await updatePurchaseAttempt(attemptId, 'failed', { error: error.message });
      }
      
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { initiatePayment, isLoading };
};
