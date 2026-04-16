import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 4 — Telegram Reporter
   
   Runs daily via Vercel Cron at 7:05 AM UTC.
   Sends pipeline summary + action items to Telegram.
   
   Also callable manually: GET /api/report?manual=true
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

async function buildReport(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return "Error: Missing environment variables";
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Pipeline stats
  const { data: leads } = await supabase.from("creator_leads").select("*");
  const all = leads || [];

  const stats = {
    total: all.length,
    new: all.filter(l => l.status === "new").length,
    hot: all.filter(l => l.score >= 8 && l.status === "new").length,
    contacted: all.filter(l => ["contacted", "followed_up"].includes(l.status)).length,
    replied: all.filter(l => l.status === "replied").length,
    interested: all.filter(l => l.status === "interested").length,
    signed_up: all.filter(l => l.status === "signed_up").length,
    active: all.filter(l => l.status === "active").length,
    declined: all.filter(l => l.status === "declined").length,
  };

  // Found today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const foundToday = all.filter(l => new Date(l.found_at) >= today).length;

  // Need follow-up (contacted 3+ days ago, no reply)
  const needFollowUp = all.filter(l => {
    if (!["contacted", "followed_up"].includes(l.status)) return false;
    if (!l.contacted_at) return false;
    const days = (Date.now() - new Date(l.contacted_at).getTime()) / (1000 * 60 * 60 * 24);
    return days >= 3;
  });

  // Hot leads not yet contacted
  const hotLeads = all.filter(l => l.score >= 8 && l.status === "new");

  // Platform stats
  const { data: movies } = await supabase
    .from("movies")
    .select("status")
    .eq("status", "pending");
  const pendingFilms = movies?.length || 0;

  const { data: profiles, count: userCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact" });

  // Build message
  const lines: string[] = [];
  lines.push("📊 <b>Spike AI — Daily Report</b>");
  lines.push("");
  lines.push("🎯 <b>Pipeline</b>");
  lines.push(`   New: ${stats.new} (${foundToday} today) | Hot: ${stats.hot}`);
  lines.push(`   Contacted: ${stats.contacted} | Replied: ${stats.replied}`);
  lines.push(`   Interested: ${stats.interested} | Signed up: ${stats.signed_up}`);
  lines.push(`   Active: ${stats.active} | Total: ${stats.total}`);

  if (hotLeads.length > 0) {
    lines.push("");
    lines.push(`🔥 <b>Hot Leads (${hotLeads.length})</b>`);
    hotLeads.slice(0, 5).forEach(l => {
      lines.push(`   • ${l.name} (${l.platform}, score ${l.score})`);
    });
    if (hotLeads.length > 5) lines.push(`   ... +${hotLeads.length - 5} more`);
  }

  if (needFollowUp.length > 0) {
    lines.push("");
    lines.push(`⏰ <b>Need Follow-up (${needFollowUp.length})</b>`);
    needFollowUp.slice(0, 5).forEach(l => {
      const days = Math.floor((Date.now() - new Date(l.contacted_at).getTime()) / (1000 * 60 * 60 * 24));
      lines.push(`   • ${l.name} — ${days} days ago`);
    });
  }

  if (pendingFilms > 0 || (userCount && userCount > 0)) {
    lines.push("");
    lines.push("🎬 <b>Platform</b>");
    if (pendingFilms > 0) lines.push(`   ⚠️ ${pendingFilms} films waiting for approval`);
    lines.push(`   👥 ${userCount || 0} total users`);
  }

  lines.push("");
  lines.push("→ <a href=\"https://www.spikeai.studio/admin/pipeline\">Open Pipeline</a>");
  lines.push("→ <a href=\"https://www.spikeai.studio/admin/dashboard\">Open Dashboard</a>");

  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  // Cron-only endpoint. Manual trigger via ?manual=true was removed for security.
  // To run this manually, use the Telegram bot or OpenClaw.
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await buildReport();
    const sent = await sendTelegram(report);

    return NextResponse.json({
      success: true,
      sent,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
