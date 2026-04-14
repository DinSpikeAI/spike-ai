import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   AGENT 18 — Manager (סוכן מנהל)

   The brain. Runs AFTER all other morning agents finish.
   Collects everything that happened in the last 24 hours,
   sends it to Claude for a Hebrew plain-language summary,
   and delivers a single Telegram briefing with:
     - What happened (new leads, sequences, comments, errors)
     - What you need to do (action items, prioritized)
     - Platform health (KPIs, warnings)

   Output language: Hebrew (עברית)
   Runs daily at 8:00 AM UTC.
   Manual: GET /api/manager?manual=true
   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ─── Helpers ───

async function sendTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  // Telegram limit is 4096 chars, split if needed
  const chunks: string[] = [];
  if (text.length <= 4096) {
    chunks.push(text);
  } else {
    let remaining = text;
    while (remaining.length > 0) {
      const cut = remaining.lastIndexOf("\n", 4090);
      const splitAt = cut > 2000 ? cut : 4090;
      chunks.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt);
    }
  }

  for (const chunk of chunks) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: chunk,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  }
  return true;
}

async function askClaude(prompt: string, maxTokens: number = 1500): Promise<string> {
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
        max_tokens: maxTokens,
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

// ─── Data Collection ───

async function collectSystemData(supabase: any): Promise<any> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 3600000);
  const isoYesterday = yesterday.toISOString();

  // ── Pipeline Stats ──
  const { data: allLeads } = await supabase.from("creator_leads").select("*");
  const leads = allLeads || [];

  const pipeline = {
    total: leads.length,
    new: leads.filter((l: any) => l.status === "new").length,
    contacted: leads.filter((l: any) => ["contacted", "followed_up"].includes(l.status)).length,
    replied: leads.filter((l: any) => l.status === "replied").length,
    interested: leads.filter((l: any) => l.status === "interested").length,
    signed_up: leads.filter((l: any) => l.status === "signed_up").length,
    active: leads.filter((l: any) => l.status === "active").length,
    declined: leads.filter((l: any) => l.status === "declined").length,
    no_response: leads.filter((l: any) => l.status === "no_response").length,
  };

  // ── New Leads (last 24h) ──
  const newLeadsToday = leads.filter((l: any) =>
    l.found_at && new Date(l.found_at) >= yesterday
  );

  // ── Active Sequences ──
  const inSequence = leads.filter((l: any) =>
    l.sequence_step > 0 && l.sequence_step < 4 && !l.sequence_paused
  );
  const sequencesDone = leads.filter((l: any) => l.sequence_step >= 4);
  const sequencesPaused = leads.filter((l: any) => l.sequence_paused);

  // ── Hot Leads (score 8+, not yet contacted) ──
  const hotLeads = leads.filter((l: any) =>
    l.score >= 8 && l.status === "new"
  );

  // ── Outreach Log (last 24h) ──
  const { data: recentOutreach } = await supabase
    .from("outreach_log")
    .select("*")
    .gte("sent_at", isoYesterday)
    .order("sent_at", { ascending: false });

  const outreachLog = recentOutreach || [];

  // ── Comments Pending (drafted but need manual posting) ──
  const commentsDrafted = outreachLog.filter((o: any) =>
    o.type === "youtube_comment_draft" || o.type === "youtube_comment_auto"
  );

  const dmsDrafted = outreachLog.filter((o: any) =>
    o.type?.startsWith("sequence_step_")
  );

  // ── Platform Stats ──
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: totalFilms } = await supabase
    .from("movies")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: pendingFilms } = await supabase
    .from("movies")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // ── Creators without films ──
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .eq("user_type", "creator");

  const { data: movies } = await supabase
    .from("movies")
    .select("creator_id");

  const creatorIdsWithFilms = new Set((movies || []).map((m: any) => m.creator_id).filter(Boolean));
  const creatorsNoFilm = (creators || []).filter((c: any) => !creatorIdsWithFilms.has(c.id));

  // ── KPI calculations ──
  const replyRate = pipeline.total > 0
    ? Math.round(((pipeline.replied + pipeline.interested + pipeline.signed_up + pipeline.active) / pipeline.total) * 100)
    : 0;

  const conversionRate = pipeline.total > 0
    ? Math.round(((pipeline.signed_up + pipeline.active) / pipeline.total) * 100)
    : 0;

  // ── Creator Memory stats ──
  let memoryCount = 0;
  try {
    const { count } = await supabase
      .from("creator_memory")
      .select("*", { count: "exact", head: true });
    memoryCount = count || 0;
  } catch {}

  return {
    pipeline,
    newLeadsToday: newLeadsToday.map((l: any) => ({
      name: l.name,
      platform: l.platform,
      score: l.score,
    })),
    hotLeads: hotLeads.map((l: any) => ({
      name: l.name,
      score: l.score,
      platform: l.platform,
    })),
    inSequence: inSequence.length,
    sequencesDone: sequencesDone.length,
    sequencesPaused: sequencesPaused.length,
    commentsDrafted: commentsDrafted.length,
    dmsDrafted: dmsDrafted.length,
    outreachActions: outreachLog.length,
    totalUsers: totalUsers || 0,
    totalFilms: totalFilms || 0,
    pendingFilms: pendingFilms || 0,
    creatorsNoFilm: creatorsNoFilm.length,
    replyRate,
    conversionRate,
    memoryCount,
  };
}

