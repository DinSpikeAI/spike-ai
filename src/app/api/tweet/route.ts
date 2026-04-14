import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 6 — AI-Powered Tweet Drafts
   
   Uses Claude to write creative, varied tweets.
   Runs 3x daily. Sends drafts to Telegram.
   
   Manual: GET /api/tweet?manual=true
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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

async function askClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) return "";
  
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return "";
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch {
    return "";
  }
}

async function pickFilm(supabase: any): Promise<any | null> {
  const { data: movies } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "approved")
    .order("upvotes_count", { ascending: false });

  if (!movies || movies.length === 0) return null;
  const pool = movies.slice(0, Math.min(10, movies.length));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Rotate tweet styles
const TWEET_STYLES = [
  "Write a hype tweet that makes people want to watch this film RIGHT NOW. Create urgency and excitement.",
  "Write a thoughtful tweet that highlights the artistic merit and technical achievement of this AI film.",
  "Write a casual, conversational tweet as if recommending this film to a friend. Keep it natural.",
  "Write a tweet that focuses on the creator and celebrates their work. Make the creator feel appreciated.",
  "Write a tweet that poses a question to the audience about AI cinema, using this film as an example.",
  "Write a tweet that compares what AI cinema can do today vs 2 years ago, using this film as proof.",
];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = request.nextUrl.searchParams.get("manual") === "true";

  if (!isVercelCron && !isManual) {
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

    // Pick random style
    const style = TWEET_STYLES[Math.floor(Math.random() * TWEET_STYLES.length)];

    const prompt = `You manage the Twitter account @SpikeAI_ for Spike AI, a streaming platform for AI-generated cinema.

${style}

Film info:
- Title: ${movie.title}
- Creator: ${movie.creator_name || "Independent Creator"}
- Description: ${movie.description || "An AI-generated film"}
- Genre: ${movie.genre || "AI Cinema"}
- AI tools used: ${(movie.ai_models || []).join(", ") || "AI tools"}
- Link: https://www.spikeai.studio/movie/${movie.id}

Rules:
- MUST be under 280 characters total (this is critical)
- Include the film link
- Include 1-2 relevant hashtags (choose from: #AIcinema #AIfilm #AIart #SpikeAI or genre-specific ones)
- Don't use emojis excessively (max 1-2)
- Don't start with "Just watched" or "Check out" - be more creative
- Write ONLY the tweet text, nothing else`;

    let tweet = await askClaude(prompt);

    // Fallback if Claude fails
    if (!tweet) {
      tweet = movie.title + "\n\n" +
        (movie.creator_name ? "Creator: " + movie.creator_name + "\n" : "") +
        "\nWatch free on Spike AI\nhttps://www.spikeai.studio/movie/" + movie.id +
        "\n\n#AIcinema #AIfilm";
    }

    // Ensure under 280
    if (tweet.length > 280) {
      tweet = tweet.slice(0, 277) + "...";
    }

    const message = [
      "🐦 <b>Tweet Draft — Ready to Post</b>",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      tweet,
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "📋 Copy and paste to Twitter",
      "📏 " + tweet.length + "/280 characters",
      "🎬 Film: " + movie.title,
      "🎨 Style: " + style.split(".")[0],
    ].join("\n");

    const sent = await sendTelegram(message);

    return NextResponse.json({
      success: true,
      sent,
      tweet,
      chars: tweet.length,
      film: movie.title,
      style: style.split(".")[0],
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
