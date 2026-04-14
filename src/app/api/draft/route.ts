import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 9 — AI-Powered DM Drafter
   
   Uses Claude to write personalized DMs based on creator briefs.
   Runs daily at 7:20 AM UTC.
   
   Manual: GET /api/draft?manual=true
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
      disable_web_page_preview: true,
    }),
  });
  return res.ok;
}

async function askClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) return "[Claude unavailable - missing API key]";
  
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

    if (!res.ok) {
      const err = await res.text();
      return "[Claude error: " + err.slice(0, 100) + "]";
    }

    const data = await res.json();
    return data.content?.[0]?.text || "[No response]";
  } catch (err: any) {
    return "[Claude error: " + err.message + "]";
  }
}

async function generateDM(lead: any): Promise<{ dm: string; comment: string }> {
  const dmPrompt = `You are Dean Moshe, founder of Spike AI (spikeai.studio), the first streaming platform for AI-generated cinema. Write a short, authentic DM to recruit this creator to upload their films on Spike AI.

Creator info:
- Name: ${lead.name}
- Platform: ${lead.platform}
- Film title: ${lead.work_title || "unknown"}
- AI tools used: ${(lead.ai_tools || []).join(", ") || "unknown"}
- Genre: ${lead.genre || "unknown"}
- Additional info: ${lead.notes || "none"}

Rules:
- Keep it under 150 words
- Be genuine, not salesy
- Mention their specific film or style
- Explain Spike AI briefly (free platform for AI cinema)
- End with a clear call to action (submit at spikeai.studio/submit)
- Sign as Dean, Founder of Spike AI
- Don't use emojis
- Write in English
- Sound like a real person, not a bot`;

  const commentPrompt = `Write a short YouTube comment (2-3 sentences max) for this AI film:
- Title: ${lead.work_title || "an AI film"}
- Genre: ${lead.genre || "unknown"}  
- AI tools: ${(lead.ai_tools || []).join(", ") || "AI tools"}

Rules:
- Be genuinely impressed, mention something specific about the genre or technique
- Don't mention Spike AI at all - this is just to warm up the creator
- Sound natural, like a real viewer
- No emojis
- Keep it very short`;

  const dm = await askClaude(dmPrompt);
  const comment = lead.platform === "youtube" ? await askClaude(commentPrompt) : "";

  return { dm, comment };
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

    // Get hot leads not yet contacted
    const { data: leads } = await supabase
      .from("creator_leads")
      .select("*")
      .eq("status", "new")
      .gte("score", 7)
      .order("score", { ascending: false })
      .limit(5);

    if (!leads || leads.length === 0) {
      await sendTelegram("✉️ <b>DM Drafts</b>\n\nNo hot leads (score 7+) waiting. Pipeline is clear!");
      return NextResponse.json({ success: true, drafts: 0 });
    }

    let count = 0;

    for (const lead of leads) {
      const { dm, comment } = await generateDM(lead);

      const lines = [
        "✉️ <b>DM Draft for " + lead.name + "</b>",
        "Score: " + lead.score + "/10 | " + lead.platform,
        lead.work_url ? "Film: " + lead.work_url : "",
        "",
        "━━━ DM (copy to " + lead.platform + ") ━━━",
        "",
        dm,
        "",
      ];

      if (comment) {
        lines.push("━━━ COMMENT (post under video first) ━━━");
        lines.push("");
        lines.push(comment);
        lines.push("");
      }

      lines.push("━━━━━━━━━━━━━━━━━━━━");
      lines.push("");
      lines.push("💡 <b>Tips:</b>");
      lines.push("  • Post comment FIRST, wait a day, then send DM");
      lines.push("  • Edit anything that doesn't sound like you");
      lines.push("  • After sending, update status in Pipeline");
      if (lead.profile_url) lines.push("  • Profile: " + lead.profile_url);

      await sendTelegram(lines.filter(Boolean).join("\n"));
      count++;
    }

    await sendTelegram(
      "📋 <b>DM Summary</b>\n\n" + count + " AI-written drafts sent for:\n" +
      leads.map((l: any) => "  • " + l.name + " (" + l.platform + ", score " + l.score + ")").join("\n") +
      "\n\n✏️ Written by Claude AI, personalized per creator"
    );

    return NextResponse.json({
      success: true,
      drafts: count,
      names: leads.map((l: any) => l.name),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
