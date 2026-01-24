import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify Cashfree webhook signature
async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secretKey: string
): Promise<boolean> {
  if (!signature || !timestamp) {
    console.error("Missing signature or timestamp headers");
    return false;
  }

  // Check timestamp is not too old (5 minutes)
  const webhookTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - webhookTime) > 300) {
    console.error("Webhook timestamp too old");
    return false;
  }

  try {
    // Cashfree signature verification: HMAC-SHA256 of timestamp + rawBody
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureData = encoder.encode(timestamp + rawBody);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, signatureData);
    
    // Convert to base64
    const computedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return signature === computedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the raw body for signature verification
    const rawBody = await req.text();
    
    // Get webhook signature headers
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    
    if (!secretKey) {
      console.error("CASHFREE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, signature, timestamp, secretKey);
    
    if (!isValid) {
      console.error("Invalid webhook signature", { 
        hasSignature: !!signature, 
        hasTimestamp: !!timestamp,
        sourceIP: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip")
      });
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = JSON.parse(rawBody);
    console.log("Cashfree webhook received (verified):", JSON.stringify(payload));

    const { data } = payload;
    
    if (!data || !data.order) {
      throw new Error("Invalid webhook payload");
    }

    const orderId = data.order.order_id;
    const paymentStatus = data.payment?.payment_status;
    const paymentId = data.payment?.cf_payment_id;

    // Map Cashfree status to our status
    let status = "pending";
    if (paymentStatus === "SUCCESS") {
      status = "completed";
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      status = "failed";
    }

    // First check if this payment has already been processed (idempotency)
    const { data: existingPayment } = await supabaseClient
      .from("payments")
      .select("id, status")
      .eq("gateway_order_id", orderId)
      .single();

    if (existingPayment?.status === "completed") {
      console.log("Payment already processed, skipping:", orderId);
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update payment record
    const { data: paymentData, error: updateError } = await supabaseClient
      .from("payments")
      .update({
        status: status,
        gateway_payment_id: paymentId?.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("gateway_order_id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw updateError;
    }

    // If payment successful, create enrollment and send email
    if (status === "completed" && paymentData) {
      // Check if enrollment already exists (idempotency)
      const { data: existingEnrollment } = await supabaseClient
        .from("enrollments")
        .select("id")
        .eq("user_id", paymentData.user_id)
        .eq("course_id", paymentData.course_id)
        .maybeSingle();

      if (existingEnrollment) {
        console.log("Enrollment already exists, skipping creation");
        return new Response(
          JSON.stringify({ success: true, message: "Enrollment exists" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let courseId = paymentData.course_id as string | null;
      let courseName = "";
      let courseSlug = "";

      // Backfill course_id from stored slug if needed
      if (!courseId) {
        const slug = (paymentData.metadata as any)?.course_slug as string | undefined;
        if (slug) {
          const { data: courseRow, error: courseError } = await supabaseClient
            .from("courses")
            .select("id, title, slug")
            .eq("slug", slug)
            .single();

          if (courseError) {
            console.error("Course lookup error (webhook):", courseError);
          } else {
            courseId = courseRow?.id ?? null;
            courseName = courseRow?.title ?? "";
            courseSlug = courseRow?.slug ?? "";
          }
        }
      } else {
        // Get course details for email
        const { data: courseRow } = await supabaseClient
          .from("courses")
          .select("title, slug")
          .eq("id", courseId)
          .single();
        
        if (courseRow) {
          courseName = courseRow.title;
          courseSlug = courseRow.slug;
        }
      }

      if (!courseId) {
        console.error("Cannot create enrollment: missing course_id", {
          orderId,
          paymentId,
          metadata: paymentData.metadata,
        });
      } else {
        const { error: enrollmentError } = await supabaseClient
          .from("enrollments")
          .insert({
            user_id: paymentData.user_id,
            course_id: courseId,
            payment_id: paymentData.id,
            status: "active",
          });

        if (enrollmentError) {
          console.error("Error creating enrollment:", enrollmentError);
        } else {
          // Check for referral reward - only if purchase is above ₹500
          const purchaseAmount = Number(paymentData.amount) || 0;
          
          if (purchaseAmount >= 500) {
            // Check if this user was referred
            const { data: referralUse } = await supabaseClient
              .from("referral_uses")
              .select("referral_id, referrals(referrer_id)")
              .eq("referred_user_id", paymentData.user_id)
              .maybeSingle();

            if (referralUse?.referral_id) {
              const referrerId = (referralUse.referrals as any)?.referrer_id;
              
              if (referrerId) {
                // Create a ₹100 discount coupon for the referrer
                const couponCode = `REF${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
                
                const { error: couponError } = await supabaseClient
                  .from("coupons")
                  .insert({
                    code: couponCode,
                    description: `Referral reward - ₹100 off (earned from referral purchase)`,
                    discount_type: "fixed",
                    discount_value: 100,
                    is_active: true,
                    max_uses: 1,
                    used_count: 0,
                    valid_from: new Date().toISOString(),
                    valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 90 days
                    min_purchase_amount: 500,
                  });

                if (couponError) {
                  console.error("Error creating referral coupon:", couponError);
                } else {
                  console.log(`Created referral coupon ${couponCode} for referrer ${referrerId}`);
                  
                  // Update referral stats - increment total earned by 100
                  const { data: currentReferral } = await supabaseClient
                    .from("referrals")
                    .select("total_earned_discount")
                    .eq("id", referralUse.referral_id)
                    .single();

                  const currentTotal = currentReferral?.total_earned_discount || 0;
                  
                  await supabaseClient
                    .from("referrals")
                    .update({
                      total_earned_discount: currentTotal + 100,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", referralUse.referral_id);

                  // Create notification for referrer
                  await supabaseClient
                    .from("notifications")
                    .insert({
                      user_id: referrerId,
                      title: "🎉 Referral Reward Earned!",
                      message: `You earned a ₹100 discount coupon! Code: ${couponCode}. Your referred friend made a purchase above ₹500.`,
                      type: "reward",
                      action_url: "/dashboard",
                    });
                }
              }
            }
          }
          
          // Get user email for notification
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("email, full_name")
            .eq("user_id", paymentData.user_id)
            .single();

          if (profile?.email && courseName) {
            // Send enrollment confirmation email
            const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
            const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
            
            fetch(`${baseUrl}/functions/v1/send-enrollment-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${anonKey}`,
              },
              body: JSON.stringify({
                email: profile.email,
                name: profile.full_name || "",
                courseName: courseName,
                courseSlug: courseSlug,
                isFree: false,
                amount: paymentData.amount,
                orderId: orderId,
                paymentDate: paymentData.created_at || new Date().toISOString(),
              }),
            }).catch(err => console.error("Enrollment email error:", err));
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
