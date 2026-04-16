import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════
   New User Notification
   Fires Telegram alert when a new viewer signs up.
   ═══════════════════════════════════════════════════════════════ */

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
    const body = await request.json();
    const { display_name, email, provider } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
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
