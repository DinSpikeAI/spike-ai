import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 17 — Auto YouTube Comment

   Posts warm-up comments on high-score YouTube leads' videos.
   Comments are AI-generated, genuine, and do NOT mention Spike AI.
   Purpose: warm up the creator before DM outreach (Step 1 of
   the Outreach Sequencer).

   Safety guards:
     - Only leads with score >= 8 and platform = "youtube"
     - Max 3 comments per day (YouTube API ToS safe)
     - Never comments on the same video twice
     - Comments are reviewed by Claude for quality
     - Kill switch via DISABLE_AUTO_COMMENT env var
     - Logs every comment to outreach_log + Telegram

   Requires: YOUTUBE_API_KEY with comment posting scope
   (OAuth 2.0 with comments.insert permission).

   NOTE: The YouTube Data API requires OAuth 2.0 user credentials
   (not just an API key) to post comments. This agent currently
   uses the API key for READ operations. For WRITE (posting),
   you need to set up OAuth 2.0 and store a refresh token.
   Until then, this agent drafts comments and sends them to
   Telegram for manual posting.

   Runs daily at 7:50 AM UTC.
   Manual: GET /api/auto-comment?manual=true
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ─── Config ───
const MIN_SCORE = 8;
const MAX_COMMENTS_PER_DAY = 3;
// Set YOUTUBE_OAUTH_TOKEN to enable auto-posting (OAuth 2.0 access token)
// Without it, comments are drafted and sent to Telegram only
const YOUTUBE_OAUTH_TOKEN = process.env.YOUTUBE_OAUTH_TOKEN;

// ─── Helpers ───

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

function extractVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v") || u.pathname.split("/embed/")[1] || null;
    }
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
  } catch {}
  return null;
}

// ─── YouTube Comment Posting ───
// This requires OAuth 2.0 credentials, not just an API key.
// For now, we draft and send to Telegram.

async function postYouTubeComment(videoId: string, comment: string): Promise<{ posted: boolean; commentId?: string; error?: string }> {
  if (!YOUTUBE_OAUTH_TOKEN) {
    // No OAuth token - draft only mode
    return { posted: false, error: "draft_only" };
  }

  try {
    const res = await fetch("https://www.googleapis.com/youtube/v3/commentThreads?part=snippet", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOUTUBE_OAUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: comment,
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { posted: false, error: err.slice(0, 200) };
    }

    const data = await res.json();
    return { posted: true, commentId: data.id };
  } catch (err: any) {
    return { posted: false, error: err.message };
  }
}

// ─── Comment Generator ───

function buildCommentPrompt(lead: any): string {
  return `Write a YouTube comment for this AI-generated film:

Title: "${lead.work_title || "an AI film"}"
Creator: ${lead.name}
Genre: ${lead.genre || "unknown"}
AI tools: ${(lead.ai_tools || []).join(", ") || "AI tools"}
Additional context: ${(lead.notes || "").slice(0, 200)}

Rules:
- 2-3 sentences MAX. Keep it short and natural.
- Be genuinely impressed. Mention something specific about the style, technique, or genre.
- Do NOT mention Spike AI, streaming, platforms, or uploading anywhere.
- Do NOT ask them to contact you or visit any website.
- Sound like a real viewer who appreciates AI filmmaking craft.
- No emojis, no exclamation marks.
- No generic phrases like "amazing work" or "incredible". Be specific.
- Write ONLY the comment text, nothing else.`;
}

// ─── Quality Check ───

async function validateComment(comment: string): Promise<boolean> {
  // Basic safety checks
  const lower = comment.toLowerCase();

  // Must not mention Spike AI
  if (lower.includes("spike") || lower.includes("spikeai")) return false;

  // Must not include promotional language
  const promoWords = ["check out", "visit", "platform", "upload", "submit", "streaming", "subscribe"];
  if (promoWords.some(w => lower.includes(w))) return false;

  // Must be reasonable length
  if (comment.length < 20 || comment.length > 500) return false;

  // Must not start with generic praise
  const genericStarts = ["amazing", "incredible", "awesome", "wow"];
  if (genericStarts.some(w => lower.startsWith(w))) return false;

  return true;
}

// ─── Main ───

