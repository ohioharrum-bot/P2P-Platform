import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: "User ID required" });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user_id)
      .single();

    if (!profile?.stripe_account_id) {
      return res.status(200).json({ connected: false, status: "not_connected" });
    }

    // Fetch fresh data from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const connected = account.details_submitted;

    return res.status(200).json({
      connected,
      status: connected ? "connected" : "incomplete",
      account_id: profile.stripe_account_id,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
    });
  } catch (err) {
    console.error("Stripe status check error:", err.message);
    return res.status(500).json({ error: "Unable to check Stripe status" });
  }
}