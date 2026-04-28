// Cashfree escrow funding for Studio Hub contracts
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

declare global {
  interface Window { Cashfree: any }
}

const loadCashfree = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.body.appendChild(s);
  });

export function useStudioHubEscrow() {
  const [funding, setFunding] = useState(false);

  const fundContract = async (params: {
    contractId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  }) => {
    setFunding(true);
    try {
      await loadCashfree();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in");

      const { data, error } = await supabase.functions.invoke("create-studio-hub-escrow", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: params,
      });
      if (error) throw error;
      const { paymentSessionId } = data || {};
      if (!paymentSessionId) throw new Error("No payment session");

      const cashfree = window.Cashfree({ mode: "production" });
      await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
      return { ok: true };
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not start payment");
      return { ok: false };
    } finally {
      setFunding(false);
    }
  };

  const verifyEscrow = async (orderId: string, contractId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-studio-hub-escrow", {
        body: { orderId, contractId },
      });
      if (error) throw error;
      return (data?.status || "pending") as "funded" | "pending" | "failed" | "not_found";
    } catch (e) {
      console.error(e);
      return "pending" as const;
    }
  };

  return { fundContract, verifyEscrow, funding };
}
