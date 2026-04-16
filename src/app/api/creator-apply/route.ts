import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   Creator Application Endpoint

   Public form (by design) - but rate-limited and validated.
   Limits: 3 applications per IP per hour, 1 per email per 24h.
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  return res.ok;
}

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

async function checkRateLimit(
  supabase: any,
  ip: string,
  email: string
): Promise<{ ok: boolean; reason?: string }> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: ipCount } = await supabase
    .from("creator_leads")
    .select("*", { count: "exact", head: true })
    .eq("platform", "application")
    .ilike("notes", `%ip:${ip}%`)
    .gte("found_at", oneHourAgo);

  if ((ipCount ?? 0) >= 3) {
    return { ok: false, reason: "Too many applications from this location. Try again later." };
  }

  const { count: emailCount } = await supabase
    .from("creator_leads")
    .select("*", { count: "exact", head: true })
    .eq("platform", "application")
    .ilike("notes", `%Email: ${email.toLowerCase()}%`)
    .gte("found_at", oneDayAgo);

  if ((emailCount ?? 0) >= 1) {
    return { ok: false, reason: "You have already applied recently. We'll be in touch." };
  }

  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name?.trim() || !body.email?.trim() || !body.film_url?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Clip inputs to prevent payload abuse
    const clean = {
      name: String(body.name).slice(0, 100).trim(),
      email: String(body.email).toLowerCase().slice(0, 200).trim(),
      film_url: String(body.film_url).slice(0, 500).trim(),
      website: String(body.website || "").slice(0, 300).trim(),
      social: String(body.social || "").slice(0, 300).trim(),
      bio: String(body.bio || "").slice(0, 1000).trim(),
      country: String(body.country || "").slice(0, 60).trim(),
      heard_from: String(body.heard_from || "").slice(0, 200).trim(),
      phone: String(body.phone || "").slice(0, 30).trim(),
      ai_tools: Array.isArray(body.ai_tools) ? body.ai_tools.slice(0, 20) : [],
    };

    if (!/^https?:\/\//.test(clean.film_url)) {
      return NextResponse.json({ error: "Film URL must start with http(s)://" }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const ip = getClientIp(request);

    const rl = await checkRateLimit(supabase, ip, clean.email);
    if (!rl.ok) {
      return NextResponse.json({ error: rl.reason }, { status: 429 });
    }

    const { error } = await supabase.from("creator_leads").insert({
      name: clean.name,
      platform: "application",
      profile_url: clean.social || clean.website || "",
      work_url: clean.film_url,
      work_title: `Application from ${clean.name}`,
      ai_tools: clean.ai_tools,
      genre: null,
      score: 8,
      notes: [
        `ip:${ip}`,
        `Email: ${clean.email}`,
        clean.phone ? `Phone: ${clean.phone}` : "",
        clean.country ? `Country: ${clean.country}` : "",
        clean.heard_from ? `Heard from: ${clean.heard_from}` : "",
        clean.bio ? `Bio: ${clean.bio}` : "",
        clean.website ? `Website: ${clean.website}` : "",
        clean.social ? `Social: ${clean.social}` : "",
      ].filter(Boolean).join(" | "),
      status: "interested",
    });

    if (error) {
      console.error("creator-apply insert error:", error);
    }

    const msg = [
      "🎬 <b>New Creator Application!</b>",
      "",
      `<b>${clean.name}</b>`,
      `Email: ${clean.email}`,
      clean.phone ? `Phone: ${clean.phone}` : "",
      clean.country ? `Country: ${clean.country}` : "",
      clean.heard_from ? `📢 Heard from: <b>${clean.heard_from}</b>` : "",
      `Film: ${clean.film_url}`,
      clean.website ? `Website: ${clean.website}` : "",
      clean.social ? `Social: ${clean.social}` : "",
      clean.ai_tools.length > 0 ? `Tools: ${clean.ai_tools.join(", ")}` : "",
      clean.bio ? `\nBio: ${clean.bio}` : "",
      "",
      "⚡ This creator applied directly - high intent!",
      '→ <a href="https://www.spikeai.studio/admin/pipeline">View in Pipeline</a>',
    ].filter(Boolean).join("\n");

    await sendTelegram(msg);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
