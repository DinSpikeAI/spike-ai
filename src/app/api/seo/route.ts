import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT — SEO Checker
   
   Runs every Monday at 6:00 AM UTC via Vercel Cron.
   
   1. Checks all approved films for missing/weak metadata
   2. Suggests blog topics based on platform content
   3. Sends full SEO report to Telegram
   
   Manual: GET /api/seo?manual=true
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

interface SEOIssue {
  filmTitle: string;
  filmId: string;
  issues: string[];
}

async function checkFilms(supabase: any): Promise<SEOIssue[]> {
  const { data: movies } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "approved");

  if (!movies) return [];

  const problems: SEOIssue[] = [];

  for (const m of movies) {
    const issues: string[] = [];

    // Description
    if (!m.description) {
      issues.push("Missing description entirely");
    } else if (m.description.length < 50) {
      issues.push("Description too short (" + m.description.length + " chars, aim for 100+)");
    }

    // Tagline
    if (!m.tagline) {
      issues.push("No tagline (helps with search and sharing)");
    }

    // Poster
    if (!m.poster_url || m.poster_url.includes("picsum.photos")) {
      issues.push("No custom poster (using placeholder)");
    }

    // Genre
    if (!m.genre) {
      issues.push("No genre set");
    }

    // AI Models
    if (!m.ai_models || m.ai_models.length === 0) {
      issues.push("No AI tools tagged (helps discoverability)");
    }

    // Duration
    if (!m.duration) {
      issues.push("No duration set");
    }

    // Creator name
    if (!m.creator_name) {
      issues.push("No creator name");
    }

    // Video URL
    if (!m.video_url) {
      issues.push("No video URL");
    }

    // Title SEO
    if (m.title && m.title === m.title.toUpperCase() && m.title.length > 5) {
      issues.push("Title is ALL CAPS (bad for SEO, use title case)");
    }

    if (issues.length > 0) {
      problems.push({ filmTitle: m.title, filmId: m.id, issues });
    }
  }

  return problems;
}

function generateBlogTopics(movies: any[]): string[] {
  const topics: string[] = [];

  // Count AI tools
  const toolCounts: Record<string, number> = {};
  const genreCounts: Record<string, number> = {};

  for (const m of movies) {
    if (m.ai_models) {
      for (const t of m.ai_models) {
        toolCounts[t] = (toolCounts[t] || 0) + 1;
      }
    }
    if (m.genre) {
      const genres = m.genre.split(",").map((g: string) => g.trim());
      for (const g of genres) {
        if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;
      }
    }
  }

  // Top tools
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]);
  if (topTools.length >= 2) {
    topics.push('"' + topTools[0][0] + " vs " + topTools[1][0] + ': Which Makes Better AI Films in 2026?"');
  }

  // Top genres
  const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  if (topGenres.length > 0) {
    topics.push('"Best AI ' + topGenres[0][0] + " Films to Watch in 2026" + '"');
  }

  // Evergreen topics
  topics.push('"How to Make Your First AI Short Film (Step-by-Step Guide)"');
  topics.push('"Where to Publish Your AI Films: Best Platforms in 2026"');
  topics.push('"Top ' + movies.length + ' AI Films on Spike AI This Month"');

  if (topTools.length > 0) {
    topics.push('"Complete Guide to Making Films with ' + topTools[0][0] + '"');
  }

  // Creator spotlight
  const creators = [...new Set(movies.map((m: any) => m.creator_name).filter(Boolean))];
  if (creators.length > 0) {
    topics.push('"Meet the AI Filmmakers: ' + creators.length + " Creators Pushing the Boundaries" + '"');
  }

  return topics;
}

async function generateReport(supabase: any): Promise<{ issues: SEOIssue[]; topics: string[]; stats: any }> {
  const { data: movies } = await supabase
    .from("movies")
    .select("*")
    .eq("status", "approved");

  const allMovies = movies || [];
  const issues = await checkFilms(supabase);
  const topics = generateBlogTopics(allMovies);

  // Stats
  const withDescription = allMovies.filter((m: any) => m.description && m.description.length >= 50).length;
  const withPoster = allMovies.filter((m: any) => m.poster_url && !m.poster_url.includes("picsum")).length;
  const withTools = allMovies.filter((m: any) => m.ai_models && m.ai_models.length > 0).length;
  const withGenre = allMovies.filter((m: any) => m.genre).length;
  const withTagline = allMovies.filter((m: any) => m.tagline).length;

  const stats = {
    total: allMovies.length,
    withDescription,
    withPoster,
    withTools,
    withGenre,
    withTagline,
    score: allMovies.length > 0
      ? Math.round(((withDescription + withPoster + withTools + withGenre + withTagline) / (allMovies.length * 5)) * 100)
      : 0,
  };

  return { issues, topics, stats };
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
    const { issues, topics, stats } = await generateReport(supabase);

    // Build Telegram message
    const lines: string[] = [];
    lines.push("🔍 <b>SEO Weekly Report</b>");
    lines.push("");

    // Score
    lines.push("📊 <b>SEO Score: " + stats.score + "/100</b>");
    lines.push("");
    lines.push("  Films: " + stats.total);
    lines.push("  Good description: " + stats.withDescription + "/" + stats.total);
    lines.push("  Custom poster: " + stats.withPoster + "/" + stats.total);
    lines.push("  AI tools tagged: " + stats.withTools + "/" + stats.total);
    lines.push("  Genre set: " + stats.withGenre + "/" + stats.total);
    lines.push("  Tagline: " + stats.withTagline + "/" + stats.total);

    // Issues
    if (issues.length > 0) {
      lines.push("");
      lines.push("⚠️ <b>Films That Need Fixing (" + issues.length + ")</b>");
      lines.push("");

      for (const film of issues.slice(0, 8)) {
        lines.push("  <b>" + film.filmTitle + "</b>");
        for (const issue of film.issues) {
          lines.push("    • " + issue);
        }
        lines.push("");
      }

      if (issues.length > 8) {
        lines.push("  ... +" + (issues.length - 8) + " more films with issues");
      }
    } else {
      lines.push("");
      lines.push("✅ All films have complete metadata!");
    }

    // Blog topics
    lines.push("");
    lines.push("📝 <b>Blog Topic Ideas</b>");
    lines.push("");
    for (const topic of topics.slice(0, 5)) {
      lines.push("  • " + topic);
    }

    lines.push("");
    lines.push("→ <a href=\"https://www.spikeai.studio/admin/dashboard\">Fix in Dashboard</a>");

    const message = lines.join("\n");
    const sent = await sendTelegram(message);

    return NextResponse.json({
      success: true,
      sent,
      seoScore: stats.score,
      issueCount: issues.length,
      topicCount: topics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
