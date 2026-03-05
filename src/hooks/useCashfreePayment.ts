import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackPurchaseAttempt, updatePurchaseAttempt } from "@/hooks/useLiveActivity";

declare global {
  interface Window {
    Cashfree: any;
  }
}

export interface PaymentDetails {
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
  couponCode?: string;
}

export interface PaymentResult {
  success: boolean;
  isFree?: boolean; // server says coupon made it free
  error?: string;
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

  const initiatePayment = async (details: PaymentDetails): Promise<PaymentResult> => {
    setIsLoading(true);
    let attemptId: string | null = null;
    let result: PaymentResult = { success: false };

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

      // Track abandoned cart for recovery emails
      try {
        await supabase.from('abandoned_carts').insert({
          user_id: session.user.id,
          course_slug: details.courseId,
          course_title: details.courseTitle || details.courseId,
          amount: details.amount,
          customer_email: details.customerEmail,
          customer_name: details.customerName,
        });
      } catch (e) {
        console.log('Abandoned cart tracking skipped:', e);
      }

      // Create order via edge function.
      // IMPORTANT: Do NOT send `amount` — the server always fetches the
      // authoritative price from the DB and applies the coupon itself.
      // Sending a pre-discounted amount would cause the server to skip its
      // own coupon logic (hasClientAmount=true branch).
      const edgeFunctionBody = {
        courseId: details.courseId,
        customerName: details.customerName,
        customerEmail: details.customerEmail,
        customerPhone: details.customerPhone,
        couponCode: details.couponCode,
        // courseTitle etc. are metadata only, safe to include
        courseTitle: details.courseTitle,
        courseShortDescription: details.courseShortDescription,
        courseDescription: details.courseDescription,
        courseLevel: details.courseLevel,
        // amount intentionally omitted so server computes it from DB
      };

      const { data, error } = await supabase.functions.invoke("create-cashfree-order", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: edgeFunctionBody,
      });

      if (error) {
        // Check if server says coupon made it free (422 isFree)
        const errBody = (error as any)?.context?.body || "";
        try {
          const parsed = typeof errBody === "string" ? JSON.parse(errBody) : errBody;
          if (parsed?.isFree) {
            result = { success: false, isFree: true };
            return result;
          }
        } catch (_) { /* ignore parse errors */ }

        // Track failed attempt
        if (attemptId) {
          await updatePurchaseAttempt(attemptId, 'failed', { error: error.message });
        }
        throw error;
      }

      // Also check if data itself says isFree (edge function may return it in 2xx too)
      if (data?.isFree) {
        result = { success: false, isFree: true };
        return result;
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

      result = { success: true };

    } catch (error: any) {
      console.error("Payment error:", error);

      // Track failed attempt
      if (attemptId) {
        await updatePurchaseAttempt(attemptId, 'failed', { error: error.message });
      }

      result = { success: false, error: error.message };

      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }

    return result;
  };

  return { initiatePayment, isLoading };
};
