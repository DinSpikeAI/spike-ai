import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT — Auto Film Enrichment + SEO Fix
   
   Runs daily at 7:30 AM UTC.
   Finds films with missing metadata and uses Claude to fill them.
   Does NOT approve films - only enriches approved ones.
   
   Manual: GET /api/auto-enrich?manual=true
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
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.content?.[0]?.text || "";
  } catch { return ""; }
}

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

    // Find approved films with missing metadata
    const { data: movies } = await supabase
      .from("movies")
      .select("*")
      .eq("status", "approved");

    if (!movies || movies.length === 0) {
      return NextResponse.json({ success: true, enriched: 0 });
    }

    const needsWork = movies.filter((m: any) => {
      return !m.tagline || 
             !m.description || m.description.length < 50 ||
             !m.genre;
    });

    if (needsWork.length === 0) {
      await sendTelegram("✅ <b>Auto Enrich</b>\n\nAll films have complete metadata. Nothing to fix.");
      return NextResponse.json({ success: true, enriched: 0 });
    }

    let enriched = 0;
    const fixed: string[] = [];

    // Process up to 5 films per run to save API costs
    for (const movie of needsWork.slice(0, 5)) {
      const prompt = `You are a film metadata specialist. Generate missing metadata for this AI-generated film.

Film title: "${movie.title}"
Current description: "${movie.description || "none"}"
Creator: "${movie.creator_name || "Unknown"}"
Current genre: "${movie.genre || "none"}"
AI tools used: ${(movie.ai_models || []).join(", ") || "unknown"}

Generate ONLY the missing fields in this exact JSON format (no markdown, no backticks):
{
  ${!movie.tagline ? '"tagline": "a compelling one-line tagline (max 100 chars)",' : ""}
  ${!movie.description || movie.description.length < 50 ? '"description": "an engaging 2-3 sentence description for SEO (100-200 chars)",' : ""}
  ${!movie.genre ? '"genre": "the most fitting genre (pick from: Sci-Fi, Horror, Drama, Thriller, Fantasy, Action, Anime, Cyberpunk, Romance, Comedy, Documentary, Experimental)",' : ""}
  "done": true
}

Rules:
- Only include fields that are missing
- Keep tagline punchy and short
- Description should make someone want to watch the film
- Output valid JSON only, no other text`;

      const result = await askClaude(prompt);
      if (!result) continue;

      try {
        // Clean response
        const cleaned = result.replace(/```json\s*/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleaned);

        const updates: any = {};
        if (data.tagline && !movie.tagline) updates.tagline = data.tagline;
        if (data.description && (!movie.description || movie.description.length < 50)) updates.description = data.description;
        if (data.genre && !movie.genre) updates.genre = data.genre;

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase.from("movies").update(updates).eq("id", movie.id);
          if (!error) {
            enriched++;
            fixed.push(movie.title + " → " + Object.keys(updates).join(", "));
          }
        }
      } catch {
        // JSON parse failed, skip
      }
    }

    if (enriched > 0) {
      await sendTelegram(
        "🔧 <b>Auto Enrich</b>\n\n" +
        enriched + " films updated:\n" +
        fixed.map(f => "  • " + f).join("\n") +
        "\n\n" + (needsWork.length - enriched > 0 ? (needsWork.length - enriched) + " more films still need work" : "All done!")
      );
    }

    return NextResponse.json({
      success: true,
      enriched,
      remaining: needsWork.length - enriched,
      fixed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
