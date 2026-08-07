// Supabase Edge Function: create Stripe Checkout Session
// Deploy: supabase functions deploy create-checkout
// Secrets: STRIPE_SECRET_KEY, SITE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function gqToCents(gq) {
  if (!gq || gq <= 0) return null;
  return Math.max(99, Math.round(Number(gq)));
}

async function loadPriceMap(siteUrl) {
  const url = `${siteUrl.replace(/\/$/, "")}/web-shop-prices.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Price map fetch failed: ${res.status}`);
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.roll10000.com";

    if (!stripeKey || !supabaseUrl || !supabaseAnon || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const itemType = body.item_type;
    const itemId = body.item_id;
    const successUrl = body.success_url;
    const cancelUrl = body.cancel_url;

    if (!["skin", "felt", "box"].includes(itemType) || !itemId) {
      return new Response(JSON.stringify({ error: "Invalid item" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const priceMap = await loadPriceMap(siteUrl);
    const gq = priceMap?.[itemType]?.[itemId];
    const amount = gqToCents(gq);
    if (!amount) {
      return new Response(JSON.stringify({ error: "Unknown item" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        item_type: itemType,
        item_id: itemId,
        amount_cents: amount,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderErr) {
      return new Response(JSON.stringify({ error: orderErr.message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `YouNeeK ${itemType}: ${itemId}`,
              metadata: { item_type: itemType, item_id: itemId },
            },
          },
        },
      ],
      success_url:
        successUrl || `${siteUrl}/account?checkout=success`,
      cancel_url: cancelUrl || `${siteUrl}/shop?checkout=cancel`,
      metadata: {
        user_id: user.id,
        order_id: order.id,
        item_type: itemType,
        item_id: itemId,
      },
    });

    await admin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