// ─── Hebrew Briefing Generator ───

function buildManagerPrompt(data: any): string {
  return `You are the Manager Agent for Spike AI, a streaming platform for AI-generated cinema.
You receive a daily data dump from all agents. Your job: write a concise, clear HEBREW briefing for Dean (the founder). 

Rules:
- Write EVERYTHING in Hebrew (עברית)
- Use plain, casual Hebrew - like talking to a friend, not a corporate report
- Use Telegram HTML formatting: <b>bold</b> for headers
- Structure: (1) מה קרה (2) מה לעשות (3) מצב כללי
- Be specific: use names, numbers, platforms
- If there are action items, NUMBER them clearly
- If something is urgent, mark it with ⚡
- If everything is fine, say so briefly
- Keep it under 800 words
- Do NOT use markdown, only Telegram HTML (<b>, <i>, <code>)
- Do NOT use em-dash (—) or double-hyphen (--), use en-dash ( - ) with spaces

Here is today's data:

PIPELINE:
- Total leads: ${data.pipeline.total}
- New (not contacted): ${data.pipeline.new}
- Contacted/followed up: ${data.pipeline.contacted}
- Replied: ${data.pipeline.replied}
- Interested: ${data.pipeline.interested}
- Signed up: ${data.pipeline.signed_up}
- Active creators: ${data.pipeline.active}
- Declined: ${data.pipeline.declined}
- No response: ${data.pipeline.no_response}

NEW LEADS (last 24h): ${data.newLeadsToday.length > 0
    ? data.newLeadsToday.map((l: any) => `${l.name} (${l.platform}, score ${l.score})`).join(", ")
    : "none"}

HOT LEADS (score 8+, waiting): ${data.hotLeads.length > 0
    ? data.hotLeads.map((l: any) => `${l.name} (${l.platform}, score ${l.score})`).join(", ")
    : "none"}

OUTREACH SEQUENCES:
- Active sequences: ${data.inSequence}
- Completed sequences: ${data.sequencesDone}
- Paused: ${data.sequencesPaused}

ACTIONS IN LAST 24H:
- Total outreach actions: ${data.outreachActions}
- YouTube comments drafted: ${data.commentsDrafted}
- DMs drafted: ${data.dmsDrafted}

PLATFORM:
- Total users: ${data.totalUsers}
- Approved films: ${data.totalFilms}
- Pending films: ${data.pendingFilms}
- Creators without films: ${data.creatorsNoFilm}

KPIs:
- Reply rate: ${data.replyRate}%
- Conversion rate (lead → signup): ${data.conversionRate}%
- Creator memory entries: ${data.memoryCount}

Write the Hebrew briefing now.`;
}

