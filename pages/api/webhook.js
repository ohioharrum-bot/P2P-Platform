import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const rawBody = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  console.log("Webhook event received:", event.type);

  try {
    // Stripe Checkout Session completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { listing_id, buyer_id, seller_id, conversation_id } = session.metadata;

      console.log("Checkout completed:", { listing_id, buyer_id, seller_id });

      // Update order status to paid
      const { error: orderError } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("stripe_payment_intent_id", session.id);

      if (orderError) {
        console.error("Order update error:", orderError.message);
      } else {
        console.log("Order marked as paid");
      }

      // Mark listing as sold
      const { error: listingError } = await supabaseAdmin
        .from("listings")
        .update({ status: "sold" })
        .eq("id", listing_id);

      if (listingError) {
        console.error("Listing update error:", listingError.message);
      } else {
        console.log("Listing marked as sold");
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", paymentIntent.id);
      console.log("Payment failed, order updated");
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}