import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 9 — DM Drafter
   
   Runs daily at 7:20 AM UTC via Vercel Cron.
   Takes Hot Leads (score 7+, status "new") from pipeline,
   builds personalized DM drafts + YouTube comment drafts,
   sends them to Telegram ready to copy-paste.
   
   Manual: GET /api/draft?manual=true
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
      disable_web_page_preview: true,
    }),
  });
  return res.ok;
}

/* ─── DM Templates by Platform ─── */

function buildDM(lead: any): string {
  const name = lead.name || "there";
  const filmTitle = lead.work_title || "your latest AI film";
  const tools = (lead.ai_tools || []).join(", ");
  const genre = lead.genre || "";
  const platform = lead.platform || "youtube";

  // Extract interesting details from notes
  const notes = lead.notes || "";
  const viewsMatch = notes.match(/Views: ([\d,]+)/);
  const views = viewsMatch ? viewsMatch[1] : null;

  // Genre-specific compliments
  let genreHook = "";
  if (genre.toLowerCase().includes("horror")) genreHook = "The atmosphere you created is genuinely unsettling in the best way.";
  else if (genre.toLowerCase().includes("sci-fi")) genreHook = "The world-building in this is incredible.";
  else if (genre.toLowerCase().includes("anime")) genreHook = "The animation style is stunning.";
  else if (genre.toLowerCase().includes("fantasy")) genreHook = "The visual storytelling here is next level.";
  else if (genre.toLowerCase().includes("drama")) genreHook = "The emotional depth really comes through.";
  else if (genre.toLowerCase().includes("action")) genreHook = "The energy and pacing are fantastic.";
  else genreHook = "The quality of this work really stands out.";

  // Tool-specific compliment
  let toolHook = "";
  if (tools.includes("Runway")) toolHook = "Your use of Runway is some of the best I've seen.";
  else if (tools.includes("Kling")) toolHook = "You're pushing Kling to its limits here.";
  else if (tools.includes("Sora")) toolHook = "This is exactly the kind of Sora work that deserves a bigger audience.";
  else if (tools.includes("Seedance")) toolHook = "Seedance in the right hands looks incredible.";
  else if (tools.includes("Midjourney")) toolHook = "The Midjourney visuals are beautiful.";
  else if (tools) toolHook = "The way you're using " + tools.split(",")[0].trim() + " is impressive.";

  // Build DM based on platform
  if (platform === "reddit") {
    return [
      "Hey " + name + ",",
      "",
      'Just saw your post "' + filmTitle.slice(0, 60) + '" and had to reach out. ' + genreHook,
      "",
      "I'm building Spike AI, a free streaming platform dedicated to AI-generated cinema. We're curating the best AI films from creators like you.",
      "",
      "No catch, no fees. You keep full credit and we link to all your socials. Would love to feature your work.",
      "",
      "Check it out: spikeai.studio",
      "",
      "Dean",
      "Founder, Spike AI",
    ].join("\n");
  }

  // YouTube / default
  return [
    "Hey " + name + ",",
    "",
    'Just watched "' + filmTitle.slice(0, 60) + '" — ' + genreHook + (toolHook ? " " + toolHook : ""),
    "",
    "I'm building Spike AI, a free streaming platform for AI cinema. Think of it as the home for work like yours — a place where AI filmmakers get the audience they deserve.",
    "",
    "We already have creators using " + (tools || "various AI tools") + " and I think your work would be a perfect fit.",
    "",
    "Interested? It takes 2 minutes to upload: spikeai.studio/submit",
    "",
    "Dean",
    "Founder, Spike AI",
  ].join("\n");
}

/* ─── YouTube Comment Draft ─── */

function buildComment(lead: any): string {
  const genre = lead.genre || "";
  const tools = (lead.ai_tools || []).join(", ");

  let comment = "This is incredible work! ";

  if (genre.toLowerCase().includes("horror")) comment += "The atmosphere is genuinely chilling. ";
  else if (genre.toLowerCase().includes("sci-fi")) comment += "The world-building here is next level. ";
  else if (genre.toLowerCase().includes("anime")) comment += "The animation quality is stunning. ";
  else comment += "The production quality really stands out. ";

  if (tools) {
    comment += "Amazing what you're doing with " + tools.split(",")[0].trim() + ". ";
  }

  comment += "Would love to see more like this.";

  return comment;
}

/* ─── Main ─── */

async function run(supabase: any): Promise<{ drafts: number; leads: any[] }> {
  // Get hot leads that haven't been contacted yet
  const { data: leads } = await supabase
    .from("creator_leads")
    .select("*")
    .eq("status", "new")
    .gte("score", 7)
    .order("score", { ascending: false })
    .limit(5);

  if (!leads || leads.length === 0) {
    return { drafts: 0, leads: [] };
  }

  return { drafts: leads.length, leads };
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
    const { drafts, leads } = await run(supabase);

    if (drafts === 0) {
      await sendTelegram("✉️ <b>DM Drafts</b>\n\nNo hot leads (score 7+) waiting. Pipeline is clear!");
      return NextResponse.json({ success: true, drafts: 0, timestamp: new Date().toISOString() });
    }

    // Send each draft as separate Telegram message
    for (const lead of leads) {
      const dm = buildDM(lead);
      const comment = lead.platform === "youtube" ? buildComment(lead) : null;

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
      lines.push("  • Post the comment FIRST, then send the DM");
      lines.push("  • Edit the compliment to be specific to what you noticed");
      lines.push("  • Reference something unique about their film");
      if (lead.profile_url) lines.push("  • Profile: " + lead.profile_url);

      await sendTelegram(lines.filter(Boolean).join("\n"));
    }

    // Summary
    await sendTelegram(
      "📋 <b>DM Summary</b>\n\n" + drafts + " drafts sent for:\n" +
      leads.map((l: any) => "  • " + l.name + " (" + l.platform + ", score " + l.score + ")").join("\n") +
      "\n\nAfter sending, update their status in Pipeline → 'contacted'"
    );

    return NextResponse.json({
      success: true,
      drafts,
      names: leads.map((l: any) => l.name),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
