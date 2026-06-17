// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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
    const body = await req.json();

    console.log("Received form data");

    const {
      name,
      email,
      phone,
      dob,
      tob,
      pob,
      service,
      message,
    } = body;

    const left_palm_url = body.left_palm_url ?? body.leftPalmUrl;
    const right_palm_url = body.right_palm_url ?? body.rightPalmUrl;

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
          palm_left_url: left_palm_url,
          palm_right_url: right_palm_url,
          status: "pending_payment",
        },
      ])
      .select("id")
      .single();

    if (dbError) {
      throw dbError;
    }

    const insertedRecordId = recordData.id;
    console.log("Insert successful");
    console.log("Record ID:", insertedRecordId);

    let orderId = "test_order_123";
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (razorpayKeyId && razorpayKeySecret) {
      const authString = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify({
          amount: 49900,
          currency: "INR",
        }),
      });

      if (!rzpResponse.ok) {
        const errText = await rzpResponse.text();
        throw new Error("Razorpay API Error: " + errText);
      }

      const orderData = await rzpResponse.json();
      orderId = orderData.id;

      const { error: orderUpdateError } = await supabaseClient
        .from("AstroCareersDataTable")
        .update({ order_id: orderId })
        .eq("id", insertedRecordId);

      if (orderUpdateError) {
        throw orderUpdateError;
      }
    }

    return new Response(
      JSON.stringify({ order_id: orderId, record_id: insertedRecordId }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
