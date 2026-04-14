import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/* ═══════════════════════════════════════════════════════════════
   AGENT 6 — Twitter Publisher
   
   Runs daily at 12:00 PM UTC via Vercel Cron.
   Picks a film from the platform and posts to @SpikeAI_.
   
   Manual: GET /api/tweet?manual=true
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Twitter OAuth 1.0a credentials
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

/* ─── OAuth 1.0a Signature ─── */

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params).sort().map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`).join("&");
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
}

function generateOAuthHeader(method: string, url: string, body?: Record<string, string>): string {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET) {
    throw new Error("Missing Twitter credentials");
  }

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const allParams = { ...oauthParams, ...(body || {}) };
  const signature = generateOAuthSignature(method, url, allParams, TWITTER_API_SECRET, TWITTER_ACCESS_SECRET);
  oauthParams.oauth_signature = signature;

  const header = Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(", ");
  return `OAuth ${header}`;
}

/* ─── Post Tweet ─── */

async function postTweet(text: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const url = "https://api.twitter.com/2/tweets";

  try {
    const body = JSON.stringify({ text });
    const oauthHeader = generateOAuthHeader("POST", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: oauthHeader,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await res.json();

    if (res.ok && data.data?.id) {
      return { success: true, id: data.data.id };
    } else {
      return { success: false, error: JSON.stringify(data) };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/* ─── Build Tweet Content ─── */

function buildFilmTweet(movie: any, creatorName: string): string {
  const lines: string[] = [];

  // Film title
  lines.push(`${movie.title}`);
  lines.push("");

  // Description (truncated)
  if (movie.description) {
    const desc = movie.description.length > 100 ? movie.description.slice(0, 97) + "..." : movie.description;
    lines.push(desc);
    lines.push("");
  }

  // Creator
  lines.push(`Creator: ${creatorName}`);

  // AI tools
  if (movie.ai_models && movie.ai_models.length > 0) {
    lines.push(`Made with: ${movie.ai_models.join(", ")}`);
  }

  lines.push("");
  lines.push(`Watch free on Spike AI`);
  lines.push(`https://www.spikeai.studio/movie/${movie.id}`);
  lines.push("");
  lines.push("#AIcinema #AIfilm #AIart");

  // Twitter limit is 280 chars - trim if needed
  let tweet = lines.join("\n");
  if (tweet.length > 280) {
    // Remove description to fit
    const shortLines = [
      movie.title,
      "",
      `Creator: ${creatorName}`,
      "",
      `Watch free on Spike AI`,
      `https://www.spikeai.studio/movie/${movie.id}`,
      "",
      "#AIcinema #AIfilm",
    ];
    tweet = shortLines.join("\n");
  }

  return tweet;
}

/* ─── Pick Film of the Day ─── */

async function pickFilm(supabase: any): Promise<any | null> {
  // Get approved films, prefer ones with upvotes, not yet tweeted recently
  const { data: movies } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "approved")
    .order("upvotes_count", { ascending: false });

  if (!movies || movies.length === 0) return null;

  // Pick a random film from top 10 (so it's not always the same one)
  const pool = movies.slice(0, Math.min(10, movies.length));
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked;
}

/* ─── Telegram notification ─── */

async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

/* ─── API Route ─── */

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

    // Pick a film
    const movie = await pickFilm(supabase);
    if (!movie) {
      return NextResponse.json({ success: false, error: "No approved films to tweet" });
    }

    // Build tweet
    const creatorName = movie.creator_name || "Independent Creator";
    const tweetText = buildFilmTweet(movie, creatorName);

    // Post to Twitter
    const result = await postTweet(tweetText);

    // Notify via Telegram
    if (result.success) {
      await notifyTelegram(
        `🐦 <b>Tweet Published</b>\n\n"${movie.title}" by ${creatorName}\n\nhttps://x.com/spikeAI_/status/${result.id}`
      );
    } else {
      await notifyTelegram(
        `❌ <b>Tweet Failed</b>\n\n"${movie.title}"\nError: ${result.error}`
      );
    }

    return NextResponse.json({
      success: result.success,
      tweet: tweetText,
      tweetId: result.id,
      error: result.error,
      film: movie.title,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
