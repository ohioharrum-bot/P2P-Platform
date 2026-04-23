import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { serialize } from "cookie";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Get admin credentials from DB
  const { data, error } = await supabaseAdmin
    .from("admin_credentials")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Compare password
  const valid = await bcrypt.compare(password, data.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Set admin session cookie
  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    })
  );

  return res.status(200).json({ success: true });
}