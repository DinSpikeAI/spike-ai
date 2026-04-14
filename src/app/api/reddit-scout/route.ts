import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 10 — Reddit Scout
   
   Runs daily at 7:15 AM UTC via Vercel Cron.
   Scans AI filmmaking subreddits for creators and trending posts.
   Reddit JSON API - no auth needed, completely free.
   
   Manual: GET /api/reddit-scout?manual=true
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUBREDDITS = [
  "aivideo",
  "StableDiffusion", 
  "runwayml",
  "singularity",
  "AIFilmmaking",
  "kling",
  "midjourney",
  "sora",
];

const SEARCH_QUERIES = [
  "AI short film",
  "AI movie",
  "made with runway",
  "made with kling",
  "AI cinema",
  "AI generated film",
];

// AI tool detection
const AI_TOOL_PATTERNS: [RegExp, string][] = [
  [/runway\s*(gen[- ]?4|gen[- ]?3)/i, "Runway Gen-4"],
  [/runway/i, "Runway Gen-4"],
  [/kling\s*ai/i, "Kling AI"],
  [/kling/i, "Kling AI"],
  [/sora/i, "Sora"],
  [/pika\s*(labs)?/i, "Pika Labs"],
  [/hailuo/i, "Hailuo"],
  [/luma\s*(dream\s*machine)?/i, "Luma Dream Machine"],
  [/midjourney/i, "Midjourney"],
  [/stable\s*diffusion/i, "Stable Diffusion XL"],
  [/eleven\s*labs/i, "ElevenLabs"],
  [/seedance/i, "Seedance"],
  [/veo\s*(2|3)?/i, "Veo3"],
];

const GENRE_PATTERNS: [RegExp, string][] = [
  [/horror/i, "Horror"],
  [/sci[\s-]*fi|science\s*fiction/i, "Sci-Fi"],
  [/anime/i, "Anime"],
  [/thriller/i, "Thriller"],
  [/drama/i, "Drama"],
  [/fantasy/i, "Fantasy"],
  [/action/i, "Action"],
  [/comedy/i, "Comedy"],
  [/cyberpunk/i, "Cyberpunk"],
];

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

function calculateScore(post: any): number {
  let score = 0;
  
  // Upvotes (0-3)
  const ups = post.ups || 0;
  if (ups >= 100) score += 3;
  else if (ups >= 30) score += 2;
  else if (ups >= 10) score += 1;

  // Comments indicate engagement (0-2)
  const comments = post.num_comments || 0;
  if (comments >= 20) score += 2;
  else if (comments >= 5) score += 1;

  // Has video/link (0-1)
  if (post.is_video || post.url?.includes("youtube") || post.url?.includes("vimeo") || post.url?.includes("youtu.be")) {
    score += 1;
  }

  // AI tools detected (0-2)
  const text = (post.title || "") + " " + (post.selftext || "");
  const tools = detectAiTools(text);
  if (tools.length >= 2) score += 2;
  else if (tools.length >= 1) score += 1;

  // Recency (0-2)
  const ageHours = (Date.now() / 1000 - (post.created_utc || 0)) / 3600;
  if (ageHours <= 24) score += 2;
  else if (ageHours <= 72) score += 1;

  return Math.min(score, 10);
}

async function fetchSubreddit(subreddit: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
      { headers: { "User-Agent": "SpikeAI-Scout/1.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.children || []).map((c: any) => c.data);
  } catch {
    return [];
  }
}

async function searchReddit(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=week&limit=5`,
      { headers: { "User-Agent": "SpikeAI-Scout/1.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.children || []).map((c: any) => c.data);
  } catch {
    return [];
  }
}

function buildNotes(post: any, tools: string[]): string {
  const parts: string[] = [];
  parts.push('Post: "' + (post.title || "").slice(0, 100) + '"');
  parts.push("Subreddit: r/" + (post.subreddit || "unknown"));
  parts.push("Upvotes: " + (post.ups || 0));
  parts.push("Comments: " + (post.num_comments || 0));
  if (tools.length > 0) parts.push("AI tools: " + tools.join(", "));
  if (post.url && !post.url.includes("reddit.com")) parts.push("Link: " + post.url);
  return parts.join(" | ");
}

async function runRedditScout(): Promise<{ found: number; added: number; skipped: number; errors: string[] }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { found: 0, added: 0, skipped: 0, errors: ["Missing environment variables"] };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Collect posts from subreddits + search
  const allPosts: any[] = [];

  // Pick 3 random subreddits
  const shuffledSubs = [...SUBREDDITS].sort(() => Math.random() - 0.5).slice(0, 3);
  for (const sub of shuffledSubs) {
    const posts = await fetchSubreddit(sub);
    allPosts.push(...posts);
  }

  // Pick 2 random search queries
  const shuffledQueries = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5).slice(0, 2);
  for (const query of shuffledQueries) {
    const posts = await searchReddit(query);
    allPosts.push(...posts);
  }

  // Deduplicate by author
  const uniqueAuthors = new Map<string, any>();
  for (const post of allPosts) {
    const author = post.author || "deleted";
    if (author === "deleted" || author === "[deleted]" || author === "AutoModerator") continue;
    if (!uniqueAuthors.has(author)) uniqueAuthors.set(author, post);
    else {
      // Keep the post with more upvotes
      if ((post.ups || 0) > (uniqueAuthors.get(author).ups || 0)) {
        uniqueAuthors.set(author, post);
      }
    }
  }

  // Get existing leads to avoid duplicates
  const { data: existingLeads } = await supabase
    .from("creator_leads")
    .select("profile_url");
  const existingUrls = new Set((existingLeads || []).map((l: any) => l.profile_url));

  let found = uniqueAuthors.size;
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [author, post] of uniqueAuthors) {
    try {
      const profileUrl = "https://reddit.com/user/" + author;

      // Skip if already in pipeline
      if (existingUrls.has(profileUrl)) {
        skipped++;
        continue;
      }

      const text = (post.title || "") + " " + (post.selftext || "");
      const tools = detectAiTools(text);
      const genre = detectGenre(text);
      const score = calculateScore(post);

      // Skip low quality
      if (score <= 1) {
        skipped++;
        continue;
      }

      // Get work URL (external link if available, otherwise reddit post)
      let workUrl = "https://reddit.com" + post.permalink;
      if (post.url && !post.url.includes("reddit.com")) {
        workUrl = post.url;
      }

      const lead = {
        name: author,
        platform: "reddit",
        profile_url: profileUrl,
        work_url: workUrl,
        work_title: (post.title || "").slice(0, 200),
        ai_tools: tools,
        genre: genre,
        score: score,
        notes: buildNotes(post, tools),
        status: "new",
      };

      const { error } = await supabase.from("creator_leads").insert(lead);
      if (error) {
        errors.push("Insert error for " + author + ": " + error.message);
      } else {
        added++;
        existingUrls.add(profileUrl);
      }
    } catch (err: any) {
      errors.push("Error processing " + author + ": " + err.message);
    }
  }

  return { found, added, skipped, errors };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = request.nextUrl.searchParams.get("manual") === "true";

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRedditScout();
    return NextResponse.json({
      success: true,
      message: "Reddit scout: found " + result.found + ", added " + result.added + ", skipped " + result.skipped,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
