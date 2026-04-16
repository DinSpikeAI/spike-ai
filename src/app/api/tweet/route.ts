import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 6 — Tweet Drafts via Telegram
   
   Runs 3x daily via Vercel Cron.
   Picks a film, builds a ready-to-post tweet, sends to Telegram.
   You copy-paste to Twitter in 10 seconds.
   
   Manual: GET /api/tweet?manual=true
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
      disable_web_page_preview: false,
    }),
  });
  return res.ok;
}

/* ─── Pick Film ─── */

async function pickFilm(supabase: any): Promise<any | null> {
  const { data: movies } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "approved")
    .order("upvotes_count", { ascending: false });

  if (!movies || movies.length === 0) return null;

  // Pick random from top 10 so it varies each time
  const pool = movies.slice(0, Math.min(10, movies.length));
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ─── Build Tweet Text ─── */

function buildTweet(movie: any): string {
  const lines: string[] = [];
  
  lines.push(movie.title);
  lines.push("");

  if (movie.description) {
    const desc = movie.description.length > 100 
      ? movie.description.slice(0, 97) + "..." 
      : movie.description;
    lines.push(desc);
    lines.push("");
  }

  if (movie.creator_name) {
    lines.push("Creator: " + movie.creator_name);
  }

  if (movie.ai_models && movie.ai_models.length > 0) {
    lines.push("Made with: " + movie.ai_models.join(", "));
  }

  lines.push("");
  lines.push("Watch free on Spike AI");
  lines.push("https://www.spikeai.studio/movie/" + movie.id);
  lines.push("");
  lines.push("#AIcinema #AIfilm #AIart");

  let tweet = lines.join("\n");

  // Trim to 280 chars if needed
  if (tweet.length > 280) {
    const short = [
      movie.title,
      "",
      movie.creator_name ? "Creator: " + movie.creator_name : "",
      "",
      "Watch free on Spike AI",
      "https://www.spikeai.studio/movie/" + movie.id,
      "",
      "#AIcinema #AIfilm",
    ].filter(Boolean);
    tweet = short.join("\n");
  }

  return tweet;
}

/* ─── API Route ─── */

export async function GET(request: NextRequest) {
  // Cron-only endpoint. Manual trigger via ?manual=true was removed for security.
  // To run this manually, use the Telegram bot or OpenClaw.
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const movie = await pickFilm(supabase);

    if (!movie) {
      return NextResponse.json({ success: false, error: "No approved films" });
    }

    const tweet = buildTweet(movie);

    // Send to Telegram as ready-to-copy draft
    const message = [
      "🐦 <b>Tweet Draft — Ready to Post</b>",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      tweet,
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "📋 Copy the text above and paste in Twitter",
      "📏 " + tweet.length + "/280 characters",
    ].join("\n");

    const sent = await sendTelegram(message);

    return NextResponse.json({
      success: true,
      sent,
      tweet,
      chars: tweet.length,
      film: movie.title,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
