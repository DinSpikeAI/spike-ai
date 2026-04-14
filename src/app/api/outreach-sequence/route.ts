import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 15 — Outreach Sequencer

   Manages a 4-step outreach sequence for hot leads:
     Step 1 (Day 0): Claude drafts YouTube comment → Telegram
     Step 2 (Day 1): Claude drafts personalized DM → Telegram
     Step 3 (Day 4): Claude drafts follow-up DM → Telegram
     Step 4 (Day 8): Claude drafts last-try message → Telegram

   All drafts go to Telegram for manual review and sending.
   Nothing is sent automatically to creators.

   Safety:
     - Only processes leads with score >= 7
     - Max 5 leads per run
     - Sequence can be paused per lead (sequence_paused = true)
     - Leads that reply at any stage are removed from sequence

   Runs daily at 7:25 AM UTC.
   Manual: GET /api/outreach-sequence?manual=true
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ─── Config ───
const MIN_SCORE = 7;
const MAX_PER_RUN = 5;

// Adaptive timing: high-value leads get faster follow-ups
function getStepDelay(nextStep: number, score: number): number {
  if (score >= 9) {
    // Fast track: 0 → 12h → 48h → 72h
    return { 2: 12, 3: 48, 4: 72 }[nextStep] || 24;
  }
  if (score >= 8) {
    // Priority: 0 → 18h → 60h → 84h
    return { 2: 18, 3: 60, 4: 84 }[nextStep] || 24;
  }
  // Standard: 0 → 24h → 72h → 96h
  return { 2: 24, 3: 72, 4: 96 }[nextStep] || 24;
}

// ─── Telegram ───
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

// ─── Claude ───
async function askClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) return "[Claude unavailable]";
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
    if (!res.ok) return "[Claude error]";
    const data = await res.json();
    return data.content?.[0]?.text || "[No response]";
  } catch {
    return "[Claude error]";
  }
}

// ─── Creator Memory ───

async function getCreatorMemory(supabase: any, leadId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("creator_memory")
      .select("interactions, notes")
      .eq("lead_id", leadId)
      .single();

    if (!data) return "";

    const parts: string[] = [];
    if (data.notes) parts.push(`Background: ${data.notes}`);
    if (data.interactions && data.interactions.length > 0) {
      const history = data.interactions
        .slice(-3)
        .map((i: any) => `${i.type} on ${new Date(i.date).toLocaleDateString("en-GB")}: "${i.snippet}"`)
        .join("; ");
      parts.push(`Previous interactions: ${history}`);
    }
    return parts.join("\n");
  } catch {
    return "";
  }
}

// ─── Step Generators ───

function buildStep1Prompt(lead: any): string {
  return `Write a short YouTube comment (2-3 sentences) for this AI film:
- Title: ${lead.work_title || "an AI film"}
- Creator: ${lead.name}
- Genre: ${lead.genre || "unknown"}
- AI tools: ${(lead.ai_tools || []).join(", ") || "AI tools"}

Rules:
- Be genuinely impressed, mention something specific about the genre or technique
- Do NOT mention Spike AI at all - this is just to warm up the creator
- Sound natural, like a real viewer who appreciates the craft
- No emojis, no exclamation marks
- 2-3 sentences max`;
}

function buildStep2Prompt(lead: any, memory: string = ""): string {
  return `You are Dean Moshe, founder of Spike AI (spikeai.studio), the first streaming platform for AI-generated cinema.

Write a short, authentic DM to recruit this creator. This is your FIRST direct contact.

Creator:
- Name: ${lead.name}
- Platform: ${lead.platform}
- Film: "${lead.work_title || "their AI film"}"
- AI tools: ${(lead.ai_tools || []).join(", ") || "unknown"}
- Genre: ${lead.genre || "unknown"}
${memory ? "\nContext from previous interactions:\n" + memory : ""}

Rules:
- Under 120 words
- Mention their specific film or style
- Explain Spike AI in one sentence (free streaming platform for AI cinema)
- Clear CTA: submit at spikeai.studio/submit
- Sign as Dean, Founder of Spike AI
- Genuine and personal, not salesy
- No emojis`;
}

