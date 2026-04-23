import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Levenshtein distance for fuzzy matching ──
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}


function isFuzzyMatch(word, target) {
  if (word.length < 3) return false;
  const maxDist = target.length <= 5 ? 1 : 2; // allow 1 typo for short words, 2 for longer
  return levenshtein(word.toLowerCase(), target.toLowerCase()) <= maxDist;
}

const EXACT_PATTERNS = [
  /whats?\s*app/i,
  /\btelegram\b/i,
  /\binstagram\b/i,
  /\bsnapchat\b/i,
  /\bmessenger\b/i,
  /\bsignal\b/i,
  /\bviber\b/i,
  /\bkik\b/i,
  /\bvenmo\b/i,
  /cash\s*app/i,
  /\bzelle\b/i,
  /\bpaypal\b/i,
  /bank\s*transfer/i,
  /wire\s*transfer/i,
  /facebook\s*marketplace/i,
  /\bcraigslist\b/i,
  /\bofferup\b/i,
  /\bmercari\b/i,
  /\bposhmark\b/i,
  /\bdm\s*me\b/i,
  /\bhmu\b/i,
  /hit\s*me\s*up/i,
  /avoid\s*fees/i,
  /my\s*(phone|number|mobile|contact)\s*(number|is|:)?/i,
  /call\s*me\s*at/i,
  /text\s*me\s*at/i,
  /reach\s*me\s*at/i,
  /pay\s*me\s*(directly|outside|cash)/i,
  /send\s*money/i,
  /transfer\s*money/i,
];

// US phone number
const PHONE_PATTERN = /(\+1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/;

// These trigger words are checked with fuzzy matching (typo tolerant)
// Format: [word1, word2] — both must appear (fuzzy) in the message
const FUZZY_PAIRS = [
  ["chat", "outside"],
  ["chat", "outside"],
  ["talk", "outside"],
  ["meet", "outside"],
  ["deal", "outside"],
  ["outside", "platform"],
  ["outside", "app"],
  ["off", "platform"],
  ["off", "app"],
  ["contact", "directly"],
  ["contact", "privately"],
  ["talk", "privately"],
  ["chat", "privately"],
  ["chat", "elsewhere"],
  ["talk", "elsewhere"],
  ["connect", "elsewhere"],
  ["text", "me"],
  ["call", "me"],
];

function fuzzyCheck(message) {
  const words = message.toLowerCase().split(/\s+/);

  for (const [w1, w2] of FUZZY_PAIRS) {
    const hasW1 = words.some((w) => isFuzzyMatch(w, w1));
    const hasW2 = words.some((w) => isFuzzyMatch(w, w2));
    if (hasW1 && hasW2) {
      return { flagged: true, reason: `Detected off-platform intent: "${w1} ${w2}"` };
    }
  }
  return { flagged: false, reason: null };
}

function checkOffPlatform(message) {
  for (const pattern of EXACT_PATTERNS) {
    if (pattern.test(message)) {
      return { flagged: true, reason: `Contains off-platform indicator` };
    }
  }

  // 2. Phone number
  if (PHONE_PATTERN.test(message)) {
    return { flagged: true, reason: "Contains a phone number" };
  }

  // 3. Fuzzy word pair matching (catches typos)
  return fuzzyCheck(message);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { conversation_id, sender_id, body } = req.body;

  if (!conversation_id || !sender_id || !body?.trim()) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const { flagged: is_flagged, reason: flag_reason } = checkOffPlatform(body.trim());

  console.log("Moderation result:", { body: body.trim(), is_flagged, flag_reason });

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id,
      sender_id,
      body: body.trim(),
      is_flagged,
      flag_reason,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error.message);
    return res.status(500).json({ error: "Failed to send message" });
  }

  console.log("Message saved:", { id: data.id, is_flagged, flag_reason });

  return res.status(200).json({ message: data, flagged: is_flagged });
}