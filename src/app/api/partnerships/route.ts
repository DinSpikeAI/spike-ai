import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT — Partnership Tracker
   
   Runs daily at 7:40 AM UTC.
   Checks partnership leads for follow-ups needed.
   Sends alerts to Telegram.
   
   Manual: GET /api/partnerships?manual=true
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
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  return res.ok;
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

    const { data: leads } = await supabase
      .from("partnership_leads")
      .select("*")
      .order("created_at", { ascending: true });

    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, actions: 0 });
    }

    const lines: string[] = [];
    lines.push("🤝 <b>Partnership Tracker</b>");
    lines.push("");

    // Group by status
    const needsAction: any[] = [];
    const waiting: any[] = [];
    const active: any[] = [];

    for (const lead of leads) {
      // Check if follow-up is overdue
      if (lead.next_followup && new Date(lead.next_followup) <= new Date()) {
        needsAction.push(lead);
        continue;
      }

      // Check email_sent or followed_up without reply for 5+ days
      if (["email_sent", "followed_up"].includes(lead.status) && lead.last_email_date) {
        const days = (Date.now() - new Date(lead.last_email_date).getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 5) {
          needsAction.push(lead);
          continue;
        }
      }

      // "replied" or "in_talks" - active conversations
      if (["replied", "in_talks"].includes(lead.status)) {
        active.push(lead);
        continue;
      }

      // "new" or "researching" - not started yet
      if (["new", "researching"].includes(lead.status)) {
        waiting.push(lead);
      }
    }

    // Urgent - needs follow-up
    if (needsAction.length > 0) {
      lines.push("🔴 <b>Needs Follow-up NOW:</b>");
      lines.push("");
      for (const l of needsAction) {
        const days = l.last_email_date 
          ? Math.floor((Date.now() - new Date(l.last_email_date).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        lines.push("  <b>" + l.company_name + "</b>");
        if (l.contact_name) lines.push("  Contact: " + l.contact_name + (l.contact_role ? " (" + l.contact_role + ")" : ""));
        if (days) lines.push("  Last email: " + days + " days ago");
        if (l.notes) lines.push("  Notes: " + l.notes.slice(0, 100));
        lines.push("  Status: " + l.status);
        lines.push("");
      }
    }

    // Active conversations
    if (active.length > 0) {
      lines.push("🟢 <b>Active Conversations:</b>");
      lines.push("");
      for (const l of active) {
        lines.push("  <b>" + l.company_name + "</b> — " + l.status);
        if (l.contact_name) lines.push("  Contact: " + l.contact_name);
        if (l.reply_summary) lines.push("  Last reply: " + l.reply_summary.slice(0, 100));
        if (l.notes) lines.push("  Notes: " + l.notes.slice(0, 100));
        lines.push("");
      }
    }

    // Not started
    if (waiting.length > 0) {
      lines.push("⚪ <b>Not Yet Contacted (" + waiting.length + "):</b>");
      lines.push("");
      for (const l of waiting) {
        lines.push("  • " + l.company_name + (l.contact_name ? " — " + l.contact_name : ""));
      }
      lines.push("");
    }

    // Summary
    const totalActive = leads.filter((l: any) => l.status === "partnership_active").length;
    const totalDeclined = leads.filter((l: any) => l.status === "declined").length;
    lines.push("📊 Total: " + leads.length + " companies | Active: " + totalActive + " | Declined: " + totalDeclined);
    lines.push("");
    lines.push("→ <a href=\"https://www.spikeai.studio/admin/partnerships\">Manage Partnerships</a>");

    const message = lines.join("\n");
    await sendTelegram(message);

    return NextResponse.json({
      success: true,
      total: leads.length,
      needsAction: needsAction.length,
      active: active.length,
      waiting: waiting.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