function buildStep3Prompt(lead: any): string {
  return `You are Dean Moshe, founder of Spike AI. Write a SHORT follow-up DM to a creator you contacted 3 days ago who hasn't responded.

Creator:
- Name: ${lead.name}
- Their film: "${lead.work_title || "their AI film"}"
- AI tools: ${(lead.ai_tools || []).join(", ") || "unknown"}

Rules:
- Under 80 words
- Reference your previous message casually ("I reached out a few days ago")
- Add one new value point (e.g., free exposure, creator page, community)
- Keep it light and low-pressure
- No emojis
- Sign as Dean`;
}

function buildStep4Prompt(lead: any): string {
  return `You are Dean Moshe, founder of Spike AI. Write a final, brief message to a creator who hasn't responded to two previous messages.

Creator:
- Name: ${lead.name}
- Their film: "${lead.work_title || "their AI film"}"

Rules:
- Under 60 words
- Acknowledge you don't want to bother them
- Leave the door open ("whenever you're ready")
- Include the link one last time: spikeai.studio
- Warm and respectful tone
- No emojis
- Sign as Dean`;
}

// ─── Sequence Processing ───

interface SequenceResult {
  newEntries: number;
  stepsAdvanced: number;
  completed: number;
  paused: number;
  details: string[];
}

