import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 8 — Weekly Creator Spotlight
   
   Runs every Wednesday at 8:00 AM UTC via Vercel Cron.
   Picks the top creator of the week (most upvotes).
   Sends a Telegram message with:
     1. Tweet draft for Creator of the Week
     2. Short blog-ready spotlight text
   
   Manual: GET /api/spotlight?manual=true
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

interface CreatorStats {
  name: string;
  profileId: string | null;
  totalUpvotes: number;
  filmCount: number;
  topFilm: { title: string; id: string; upvotes: number } | null;
  aiTools: string[];
  genres: string[];
}

async function findTopCreator(supabase: any): Promise<CreatorStats | null> {
  // Get all approved movies
  const { data: movies } = await supabase
    .from("movies")
    .select("id, title, creator_name, creator_id, upvotes_count, ai_models, genre, updated_at")
    .eq("status", "approved");

  if (!movies || movies.length === 0) return null;

  // Aggregate by creator
  const creators: Record<string, CreatorStats> = {};

  for (const m of movies) {
    const name = m.creator_name || "Unknown";
    if (!creators[name]) {
      creators[name] = {
        name,
        profileId: m.creator_id || null,
        totalUpvotes: 0,
        filmCount: 0,
        topFilm: null,
        aiTools: [],
        genres: [],
      };
    }

    const c = creators[name];
    c.totalUpvotes += m.upvotes_count || 0;
    c.filmCount++;

    if (!c.topFilm || (m.upvotes_count || 0) > c.topFilm.upvotes) {
      c.topFilm = { title: m.title, id: m.id, upvotes: m.upvotes_count || 0 };
    }

    if (m.ai_models) {
      for (const tool of m.ai_models) {
        if (!c.aiTools.includes(tool)) c.aiTools.push(tool);
      }
    }

    if (m.genre) {
      const genres = m.genre.split(",").map((g: string) => g.trim());
      for (const g of genres) {
        if (g && !c.genres.includes(g)) c.genres.push(g);
      }
    }

    if (m.creator_id && !c.profileId) c.profileId = m.creator_id;
  }

  // Sort by upvotes, pick top
  const sorted = Object.values(creators).sort((a, b) => b.totalUpvotes - a.totalUpvotes || b.filmCount - a.filmCount);
  return sorted[0] || null;
}

function buildTweetDraft(creator: CreatorStats): string {
  const lines: string[] = [];

  lines.push("Creator of the Week: " + creator.name);
  lines.push("");

  if (creator.filmCount === 1) {
    lines.push(creator.filmCount + " film on Spike AI");
  } else {
    lines.push(creator.filmCount + " films on Spike AI");
  }

  if (creator.totalUpvotes > 0) lines.push(creator.totalUpvotes + " total upvotes");
  lines.push("");

  if (creator.topFilm) {
    lines.push("Top film: " + creator.topFilm.title);
    lines.push("https://www.spikeai.studio/movie/" + creator.topFilm.id);
  }

  lines.push("");

  if (creator.aiTools.length > 0) {
    lines.push("Tools: " + creator.aiTools.slice(0, 3).join(", "));
  }

  lines.push("");
  lines.push("#AIcinema #CreatorSpotlight #SpikeAI");

  let tweet = lines.join("\n");
  if (tweet.length > 280) {
    tweet = [
      "Creator of the Week: " + creator.name,
      "",
      creator.filmCount + " films on Spike AI",
      "",
      creator.topFilm ? "https://www.spikeai.studio/movie/" + creator.topFilm.id : "https://www.spikeai.studio",
      "",
      "#AIcinema #SpikeAI",
    ].join("\n");
  }

  return tweet;
}

function buildBlogDraft(creator: CreatorStats): string {
  const lines: string[] = [];

  lines.push("CREATOR SPOTLIGHT: " + creator.name);
  lines.push("");
  lines.push("This week's featured creator on Spike AI is " + creator.name + ".");
  lines.push("");

  if (creator.filmCount > 1) {
    lines.push("With " + creator.filmCount + " films and " + creator.totalUpvotes + " upvotes, " + creator.name + " is one of the most active creators on the platform.");
  } else {
    lines.push(creator.name + " has " + creator.totalUpvotes + " upvotes on their debut film.");
  }

  lines.push("");

  if (creator.genres.length > 0) {
    lines.push("Genres: " + creator.genres.join(", "));
  }

  if (creator.aiTools.length > 0) {
    lines.push("AI Toolkit: " + creator.aiTools.join(", "));
  }

  lines.push("");

  if (creator.topFilm) {
    lines.push(creator.topFilm.upvotes > 0 ? "Most popular film: \"" + creator.topFilm.title + "\" (" + creator.topFilm.upvotes + " upvotes)" : "Latest film: \"" + creator.topFilm.title + "\"");
    lines.push("Watch: https://www.spikeai.studio/movie/" + creator.topFilm.id);
  }

  if (creator.profileId) {
    lines.push("Profile: https://www.spikeai.studio/creator/" + creator.profileId);
  }

  return lines.join("\n");
}

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
    const creator = await findTopCreator(supabase);

    if (!creator) {
      return NextResponse.json({ success: false, error: "No creators found" });
    }

    const tweetDraft = buildTweetDraft(creator);
    const blogDraft = buildBlogDraft(creator);

    const message = [
      "🏆 <b>Creator of the Week</b>",
      "",
      "━━━ TWEET DRAFT ━━━",
      "",
      tweetDraft,
      "",
      "━━━ BLOG DRAFT ━━━",
      "",
      blogDraft,
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "📋 Copy tweet and post on Twitter",
      "📝 Use blog draft for a website post or newsletter",
      "📏 Tweet: " + tweetDraft.length + "/280 characters",
    ].join("\n");

    const sent = await sendTelegram(message);

    return NextResponse.json({
      success: true,
      sent,
      creator: creator.name,
      upvotes: creator.totalUpvotes,
      films: creator.filmCount,
      tweetDraft,
      blogDraft,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
