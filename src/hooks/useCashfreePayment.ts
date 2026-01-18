import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

    try {
      // Load Cashfree SDK
      await loadCashfreeScript();

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please login to make a payment");
      }

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke("create-cashfree-order", {
        body: details,
      });

      if (error) throw error;

      const { paymentSessionId } = data;

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