async function processSequence(supabase: any): Promise<SequenceResult> {
  const result: SequenceResult = { newEntries: 0, stepsAdvanced: 0, completed: 0, paused: 0, details: [] };
  const now = new Date();

  // ─── Phase 1: Enroll new hot leads into the sequence ───
  const { data: newLeads } = await supabase
    .from("creator_leads")
    .select("*")
    .eq("status", "new")
    .eq("sequence_step", 0)
    .gte("score", MIN_SCORE)
    .order("score", { ascending: false })
    .limit(MAX_PER_RUN);

  if (newLeads && newLeads.length > 0) {
    for (const lead of newLeads) {
      // Start sequence: set step 1, generate comment draft
      const comment = await askClaude(buildStep1Prompt(lead));

      await supabase
        .from("creator_leads")
        .update({
          sequence_step: 1,
          sequence_started_at: now.toISOString(),
          next_sequence_at: new Date(now.getTime() + getStepDelay(2, lead.score) * 3600000).toISOString(),
        })
        .eq("id", lead.id);

      const msg = [
        `🎯 <b>SEQUENCE Step 1/4 — YouTube Comment</b>`,
        `Creator: <b>${lead.name}</b> (score ${lead.score}/10)`,
        lead.work_url ? `Film: ${lead.work_url}` : "",
        "",
        "━━━ COMMENT (post under their video) ━━━",
        "",
        comment,
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        "📋 Post this comment, then wait 24h for Step 2 (DM)",
        `⏸ To pause: set sequence_paused=true in DB for this lead`,
      ].filter(Boolean).join("\n");

      await sendTelegram(msg);
      result.newEntries++;
      result.details.push(`Step 1: ${lead.name}`);
    }
  }

  // ─── Phase 2: Advance existing sequences ───
  const { data: activeLeads } = await supabase
    .from("creator_leads")
    .select("*")
    .eq("sequence_paused", false)
    .gt("sequence_step", 0)
    .lt("sequence_step", 4)
    .lte("next_sequence_at", now.toISOString())
    .in("status", ["new", "contacted", "followed_up"])
    .order("next_sequence_at", { ascending: true })
    .limit(MAX_PER_RUN);

  if (activeLeads && activeLeads.length > 0) {
    for (const lead of activeLeads) {
      const nextStep = lead.sequence_step + 1;

      // Skip leads that replied or were marked interested
      if (["replied", "interested", "signed_up", "active", "declined"].includes(lead.status)) {
        result.details.push(`Skipped ${lead.name}: status changed to ${lead.status}`);
        continue;
      }

      let draft = "";
      let stepLabel = "";
      let nextStatus = lead.status;

      // Load creator memory for personalized DMs
      const memory = await getCreatorMemory(supabase, lead.id);

      if (nextStep === 2) {
        draft = await askClaude(buildStep2Prompt(lead, memory));
        stepLabel = "DM Draft";
        nextStatus = "contacted";
      } else if (nextStep === 3) {
        draft = await askClaude(buildStep3Prompt(lead));
        stepLabel = "Follow-up DM";
        nextStatus = "followed_up";
      } else if (nextStep === 4) {
        draft = await askClaude(buildStep4Prompt(lead));
        stepLabel = "Last Try";
        nextStatus = "followed_up";
      }

      // Calculate next delay (adaptive based on score)
      const nextDelay = nextStep < 4
        ? getStepDelay(nextStep + 1, lead.score)
        : 0;
      const nextAt = nextDelay > 0
        ? new Date(now.getTime() + nextDelay * 3600000).toISOString()
        : null;

      await supabase
        .from("creator_leads")
        .update({
          sequence_step: nextStep,
          next_sequence_at: nextAt,
          status: nextStatus,
          contacted_at: nextStep === 2 ? now.toISOString() : lead.contacted_at,
        })
        .eq("id", lead.id);

      // Log to outreach_log
      await supabase.from("outreach_log").insert({
        lead_id: lead.id,
        type: `sequence_step_${nextStep}`,
        content: draft.slice(0, 500),
        sent_at: now.toISOString(),
      }).catch(() => {});

      const stepEmoji = nextStep === 2 ? "✉️" : nextStep === 3 ? "🔄" : "🏁";
      const platformNote = lead.platform === "youtube"
        ? `Send via YouTube DM or ${lead.profile_url ? "channel" : "email"}`
        : `Send via ${lead.platform}`;

      const msg = [
        `${stepEmoji} <b>SEQUENCE Step ${nextStep}/4 — ${stepLabel}</b>`,
        `Creator: <b>${lead.name}</b> (score ${lead.score}/10)`,
        lead.profile_url ? `Profile: ${lead.profile_url}` : "",
        "",
        `━━━ ${stepLabel.toUpperCase()} (copy and send) ━━━`,
        "",
        draft,
        "",
        "━━━━━━━━━━━━━━━━━━━━",
        "",
        `📋 ${platformNote}`,
        nextStep < 4
          ? `⏰ Next step in ${Math.round(nextDelay / 24)} days (Step ${nextStep + 1})`
          : "✅ Sequence complete for this lead",
        nextStep === 4 ? "💡 If no reply, lead will be marked as no_response" : "",
      ].filter(Boolean).join("\n");

      await sendTelegram(msg);
      result.stepsAdvanced++;
      result.details.push(`Step ${nextStep}: ${lead.name}`);

      if (nextStep === 4) result.completed++;
    }
  }

  // ─── Phase 3: Count paused sequences ───
  const { count: pausedCount } = await supabase
    .from("creator_leads")
    .select("*", { count: "exact", head: true })
    .eq("sequence_paused", true)
    .gt("sequence_step", 0);

  result.paused = pausedCount || 0;

  return result;
}

// ─── API Route ───

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
    const result = await processSequence(supabase);

    // Summary to Telegram
    if (result.newEntries > 0 || result.stepsAdvanced > 0) {
      const summary = [
        "📊 <b>Outreach Sequencer Summary</b>",
        "",
        `🆕 New sequences started: ${result.newEntries}`,
        `📤 Steps advanced: ${result.stepsAdvanced}`,
        `✅ Sequences completed: ${result.completed}`,
        result.paused > 0 ? `⏸ Paused: ${result.paused}` : "",
        "",
        result.details.map(d => `  • ${d}`).join("\n"),
      ].filter(Boolean).join("\n");

      await sendTelegram(summary);
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
