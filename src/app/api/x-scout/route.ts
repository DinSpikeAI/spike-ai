import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 16 — X/Twitter Scout

   Scans X/Twitter for AI filmmakers using hashtag searches.
   Uses Twitter API v2 Recent Search endpoint.

   Requires: Twitter API Basic tier ($200/month) for search access.
   If using Free tier, the agent will report the limitation
   and gracefully skip.

   Rotates through hashtag queries daily (3 per run).
   Scores creators by engagement, followers, and relevance.
   Inserts into creator_leads pipeline.

   Runs daily at 7:45 AM UTC.
   Manual: GET /api/x-scout?manual=true

   Kill switch: Set env DISABLE_X_SCOUT=true to disable.
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Twitter API credentials (OAuth 2.0 Bearer or App-only)
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;

// ─── Config ───

const SEARCH_QUERIES = [
  "#AIfilm",
  "#AIcinema",
  "#AIshortfilm",
  "#RunwayGen4",
  "#SoraAI",
  "#KlingAI",
  "#AIart film",
  "#AIvideo short",
  "#HailuoAI film",
  "#PikaLabs film",
  "#AIfilmmaking",
  "#generativevideo",
];

const AI_TOOL_PATTERNS: [RegExp, string][] = [
  [/runway\s*(gen[- ]?4|gen[- ]?3)/i, "Runway Gen-4"],
  [/runway/i, "Runway Gen-4"],
  [/kling\s*ai/i, "Kling AI"],
  [/kling/i, "Kling AI"],
  [/sora/i, "Sora"],
  [/pika\s*(labs)?/i, "Pika Labs"],
  [/hailuo/i, "Hailuo"],
  [/luma/i, "Luma Dream Machine"],
  [/midjourney/i, "Midjourney"],
  [/eleven\s*labs/i, "ElevenLabs"],
  [/seedance/i, "Seedance"],
  [/veo\s*(2|3)?/i, "Veo3"],
];

const GENRE_PATTERNS: [RegExp, string][] = [
  [/horror/i, "Horror"],
  [/sci[\s-]*fi/i, "Sci-Fi"],
  [/anime/i, "Anime"],
  [/thriller/i, "Thriller"],
  [/drama/i, "Drama"],
  [/fantasy/i, "Fantasy"],
  [/cyberpunk/i, "Cyberpunk"],
];

// ─── Helpers ───

function detectAiTools(text: string): string[] {
  const found = new Set<string>();
  for (const [pattern, tool] of AI_TOOL_PATTERNS) {
    if (pattern.test(text)) found.add(tool);
  }
  return Array.from(found);
}

function detectGenre(text: string): string | null {
  for (const [pattern, genre] of GENRE_PATTERNS) {
    if (pattern.test(text)) return genre;
  }
  return null;
}

function calculateXScore(tweet: any, user: any): number {
  let score = 0;

  // Engagement on the tweet (0-3 points)
  const likes = tweet.public_metrics?.like_count || 0;
  const retweets = tweet.public_metrics?.retweet_count || 0;
  const replies = tweet.public_metrics?.reply_count || 0;
  const engagement = likes + retweets * 2 + replies;

  if (engagement >= 500) score += 3;
  else if (engagement >= 100) score += 2;
  else if (engagement >= 20) score += 1;

  // Follower count (0-2 points)
  const followers = user?.public_metrics?.followers_count || 0;
  if (followers >= 10000) score += 2;
  else if (followers >= 1000) score += 1;

  // Engagement ratio (0-2 points)
  if (followers > 0) {
    const ratio = engagement / followers;
    if (ratio >= 0.05) score += 2;
    else if (ratio >= 0.01) score += 1;
  }

  // AI tools detected (0-2 points)
  const tools = detectAiTools(tweet.text || "");
  if (tools.length >= 2) score += 2;
  else if (tools.length >= 1) score += 1;

  // Has media (video/image) - bonus point
  if (tweet.attachments?.media_keys?.length > 0) score += 1;

  return Math.min(score, 10);
}

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

// ─── Twitter API ───

async function getBearerToken(): Promise<string | null> {
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET) return null;

  const credentials = Buffer.from(`${TWITTER_API_KEY}:${TWITTER_API_SECRET}`).toString("base64");

  try {
    const res = await fetch("https://api.twitter.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Twitter bearer token error:", err);
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function searchTweets(bearer: string, query: string): Promise<{ tweets: any[]; users: Map<string, any> }> {
  const params = new URLSearchParams({
    query: `${query} -is:retweet -is:reply has:media lang:en`,
    max_results: "10",
    "tweet.fields": "public_metrics,created_at,attachments,entities",
    "user.fields": "public_metrics,description,profile_image_url",
    expansions: "author_id,attachments.media_keys",
    "media.fields": "type,url,preview_image_url",
  });

  try {
    const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });

    if (res.status === 403) {
      // Free tier - no search access
      return { tweets: [], users: new Map() };
    }

    if (!res.ok) {
      const err = await res.text();
      console.error("Twitter search error:", err);
      return { tweets: [], users: new Map() };
    }

    const data = await res.json();
    const users = new Map<string, any>();
    for (const user of data.includes?.users || []) {
      users.set(user.id, user);
    }

    return { tweets: data.data || [], users };
  } catch {
    return { tweets: [], users: new Map() };
  }
}

