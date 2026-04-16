import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   New User Notification
   Fires Telegram alert when a new viewer signs up.

   SECURITY: caller must have a valid Supabase session AND the email
   they're reporting must match their own. Prevents random POSTs
   from spamming Telegram.
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  try {
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
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Auth: must have a valid Supabase session
    const token = request.headers.get("x-supabase-auth");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, email, provider } = body;

    // Can only report on your own signup
    if (!email || email !== userData.user.email) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
    }

    // Dedup: only notify for profiles created in the last 60s
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", userData.user.id)
      .single();

    if (profile?.created_at) {
      const age = Date.now() - new Date(profile.created_at).getTime();
      if (age > 60_000) {
        return NextResponse.json({ success: true, skipped: "too_old" });
      }
    }

    const msg = [
      "👤 <b>New Viewer Signed Up!</b>",
      "",
      `<b>${display_name || email.split("@")[0]}</b>`,
      `Email: ${email}`,
      provider ? `Method: ${provider}` : "",
      "",
      "📊 Growing audience on Spike AI 📈",
    ].filter(Boolean).join("\n");

    await sendTelegram(msg);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
