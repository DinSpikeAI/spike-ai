import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT — Blog Auto-Writer
   
   Runs every Sunday at 8:00 AM UTC.
   Claude writes a full blog post based on platform data.
   Post is saved as markdown file content and added to blog_drafts.
   
   Manual: GET /api/auto-blog?manual=true
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
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  return res.ok;
}

async function askClaude(prompt: string, maxTokens: number = 2000): Promise<string> {
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
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch { return ""; }
}

// Rotate blog topic types
const TOPIC_TYPES = [
  "weekly_roundup",
  "tool_comparison",
  "creator_spotlight",
  "industry_trends",
  "how_to_guide",
];

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

    // Gather platform data
    const { data: movies } = await supabase.from("movies").select("*").eq("status", "approved");
    const { data: profiles } = await supabase.from("profiles").select("display_name, user_type").eq("user_type", "creator");

    const allMovies = movies || [];
    const creators = profiles || [];

    // Collect stats
    const toolCounts: Record<string, number> = {};
    const genreCounts: Record<string, number> = {};
    allMovies.forEach((m: any) => {
      (m.ai_models || []).forEach((t: string) => { toolCounts[t] = (toolCounts[t] || 0) + 1; });
      if (m.genre) m.genre.split(",").map((g: string) => g.trim()).forEach((g: string) => { if (g) genreCounts[g] = (genreCounts[g] || 0) + 1; });
    });

    const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const recentFilms = allMovies.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
    const topFilms = allMovies.sort((a: any, b: any) => (b.upvotes_count || 0) - (a.upvotes_count || 0)).slice(0, 5);

    // Pick topic type
    const topicType = TOPIC_TYPES[Math.floor(Math.random() * TOPIC_TYPES.length)];

    const dataContext = `
Platform stats:
- Total films: ${allMovies.length}
- Total creators: ${creators.length}
- Top AI tools: ${topTools.map(t => t[0] + " (" + t[1] + " films)").join(", ")}
- Top genres: ${topGenres.map(g => g[0] + " (" + g[1] + " films)").join(", ")}
- Recent films: ${recentFilms.map((m: any) => '"' + m.title + '" by ' + (m.creator_name || "Unknown") + " (" + (m.ai_models || []).join(", ") + ")").join("; ")}
- Most popular: ${topFilms.map((m: any) => '"' + m.title + '" (' + (m.upvotes_count || 0) + " upvotes)").join("; ")}
`;

    const topicPrompts: Record<string, string> = {
      weekly_roundup: "Write a 'This Week in AI Cinema' roundup highlighting the newest films on the platform.",
      tool_comparison: "Write a comparison article about the most popular AI filmmaking tools based on what creators on the platform are actually using.",
      creator_spotlight: "Write an article celebrating the creators on the platform and what makes AI filmmaking special.",
      industry_trends: "Write an article about trends in AI cinema based on what you see in the platform data.",
      how_to_guide: "Write a practical guide for aspiring AI filmmakers on how to create and publish their first AI short film.",
    };

    const prompt = `You are the editor of the Spike AI blog (spikeai.studio/blog). Write a high-quality blog post.

Topic type: ${topicType}
${topicPrompts[topicType]}

${dataContext}

Format your response EXACTLY like this (this is a markdown file with frontmatter):

---
title: "Your Title Here"
excerpt: "A compelling 1-2 sentence summary"
category: "AI Cinema"
date: "${new Date().toISOString().split("T")[0]}"
image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&h=630&fit=crop"
featured: false
---

Your article content here in markdown...

Rules:
- Title should be SEO-friendly and compelling
- Article should be 600-900 words
- Use ## for section headings
- Include links to films on the platform where relevant: https://www.spikeai.studio/movie/FILM_ID
- Mention Spike AI naturally (not forced)
- Write for an audience interested in AI filmmaking
- Be informative and engaging, not promotional
- Use real data from the platform stats provided
- End with a call to action (watch films on Spike AI or submit your own)`;

    const article = await askClaude(prompt, 2000);

    if (!article) {
      await sendTelegram("❌ <b>Blog Writer</b>\n\nClaude failed to generate article.");
      return NextResponse.json({ success: false, error: "Claude failed" });
    }

    // Extract title from frontmatter
    const titleMatch = article.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : "AI Cinema Update";
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Check for duplicate slug
    const { data: existing } = await supabase.from("blog_drafts").select("slug").eq("slug", slug);
    if (existing && existing.length > 0) {
      await sendTelegram("⚠️ <b>Blog Writer</b>\n\nArticle with similar title already exists. Skipped.");
      return NextResponse.json({ success: false, error: "Duplicate slug" });
    }

    // Save to blog_drafts
    const { error } = await supabase.from("blog_drafts").insert({
      slug,
      title,
      content: article,
      category: "AI Cinema",
      published: true,
    });

    if (error) {
      await sendTelegram("❌ <b>Blog Writer</b>\n\nFailed to save: " + error.message);
      return NextResponse.json({ success: false, error: error.message });
    }

    await sendTelegram(
      "📝 <b>New Blog Post Published</b>\n\n" +
      "Title: " + title + "\n" +
      "Type: " + topicType.replace("_", " ") + "\n" +
      "Slug: " + slug + "\n\n" +
      "✅ Auto-published to blog_drafts table"
    );

    return NextResponse.json({
      success: true,
      title,
      slug,
      topicType,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
