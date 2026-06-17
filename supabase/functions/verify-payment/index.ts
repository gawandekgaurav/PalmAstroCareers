import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Edge Function configuration is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      record_id,
    } = await req.json();

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Missing RAZORPAY_KEY_SECRET");
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(razorpayKeySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`),
    );
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      await supabaseClient
        .from("AstroCareersDataTable")
        .update({ status: "failed" })
        .eq("id", record_id);
      throw new Error("Invalid payment signature");
    }

    console.log("Payment verified");
    console.log("Updating record");

    const { error: updateError } = await supabaseClient
      .from("AstroCareersDataTable")
      .update({
        status: "completed",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      })
      .eq("id", record_id);

    if (updateError) {
      throw updateError;
    }

    console.log("Record updated");

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