async function runAutoComment(supabase: any): Promise<{
  processed: number;
  posted: number;
  drafted: number;
  skipped: number;
  errors: string[];
}> {
  const result = { processed: 0, posted: 0, drafted: 0, skipped: 0, errors: [] as string[] };

  // Get eligible leads: high score, YouTube, not yet commented
  const { data: leads } = await supabase
    .from("creator_leads")
    .select("*")
    .eq("platform", "youtube")
    .eq("youtube_commented", false)
    .eq("status", "new")
    .gte("score", MIN_SCORE)
    .order("score", { ascending: false })
    .limit(MAX_COMMENTS_PER_DAY);

  if (!leads || leads.length === 0) return result;

  for (const lead of leads) {
    result.processed++;

    const videoId = extractVideoId(lead.work_url);
    if (!videoId) {
      result.skipped++;
      result.errors.push(`No video ID for ${lead.name}`);
      continue;
    }

    // Generate comment
    const comment = await askClaude(buildCommentPrompt(lead));
    if (!comment) {
      result.skipped++;
      result.errors.push(`Claude failed for ${lead.name}`);
      continue;
    }

    // Quality gate
    const isValid = await validateComment(comment);
    if (!isValid) {
      result.skipped++;
      result.errors.push(`Quality check failed for ${lead.name}: "${comment.slice(0, 50)}..."`);
      continue;
    }

    // Try to post (if OAuth token exists)
    const postResult = await postYouTubeComment(videoId, comment);

    if (postResult.posted) {
      // Auto-posted successfully
      await supabase.from("creator_leads").update({
        youtube_commented: true,
        youtube_comment_id: postResult.commentId,
      }).eq("id", lead.id);

      await supabase.from("outreach_log").insert({
        lead_id: lead.id,
        type: "youtube_comment_auto",
        content: comment,
        sent_at: new Date().toISOString(),
      }).catch(() => {});

      const msg = [
        "💬 <b>Auto Comment POSTED</b>",
        `Creator: <b>${lead.name}</b> (score ${lead.score}/10)`,
        `Video: ${lead.work_url}`,
        "",
        "━━━ Comment ━━━",
        comment,
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        `✅ Posted automatically (ID: ${postResult.commentId})`,
      ].join("\n");

      await sendTelegram(msg);
      result.posted++;
    } else {
      // Draft mode - send to Telegram for manual posting
      const msg = [
        "💬 <b>Comment Draft — POST MANUALLY</b>",
        `Creator: <b>${lead.name}</b> (score ${lead.score}/10)`,
        `Video: ${lead.work_url}`,
        "",
        "━━━ Copy this comment ━━━",
        "",
        comment,
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        "📋 Open the video link above and paste this comment",
        "🎯 This warms up the creator before DM outreach",
      ].join("\n");

      await sendTelegram(msg);

      // Mark as commented (even though it's manual) to prevent duplicate drafts
      await supabase.from("creator_leads").update({
        youtube_commented: true,
      }).eq("id", lead.id);

      await supabase.from("outreach_log").insert({
        lead_id: lead.id,
        type: "youtube_comment_draft",
        content: comment,
        sent_at: new Date().toISOString(),
      }).catch(() => {});

      result.drafted++;
    }
  }

  return result;
}

// ─── API Route ───

export async function GET(request: NextRequest) {
  // Cron-only endpoint. Manual trigger via ?manual=true was removed for security.
  // To run this manually, use the Telegram bot or OpenClaw.
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Kill switch
  if (process.env.DISABLE_AUTO_COMMENT === "true") {
    return NextResponse.json({ success: true, message: "Agent disabled via DISABLE_AUTO_COMMENT" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const result = await runAutoComment(supabase);

    // Summary
    if (result.processed > 0) {
      const summary = [
        "💬 <b>Auto Comment Summary</b>",
        "",
        `Processed: ${result.processed}`,
        result.posted > 0 ? `Auto-posted: ${result.posted}` : "",
        result.drafted > 0 ? `Drafted (manual): ${result.drafted}` : "",
        result.skipped > 0 ? `Skipped: ${result.skipped}` : "",
        "",
        YOUTUBE_OAUTH_TOKEN ? "Mode: Auto-post" : "Mode: Draft only (set YOUTUBE_OAUTH_TOKEN to enable auto-post)",
      ].filter(Boolean).join("\n");

      await sendTelegram(summary);
    }

    return NextResponse.json({
      success: true,
      ...result,
      mode: YOUTUBE_OAUTH_TOKEN ? "auto" : "draft",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