// ─── Main Scout ───

async function runXScout(): Promise<{
  found: number;
  added: number;
  skipped: number;
  accessDenied: boolean;
  errors: string[];
}> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { found: 0, added: 0, skipped: 0, accessDenied: false, errors: ["Missing Supabase env vars"] };
  }

  if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
    return { found: 0, added: 0, skipped: 0, accessDenied: false, errors: ["Missing Twitter API keys"] };
  }

  // Kill switch
  if (process.env.DISABLE_X_SCOUT === "true") {
    return { found: 0, added: 0, skipped: 0, accessDenied: false, errors: ["Agent disabled via DISABLE_X_SCOUT"] };
  }

  const bearer = await getBearerToken();
  if (!bearer) {
    return { found: 0, added: 0, skipped: 0, accessDenied: false, errors: ["Failed to get Twitter bearer token"] };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Pick 3 random queries
  const shuffled = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5);
  const todayQueries = shuffled.slice(0, 3);

  // Get existing leads to avoid duplicates
  const { data: existingLeads } = await supabase
    .from("creator_leads")
    .select("profile_url");
  const existingUrls = new Set((existingLeads || []).map((l: any) => l.profile_url));

  let totalFound = 0;
  let added = 0;
  let skipped = 0;
  let accessDenied = false;
  const errors: string[] = [];

  for (const query of todayQueries) {
    const { tweets, users } = await searchTweets(bearer, query);

    // Detect if search returned empty due to access level
    if (tweets.length === 0 && query === todayQueries[0]) {
      // Test if this is an access issue
      const testRes = await fetch("https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10", {
        headers: { Authorization: `Bearer ${bearer}` },
      });
      if (testRes.status === 403) {
        accessDenied = true;
        break;
      }
    }

    totalFound += tweets.length;

    for (const tweet of tweets) {
      try {
        const user = users.get(tweet.author_id);
        if (!user) continue;

        const profileUrl = `https://x.com/${user.username}`;

        // Skip if already in pipeline
        if (existingUrls.has(profileUrl)) {
          skipped++;
          continue;
        }

        const text = `${tweet.text} ${user.description || ""}`;
        const tools = detectAiTools(text);
        const genre = detectGenre(text);
        const score = calculateXScore(tweet, user);

        // Skip low quality
        if (score <= 2) {
          skipped++;
          continue;
        }

        const followers = user.public_metrics?.followers_count || 0;
        const likes = tweet.public_metrics?.like_count || 0;
        const retweets = tweet.public_metrics?.retweet_count || 0;

        const lead = {
          name: user.name || user.username,
          platform: "x",
          profile_url: profileUrl,
          work_url: `https://x.com/${user.username}/status/${tweet.id}`,
          work_title: (tweet.text || "").slice(0, 200),
          ai_tools: tools,
          genre,
          score,
          subscriber_count: followers,
          notes: `Tweet: ${likes} likes, ${retweets} RTs | Followers: ${followers.toLocaleString()} | ${tools.length > 0 ? "Tools: " + tools.join(", ") : "No tools detected"}`,
          status: "new",
          sequence_step: 0,
        };

        const { error } = await supabase.from("creator_leads").insert(lead);
        if (error) {
          errors.push(`Insert error for ${lead.name}: ${error.message}`);
        } else {
          added++;
          existingUrls.add(profileUrl);
        }
      } catch (err: any) {
        errors.push(`Error processing tweet: ${err.message}`);
      }
    }
  }

  return { found: totalFound, added, skipped, accessDenied, errors };
}

// ─── API Route ───

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = request.nextUrl.searchParams.get("manual") === "true";

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runXScout();

    // Telegram report
    if (result.accessDenied) {
      await sendTelegram(
        "🐦 <b>X Scout — Access Denied</b>\n\n" +
        "Twitter API search requires Basic tier ($200/month).\n" +
        "Current keys only have Free tier access.\n\n" +
        "To enable: upgrade at developer.x.com\n" +
        "Or set DISABLE_X_SCOUT=true to stop this notification."
      );
    } else if (result.added > 0) {
      await sendTelegram(
        "🐦 <b>X Scout — " + result.added + " New Leads</b>\n\n" +
        "Scanned: " + result.found + " tweets\n" +
        "Added: " + result.added + " | Skipped: " + result.skipped + "\n" +
        (result.errors.length > 0 ? "Errors: " + result.errors.length + "\n" : "") +
        "\n→ <a href=\"https://www.spikeai.studio/admin/pipeline\">View in Pipeline</a>"
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