// ─── Save Daily KPIs ───

async function saveKPIs(supabase: any, data: any): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const metrics = [
    { date: today, metric_name: "leads_total", metric_value: data.pipeline.total },
    { date: today, metric_name: "leads_new_today", metric_value: data.newLeadsToday.length },
    { date: today, metric_name: "leads_replied", metric_value: data.pipeline.replied },
    { date: today, metric_name: "leads_signed_up", metric_value: data.pipeline.signed_up },
    { date: today, metric_name: "leads_active", metric_value: data.pipeline.active },
    { date: today, metric_name: "reply_rate", metric_value: data.replyRate },
    { date: today, metric_name: "conversion_rate", metric_value: data.conversionRate },
    { date: today, metric_name: "total_users", metric_value: data.totalUsers },
    { date: today, metric_name: "total_films", metric_value: data.totalFilms },
    { date: today, metric_name: "outreach_actions", metric_value: data.outreachActions },
    { date: today, metric_name: "sequences_active", metric_value: data.inSequence },
  ];

  for (const m of metrics) {
    await supabase.from("agent_metrics").upsert(m, {
      onConflict: "date,metric_name",
    }).catch(() => {});
  }
}

// ─── Update Creator Memory ───

async function updateCreatorMemory(supabase: any): Promise<number> {
  // Find outreach logs from the last 24h that don't have memory entries yet
  const yesterday = new Date(Date.now() - 24 * 3600000).toISOString();

  const { data: recentLogs } = await supabase
    .from("outreach_log")
    .select("lead_id, type, content, sent_at")
    .gte("sent_at", yesterday);

  if (!recentLogs || recentLogs.length === 0) return 0;

  // Group by lead_id
  const byLead = new Map<string, any[]>();
  for (const log of recentLogs) {
    if (!log.lead_id) continue;
    if (!byLead.has(log.lead_id)) byLead.set(log.lead_id, []);
    byLead.get(log.lead_id)!.push(log);
  }

  let updated = 0;

  for (const [leadId, logs] of byLead) {
    // Get lead info
    const { data: lead } = await supabase
      .from("creator_leads")
      .select("name, platform, ai_tools, genre, score, notes")
      .eq("id", leadId)
      .single();

    if (!lead) continue;

    // Build interaction summary
    const interactions = logs.map((l: any) => ({
      type: l.type,
      date: l.sent_at,
      snippet: (l.content || "").slice(0, 100),
    }));

    // Upsert into creator_memory
    const { error } = await supabase.from("creator_memory").upsert({
      lead_id: leadId,
      name: lead.name,
      platform: lead.platform,
      ai_tools: lead.ai_tools || [],
      genre: lead.genre,
      score: lead.score,
      interaction_count: logs.length,
      last_interaction_at: logs[0].sent_at,
      interactions: interactions,
      notes: lead.notes,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "lead_id",
    });

    if (!error) updated++;
  }

  return updated;
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

    // 1. Update Creator Memory from recent interactions
    const memoryUpdated = await updateCreatorMemory(supabase);

    // 2. Collect all system data
    const data = await collectSystemData(supabase);

    // 3. Save KPIs to DB
    await saveKPIs(supabase, data);

    // 4. Generate Hebrew briefing via Claude
    const prompt = buildManagerPrompt(data);
    const briefing = await askClaude(prompt, 1500);

    // 5. Send to Telegram
    const header = "🧠 <b>סוכן מנהל - סיכום יומי</b>\n\n";
    await sendTelegram(header + briefing);

    return NextResponse.json({
      success: true,
      memoryUpdated,
      kpisSaved: true,
      briefingLength: briefing.length,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
