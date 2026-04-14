import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 1 — YouTube Scout + Auto Scorer
   
   Runs daily via Vercel Cron. Searches YouTube for AI films,
   extracts creator info, scores them, and inserts into pipeline.
   
   Also callable manually: GET /api/scout?manual=true
   ═══════════════════════════════════════════════════════════════ */

// ─── Config ───
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Search queries rotated daily
const SEARCH_QUERIES = [
  "AI short film 2026",
  "AI generated movie",
  "Runway Gen-4 film",
  "Kling AI short film",
  "Sora AI film",
  "Pika Labs short film",
  "Hailuo AI movie",
  "AI horror short film",
  "AI anime short film",
  "AI sci-fi short film",
  "Luma Dream Machine film",
  "Veo AI film",
  "Seedance AI film",
  "made with AI film",
  "AI cinema 2026",
];

// AI tools detection from title/description
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
  [/wan\s*2/i, "Wan 2.6"],
];

// Genre detection
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
  [/romance|love/i, "Romance"],
  [/documentary/i, "Documentary"],
  [/experimental/i, "Experimental"],
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

/* ─── Engagement-Based Scoring v2 ───
   Weighs quality over raw numbers.
   A 500-sub creator with 10K views per video scores higher
   than a 50K-sub creator with 2K views.
   ─── Breakdown ───
   Engagement ratio (views/subs):  0-3 points
   Raw reach (views):              0-2 points
   Recency:                        0-2 points
   AI tools specificity:           0-2 points
   Upload activity:                0-1 point
   Total max: 10
*/

interface EngagementData {
  engagementRatio: number;
  uploadFrequency: string;
  channelAgeDays: number;
  subscriberCount: number;
  viewCount: number;
}

function calculateScore(video: any, channel: any): { score: number; engagement: EngagementData } {
  let score = 0;

  const views = parseInt(video.statistics?.viewCount || "0");
  const subs = parseInt(channel?.statistics?.subscriberCount || "0");
  const totalVids = parseInt(channel?.statistics?.videoCount || "0");
  const channelCreated = channel?.snippet?.publishedAt
    ? new Date(channel.snippet.publishedAt)
    : new Date();
  const channelAgeDays = Math.max(1, Math.floor((Date.now() - channelCreated.getTime()) / 86400000));

  // ── Engagement ratio: views-to-subscribers (0-3 points) ──
  // This is the key metric. High ratio = content resonates beyond subscriber base
  let engagementRatio = 0;
  if (subs > 0) {
    engagementRatio = views / subs;
    if (engagementRatio >= 10) score += 3;       // Viral: 10x more views than subs
    else if (engagementRatio >= 3) score += 2;    // Strong: 3x
    else if (engagementRatio >= 1) score += 1;    // Healthy: views >= subs
  } else if (views >= 5000) {
    // No subs data but good views = probably good
    score += 2;
  }

  // ── Raw reach (0-2 points) ──
  // Still matters, but weighted less than ratio
  if (views >= 50000) score += 2;
  else if (views >= 5000) score += 1;

  // ── Recency (0-2 points) ──
  const published = new Date(video.snippet?.publishedAt || 0);
  const daysSince = (Date.now() - published.getTime()) / 86400000;
  if (daysSince <= 7) score += 2;
  else if (daysSince <= 30) score += 1;

  // ── AI tools specificity (0-2 points) ──
  const text = `${video.snippet?.title || ""} ${video.snippet?.description || ""}`;
  const tools = detectAiTools(text);
  if (tools.length >= 2) score += 2;
  else if (tools.length >= 1) score += 1;

  // ── Upload frequency / channel activity (0-1 point) ──
  // Active creators are more likely to engage
  let uploadFrequency = "unknown";
  if (totalVids > 0 && channelAgeDays > 0) {
    const videosPerMonth = (totalVids / channelAgeDays) * 30;
    if (videosPerMonth >= 4) {
      score += 1;
      uploadFrequency = "weekly+";
    } else if (videosPerMonth >= 1) {
      uploadFrequency = "monthly";
    } else {
      uploadFrequency = "rare";
    }
  }

  return {
    score: Math.min(score, 10),
    engagement: {
      engagementRatio: Math.round(engagementRatio * 100) / 100,
      uploadFrequency,
      channelAgeDays,
      subscriberCount: subs,
      viewCount: views,
    },
  };
}

function buildNotes(video: any, views: number, subs: number, tools: string[], engagement?: EngagementData): string {
  const parts: string[] = [];
  parts.push(`Video: "${video.snippet?.title}"`);
  parts.push(`Views: ${views.toLocaleString()}`);
  parts.push(`Channel subs: ${subs.toLocaleString()}`);
  if (engagement) {
    parts.push(`V/S ratio: ${engagement.engagementRatio}x`);
    if (engagement.uploadFrequency !== "unknown") parts.push(`Uploads: ${engagement.uploadFrequency}`);
  }
  if (tools.length > 0) parts.push(`AI tools: ${tools.join(", ")}`);
  const published = new Date(video.snippet?.publishedAt || 0);
  parts.push(`Published: ${published.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`);
  return parts.join(" | ");
}

