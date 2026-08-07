// Supabase Edge Function: Stripe webhook → grant entitlements
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

Deno.serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response("misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const orderId = session.metadata?.order_id;
    const itemType = session.metadata?.item_type;
    const itemId = session.metadata?.item_id;

    if (userId && itemType && itemId) {
      const admin = createClient(supabaseUrl, serviceKey);

      if (orderId) {
        await admin
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
          })
          .eq("id", orderId);
      }

      const row = {
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        source: "stripe",
        order_id: orderId || null,
      };

      const { error: entErr } = await admin.from("entitlements").insert(row);
      // Ignore duplicate skin/felt (unique partial index); boxes always insert.
      if (entErr && !/duplicate|unique/i.test(entErr.message || "")) {
        console.error(entErr);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
