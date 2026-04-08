import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!supabaseUrl || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Missing edge function configuration variables.");
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      name, email, phone, dob, tob, pob, service, message, leftPalmUrl, rightPalmUrl
    } = await req.json();

    // 1. Insert into DB with status pending
    const { data: recordData, error: dbError } = await supabaseClient
      .from("AstroCareersDataTable")
      .insert([
        {
          name, 
          email, 
          phone, 
          dob, 
          tob, 
          pob, 
          service, 
          message,
          left_palm_url: leftPalmUrl,
          right_palm_url: rightPalmUrl,
          status: "pending",
        },
      ])
      .select('id')
      .single();

    if (dbError) throw dbError;
    const recordId = recordData.id;

    // 2. Call Razorpay API
    const authString = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: 49900,
        currency: "INR"
      })
    });

    if (!rzpResponse.ok) {
        const errText = await rzpResponse.text();
        throw new Error("Razorpay API Error: " + errText);
    }

    const orderData = await rzpResponse.json();
    const orderId = orderData.id;

    // 3. Save order_id in DB
    const { error: updateError } = await supabaseClient
      .from("AstroCareersDataTable")
      .update({ order_id: orderId })
      .eq('id', recordId);

    if (updateError) throw updateError;

    // 4. Return order_id and record_id
    return new Response(JSON.stringify({ order_id: orderId, record_id: recordId }), {
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