// ─── YouTube API calls ───

async function searchYouTube(query: string, maxResults: number = 5): Promise<any[]> {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    order: "relevance",
    videoDuration: "short",      // short or medium length
    publishedAfter: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // last 90 days
    key: YOUTUBE_API_KEY!,
  });

  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

async function getVideoDetails(videoIds: string[]): Promise<any[]> {
  if (videoIds.length === 0) return [];
  const params = new URLSearchParams({
    part: "snippet,statistics",
    id: videoIds.join(","),
    key: YOUTUBE_API_KEY!,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

async function getChannelDetails(channelIds: string[]): Promise<Map<string, any>> {
  const map = new Map();
  if (channelIds.length === 0) return map;
  const params = new URLSearchParams({
    part: "snippet,statistics",
    id: channelIds.join(","),
    key: YOUTUBE_API_KEY!,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
  if (!res.ok) return map;
  const data = await res.json();
  for (const ch of data.items || []) {
    map.set(ch.id, ch);
  }
  return map;
}

// ─── Main Scout Function ───

async function runScout(): Promise<{ found: number; added: number; skipped: number; errors: string[] }> {
  if (!YOUTUBE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { found: 0, added: 0, skipped: 0, errors: ["Missing environment variables"] };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Pick 3 random queries to stay within API limits
  const shuffled = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5);
  const todayQueries = shuffled.slice(0, 3);

  const allSearchResults: any[] = [];
  for (const query of todayQueries) {
    const results = await searchYouTube(query, 5);
    allSearchResults.push(...results);
  }

  if (allSearchResults.length === 0) {
    return { found: 0, added: 0, skipped: 0, errors: ["No search results"] };
  }

  // Deduplicate by video ID
  const uniqueVideos = new Map<string, any>();
  for (const item of allSearchResults) {
    const vid = item.id?.videoId;
    if (vid && !uniqueVideos.has(vid)) uniqueVideos.set(vid, item);
  }

  // Get full video details
  const videoIds = Array.from(uniqueVideos.keys());
  const videoDetails = await getVideoDetails(videoIds);

  // Get channel details
  const channelIds = [...new Set(videoDetails.map(v => v.snippet?.channelId).filter(Boolean))];
  const channelMap = await getChannelDetails(channelIds);

  // Get existing leads to avoid duplicates (by profile_url)
  const { data: existingLeads } = await supabase
    .from("creator_leads")
    .select("profile_url");
  const existingUrls = new Set((existingLeads || []).map(l => l.profile_url));

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const video of videoDetails) {
    try {
      const channelId = video.snippet?.channelId;
      const channelUrl = `https://youtube.com/channel/${channelId}`;
      const channel = channelMap.get(channelId);

      // Skip if already in pipeline
      if (existingUrls.has(channelUrl)) {
        skipped++;
        continue;
      }

      const text = `${video.snippet?.title || ""} ${video.snippet?.description || ""}`;
      const tools = detectAiTools(text);
      const genre = detectGenre(text);
      const views = parseInt(video.statistics?.viewCount || "0");
      const { score, engagement } = calculateScore(video, channel);

      // Skip very low quality (score 1 or below)
      if (score <= 1) {
        skipped++;
        continue;
      }

      const lead = {
        name: video.snippet?.channelTitle || "Unknown",
        platform: "youtube",
        profile_url: channelUrl,
        work_url: `https://youtube.com/watch?v=${video.id}`,
        work_title: (video.snippet?.title || "").slice(0, 200),
        ai_tools: tools,
        genre: genre,
        score: score,
        notes: buildNotes(video, views, engagement.subscriberCount, tools, engagement),
        status: "new",
        // Engagement metrics (new columns)
        engagement_ratio: engagement.engagementRatio,
        upload_frequency: engagement.uploadFrequency,
        channel_age_days: engagement.channelAgeDays,
        subscriber_count: engagement.subscriberCount,
        view_count: engagement.viewCount,
      };

      const { error } = await supabase.from("creator_leads").insert(lead);
      if (error) {
        errors.push(`Insert error for ${lead.name}: ${error.message}`);
      } else {
        added++;
        existingUrls.add(channelUrl); // prevent duplicates within same run
      }
    } catch (err: any) {
      errors.push(`Error processing video: ${err.message}`);
    }
  }

  return { found: videoDetails.length, added, skipped, errors };
}

// ─── API Route ───

export async function GET(request: NextRequest) {
  // Verify cron secret or manual trigger
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManual = request.nextUrl.searchParams.get("manual") === "true";

  // In production, only allow Vercel Cron or manual with admin check
  // For now, allow both for testing
  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScout();
    return NextResponse.json({
      success: true,
      message: `Scout complete: found ${result.found}, added ${result.added}, skipped ${result.skipped}`,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
