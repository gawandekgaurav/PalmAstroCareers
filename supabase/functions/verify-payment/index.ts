import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    // Initialize Supabase Client securely with Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Edge Function configuration is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // Parse the JSON body sent from the frontend
    const {
      name,
      email,
      phone,
      dob,
      tob,
      pob,
      service,
      message,
      leftPalmUrl,
      rightPalmUrl,
    } = await req.json();

    // Insert the data into AstroCareersDataTable
    const { data, error } = await supabaseClient
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
          left_palm_url: leftPalmUrl, // Using the mapping requested by user
          right_palm_url: rightPalmUrl,
          status: "pending",
        },
      ]);

    if (error) {
      throw error;
    }

    // Return success response to the frontend
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
