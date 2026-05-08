import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_AMOUNTS: Record<string, number> = {
  basic: 9900,
  medium: 19900,
  pro: 34900,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { plan } = await req.json();
    if (!plan || !PLAN_AMOUNTS[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const amount = PLAN_AMOUNTS[plan];

    const API_KEY = Deno.env.get("PAYMOB_API_KEY")!;
    const INTEGRATION_ID = Deno.env.get("PAYMOB_INTEGRATION_ID")!;
    const IFRAME_ID = Deno.env.get("PAYMOB_IFRAME_ID")!;

    // Step 1: Auth
    const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: API_KEY }),
    });
    const authJson = await authRes.json();
    const token = authJson.token;
    if (!token) throw new Error("Paymob auth failed");

    // Step 2: Order
    const merchantOrderId = `${user.id}_${plan}_${Date.now()}`;
    const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: false,
        amount_cents: amount,
        currency: "EGP",
        merchant_order_id: merchantOrderId,
        items: [],
      }),
    });
    const orderJson = await orderRes.json();
    if (!orderJson.id) throw new Error("Paymob order failed: " + JSON.stringify(orderJson));

    // Step 3: Payment key
    const fullName = (user.user_metadata?.full_name as string) || "Customer";
    const [first_name, ...rest] = fullName.split(" ");
    const last_name = rest.join(" ") || first_name || "User";

    const pkRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amount,
        expiration: 3600,
        order_id: orderJson.id,
        billing_data: {
          apartment: "NA", email: user.email || "no@email.com", floor: "NA",
          first_name: first_name || "User", street: "NA", building: "NA",
          phone_number: "+201000000000", shipping_method: "NA", postal_code: "NA",
          city: "Cairo", country: "EG", last_name, state: "NA",
        },
        currency: "EGP",
        integration_id: Number(INTEGRATION_ID),
        extra: { user_id: user.id, plan },
      }),
    });
    const pkJson = await pkRes.json();
    if (!pkJson.token) throw new Error("Paymob payment key failed: " + JSON.stringify(pkJson));

    const payment_url = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${pkJson.token}`;

    return new Response(JSON.stringify({ payment_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-payment error:", e);
    return new Response(JSON.stringify({ error: "Payment setup failed, please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
