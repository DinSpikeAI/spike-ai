import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT — Auto Pipeline Cleanup + Welcome Notifications
   
   Runs daily at 7:35 AM UTC.
   
   1. Marks leads as "no_response" after 2 contact attempts + 7 days
   2. Detects new creators and sends welcome info via Telegram
   3. Cleans stale data
   
   Manual: GET /api/auto-cleanup?manual=true
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
    const actions: string[] = [];

    // ─── 1. Auto mark no_response ───
    // Leads that were followed up 7+ days ago with no reply
    const { data: staleLeads } = await supabase
      .from("creator_leads")
      .select("id, name, contacted_at, status")
      .eq("status", "followed_up");

    let markedNoResponse = 0;
    if (staleLeads) {
      for (const lead of staleLeads) {
        if (!lead.contacted_at) continue;
        const days = (Date.now() - new Date(lead.contacted_at).getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 7) {
          await supabase.from("creator_leads").update({ status: "no_response" }).eq("id", lead.id);
          markedNoResponse++;
        }
      }
    }
    if (markedNoResponse > 0) {
      actions.push("🗑 Marked " + markedNoResponse + " leads as no_response (followed up 7+ days, no reply)");
    }

    // Also mark "contacted" leads after 10 days with no follow-up sent
    const { data: oldContacted } = await supabase
      .from("creator_leads")
      .select("id, name, contacted_at, status")
      .eq("status", "contacted");

    let markedStale = 0;
    if (oldContacted) {
      for (const lead of oldContacted) {
        if (!lead.contacted_at) continue;
        const days = (Date.now() - new Date(lead.contacted_at).getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 10) {
          await supabase.from("creator_leads").update({ status: "no_response" }).eq("id", lead.id);
          markedStale++;
        }
      }
    }
    if (markedStale > 0) {
      actions.push("🗑 Marked " + markedStale + " old contacted leads as no_response (10+ days, no follow-up)");
    }

    // ─── 2. Detect new creators (signed up in last 24h) ───
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: newCreators } = await supabase
      .from("profiles")
      .select("id, display_name, email, created_at")
      .eq("user_type", "creator")
      .gte("created_at", yesterday);

    if (newCreators && newCreators.length > 0) {
      for (const creator of newCreators) {
        actions.push("🆕 New creator: " + (creator.display_name || creator.email));
        
        // Send welcome notification to you
        await sendTelegram(
          "🎉 <b>New Creator Joined!</b>\n\n" +
          "Name: " + (creator.display_name || "Unknown") + "\n" +
          "Email: " + (creator.email || "N/A") + "\n\n" +
          "→ <a href=\"https://www.spikeai.studio/creator/" + creator.id + "\">View Profile</a>\n" +
          "→ <a href=\"https://www.spikeai.studio/admin/dashboard\">Dashboard</a>"
        );
      }
    }

    // ─── 3. Detect new film submissions (pending, last 24h) ───
    const { data: newFilms } = await supabase
      .from("movies")
      .select("id, title, creator_name, created_at")
      .eq("status", "pending")
      .gte("created_at", yesterday);

    if (newFilms && newFilms.length > 0) {
      for (const film of newFilms) {
        actions.push("🎬 Pending film: \"" + film.title + "\" by " + (film.creator_name || "Unknown"));
      }
    }

    // ─── 4. Pipeline stats cleanup summary ───
    const { data: allLeads } = await supabase.from("creator_leads").select("status");
    const statusCounts: Record<string, number> = {};
    (allLeads || []).forEach((l: any) => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    // Send summary if anything happened
    if (actions.length > 0) {
      const summary = [
        "🧹 <b>Auto Cleanup Report</b>",
        "",
        ...actions,
        "",
        "📊 Pipeline: " + Object.entries(statusCounts).map(([s, c]) => s + ": " + c).join(" | "),
      ];
      await sendTelegram(summary.join("\n"));
    }

    return NextResponse.json({
      success: true,
      markedNoResponse: markedNoResponse + markedStale,
      newCreators: newCreators?.length || 0,
      newFilms: newFilms?.length || 0,
      actions,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
