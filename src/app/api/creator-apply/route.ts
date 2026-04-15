import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   Creator Application Endpoint

   Receives form submissions from spike_apply_en.html
   Saves to creator_leads and notifies Dean via Telegram.
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.film_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Save to creator_leads
    const { error } = await supabase.from("creator_leads").insert({
      name: body.name,
      platform: "application",
      profile_url: body.social || body.website || "",
      work_url: body.film_url,
      work_title: `Application from ${body.name}`,
      ai_tools: body.ai_tools || [],
      genre: null,
      score: 8,
      notes: [
        `Email: ${body.email}`,
        body.phone ? `Phone: ${body.phone}` : "",
        body.country ? `Country: ${body.country}` : "",
        body.bio ? `Bio: ${body.bio}` : "",
        body.website ? `Website: ${body.website}` : "",
        body.social ? `Social: ${body.social}` : "",
      ].filter(Boolean).join(" | "),
      status: "interested",
    });

    if (error) {
      console.error("Supabase insert error:", error);
    }

    // Notify Dean
    const msg = [
      "🎬 <b>New Creator Application!</b>",
      "",
      `<b>${body.name}</b>`,
      `Email: ${body.email}`,
      body.phone ? `Phone: ${body.phone}` : "",
      body.country ? `Country: ${body.country}` : "",
      `Film: ${body.film_url}`,
      body.website ? `Website: ${body.website}` : "",
      body.social ? `Social: ${body.social}` : "",
      body.ai_tools?.length > 0 ? `Tools: ${body.ai_tools.join(", ")}` : "",
      body.bio ? `\nBio: ${body.bio}` : "",
      "",
      "⚡ This creator applied directly - high intent!",
      "→ <a href=\"https://www.spikeai.studio/admin/pipeline\">View in Pipeline</a>",
    ].filter(Boolean).join("\n");

    await sendTelegram(msg);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
