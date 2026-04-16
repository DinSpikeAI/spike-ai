import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 5 — Follow-up Reminder
   AGENT 7 — Onboarding Checker
   
   Runs daily at 7:10 AM UTC via Vercel Cron.
   
   Agent 5: Checks leads contacted 3+ days ago with no reply.
   Agent 7: Checks new creators who haven't submitted films.
   
   Sends alerts to Telegram.
   Manual: GET /api/check?manual=true
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
    }),
  });
  return res.ok;
}

async function checkFollowUps(supabase: any): Promise<string[]> {
  const lines: string[] = [];

  // Leads contacted 3+ days ago with no reply
  const { data: leads } = await supabase
    .from("creator_leads")
    .select("*")
    .in("status", ["contacted", "followed_up"]);

  if (!leads || leads.length === 0) return lines;

  const needFollowUp = leads.filter((l: any) => {
    if (!l.contacted_at) return false;
    const days = (Date.now() - new Date(l.contacted_at).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 3;
  });

  if (needFollowUp.length === 0) return lines;

  lines.push("");
  lines.push("⏰ <b>Follow-up Needed</b>");
  lines.push("");

  needFollowUp.forEach((l: any) => {
    const days = Math.floor((Date.now() - new Date(l.contacted_at).getTime()) / (1000 * 60 * 60 * 24));
    const score = l.score >= 8 ? "🔥" : l.score >= 5 ? "⭐" : "👤";
    lines.push(`${score} <b>${l.name}</b> (${l.platform})`);
    lines.push(`   Score: ${l.score}/10 · ${days} days since contact`);
    if (l.work_title) lines.push(`   Film: ${l.work_title}`);
    lines.push("");
  });

  lines.push(`Total: ${needFollowUp.length} leads waiting`);

  return lines;
}

async function checkOnboarding(supabase: any): Promise<string[]> {
  const lines: string[] = [];

  // Creators who signed up but haven't submitted any films
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, display_name, email, created_at, user_type")
    .eq("user_type", "creator");

  if (!creators || creators.length === 0) return lines;

  // Get all movies with creator_id
  const { data: movies } = await supabase
    .from("movies")
    .select("creator_id, creator_name");

  const creatorsWithFilms = new Set<string>();
  (movies || []).forEach((m: any) => {
    if (m.creator_id) creatorsWithFilms.add(m.creator_id);
  });

  // Also match by display_name
  const creatorNames = new Set<string>();
  (movies || []).forEach((m: any) => {
    if (m.creator_name) creatorNames.add(m.creator_name.toLowerCase());
  });

  const noFilms = creators.filter((c: any) => {
    if (creatorsWithFilms.has(c.id)) return false;
    if (c.display_name && creatorNames.has(c.display_name.toLowerCase())) return false;
    return true;
  });

  if (noFilms.length === 0) return lines;

  // Split by how long ago they joined
  const newCreators = noFilms.filter((c: any) => {
    const days = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 3;
  });

  const waitingCreators = noFilms.filter((c: any) => {
    const days = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 3 && days <= 14;
  });

  const dormantCreators = noFilms.filter((c: any) => {
    const days = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 14;
  });

  lines.push("");
  lines.push("🎬 <b>Creator Onboarding</b>");
  lines.push("");

  if (newCreators.length > 0) {
    lines.push(`🆕 <b>New (0-3 days):</b> ${newCreators.length}`);
    newCreators.forEach((c: any) => {
      lines.push(`   • ${c.display_name || c.email} — no film yet`);
    });
    lines.push("");
  }

  if (waitingCreators.length > 0) {
    lines.push(`⏳ <b>Waiting (3-14 days):</b> ${waitingCreators.length}`);
    waitingCreators.forEach((c: any) => {
      const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
      lines.push(`   • ${c.display_name || c.email} — ${days} days, no film`);
    });
    lines.push("");
  }

  if (dormantCreators.length > 0) {
    lines.push(`💤 <b>Dormant (14+ days):</b> ${dormantCreators.length}`);
  }

  return lines;
}

// ─── Post-signup encouragement drafts ─────────
// For creators who signed up but haven't uploaded: prepares a
// ready-to-send DM draft at 3 / 7 / 14 day milestones.
//
// Only generates ONE draft per creator per day to avoid spam.
// Dean manually sends the draft via email/DM.

async function buildEncouragementDrafts(supabase: any): Promise<string[]> {
  const lines: string[] = [];

  // Get all creator profiles
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, display_name, email, created_at")
    .eq("user_type", "creator");

  if (!creators || creators.length === 0) return lines;

  // Get all movie creator_ids (these creators already uploaded)
  const { data: allMovies } = await supabase
    .from("movies")
    .select("creator_id, creator_name")
    .not("creator_id", "is", null);

  const creatorsWithFilms = new Set(
    (allMovies || []).map((m: any) => m.creator_id).filter(Boolean)
  );

  // Filter creators without films
  const noFilms = creators.filter(
    (c: any) => !creatorsWithFilms.has(c.id)
  );

  if (noFilms.length === 0) return lines;

  // Find creators hitting the milestone days: 3, 7, 14
  // Allow ±12 hour window around the exact day
  type Milestone = 3 | 7 | 14;
  const matchMilestone = (days: number): Milestone | null => {
    if (days >= 2.5 && days < 3.5) return 3;
    if (days >= 6.5 && days < 7.5) return 7;
    if (days >= 13.5 && days < 14.5) return 14;
    return null;
  };

  type DueCreator = { creator: any; milestone: Milestone };
  const dueToday: DueCreator[] = [];

  for (const c of noFilms) {
    const days = (Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const m = matchMilestone(days);
    if (m) dueToday.push({ creator: c, milestone: m });
  }

  if (dueToday.length === 0) return lines;

  lines.push("");
  lines.push("💌 <b>Encouragement Drafts</b>");
  lines.push("<i>Copy + send via email/DM to these creators:</i>");
  lines.push("");

  for (const { creator, milestone } of dueToday) {
    const name = creator.display_name || creator.email?.split("@")[0] || "there";
    let draft = "";

    if (milestone === 3) {
      draft = `Hi ${name}! Welcome aboard 👋 Just checking in - any questions about uploading your first film on Spike? Happy to help if you hit any snags. If you're still picking which film to share, I'd start with your most visually striking piece - AI cinema rewards showmanship.`;
    } else if (milestone === 7) {
      draft = `Hey ${name}, noticed you haven't uploaded yet. No pressure - just want to make sure the process is clear. You can submit at spikeai.studio/submit (takes 2 min). If there's something blocking you - tech issue, not sure which film, anything - just reply and I'll sort it out.`;
    } else {
      draft = `Hi ${name}, it's been two weeks since you joined. I'd love to see what you've been working on. Even a 30-second clip counts. The platform is growing fast and early uploads get prime placement. If you've moved on from AI cinema, no worries - but if you're sitting on something, I'd love to showcase it.`;
    }

    lines.push(`<b>${name}</b> (day ${milestone})`);
    lines.push(`<pre>${draft}</pre>`);
    lines.push(creator.email ? `Email: ${creator.email}` : "");
    lines.push("");
  }

  return lines;
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

    const followUpLines = await checkFollowUps(supabase);
    const onboardingLines = await checkOnboarding(supabase);
    const encouragementLines = await buildEncouragementDrafts(supabase);

    const allLines = [
      "🔔 <b>Spike AI — Action Items</b>",
      ...followUpLines,
      ...onboardingLines,
      ...encouragementLines,
    ];

    // Only send if there's something to report
    if (followUpLines.length === 0 && onboardingLines.length === 0 && encouragementLines.length === 0) {
      allLines.push("");
      allLines.push("✅ Nothing needs attention today.");
    }

    allLines.push("");
    allLines.push("→ <a href=\"https://www.spikeai.studio/admin/pipeline\">Pipeline</a> · <a href=\"https://www.spikeai.studio/admin/dashboard\">Dashboard</a>");

    const message = allLines.join("\n");
    const sent = await sendTelegram(message);

    return NextResponse.json({
      success: true,
      sent,
      followUps: followUpLines.length > 0,
      onboarding: onboardingLines.length > 0,
      encouragement: encouragementLines.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
