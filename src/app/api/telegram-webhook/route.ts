import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════════
   TELEGRAM WEBHOOK — Interactive Bot

   Lets Dean chat with the bot in Hebrew. The bot understands
   natural language and responds with real data from Supabase.

   All existing cron agents continue working as before.
   This is purely additive - a conversation layer on top.

   Security: only responds to TELEGRAM_CHAT_ID (Dean).

   Setup (one time):
   Open this URL in browser to register the webhook:
   https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url=https://www.spikeai.studio/api/telegram-webhook

   ═══════════════════════════════════════════════════════════════ */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ─── Telegram Helpers ───

async function sendReply(chatId: string | number, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;

  // Split long messages (Telegram limit: 4096 chars)
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
        chat_id: chatId,
        text: chunk,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  }
  return true;
}

// ─── Claude ───

async function askClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) return "Claude is not available.";
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
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return "Error connecting to Claude.";
    const data = await res.json();
    return data.content?.[0]?.text || "No response.";
  } catch {
    return "Error connecting to Claude.";
  }
}

// ─── Data Fetchers ───

async function getPipelineData(supabase: any): Promise<string> {
  const { data: leads } = await supabase.from("creator_leads").select("*");
  const all = leads || [];

  const stats = {
    total: all.length,
    new: all.filter((l: any) => l.status === "new").length,
    contacted: all.filter((l: any) => ["contacted", "followed_up"].includes(l.status)).length,
    replied: all.filter((l: any) => l.status === "replied").length,
    interested: all.filter((l: any) => l.status === "interested").length,
    signed_up: all.filter((l: any) => l.status === "signed_up").length,
    active: all.filter((l: any) => l.status === "active").length,
  };

  const hot = all.filter((l: any) => l.score >= 8 && l.status === "new");
  const inSequence = all.filter((l: any) => l.sequence_step > 0 && l.sequence_step < 4 && !l.sequence_paused);

  return `Pipeline: ${stats.total} total leads. New: ${stats.new}, Contacted: ${stats.contacted}, Replied: ${stats.replied}, Interested: ${stats.interested}, Signed up: ${stats.signed_up}, Active: ${stats.active}. Hot leads (8+): ${hot.length}. In outreach sequence: ${inSequence.length}. Hot lead names: ${hot.map((l: any) => l.name + " (" + l.score + ")").join(", ") || "none"}.`;
}

async function getPlatformData(supabase: any): Promise<string> {
  const { count: users } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { count: films } = await supabase.from("movies").select("*", { count: "exact", head: true }).eq("status", "approved");
  const { count: pending } = await supabase.from("movies").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { data: creators } = await supabase.from("profiles").select("id").eq("user_type", "creator");

  return `Platform: ${users || 0} users, ${films || 0} approved films, ${pending || 0} pending films, ${(creators || []).length} creators.`;
}

async function getRecentActivity(supabase: any): Promise<string> {
  const yesterday = new Date(Date.now() - 24 * 3600000).toISOString();

  const { data: recentLeads } = await supabase
    .from("creator_leads")
    .select("name, platform, score")
    .gte("found_at", yesterday)
    .order("score", { ascending: false })
    .limit(10);

  const { data: recentOutreach } = await supabase
    .from("outreach_log")
    .select("type, lead_id, sent_at")
    .gte("sent_at", yesterday);

  const newLeads = recentLeads || [];
  const outreach = recentOutreach || [];

  return `Last 24h: ${newLeads.length} new leads found (top: ${newLeads.slice(0, 5).map((l: any) => l.name + " score " + l.score).join(", ") || "none"}). ${outreach.length} outreach actions taken.`;
}

async function getLeadDetails(supabase: any, searchName: string): Promise<string> {
  const { data: leads } = await supabase
    .from("creator_leads")
    .select("*")
    .ilike("name", `%${searchName}%`)
    .limit(5);

  if (!leads || leads.length === 0) return `No leads found matching "${searchName}".`;

  return leads.map((l: any) =>
    `Lead: ${l.name} | Platform: ${l.platform} | Score: ${l.score}/10 | Status: ${l.status} | Sequence step: ${l.sequence_step || 0}/4 | URL: ${l.profile_url || "none"} | Film: ${l.work_title || "unknown"} | Tools: ${(l.ai_tools || []).join(", ") || "unknown"}`
  ).join("\n");
}

async function getKPIs(supabase: any): Promise<string> {
  const { data: metrics } = await supabase
    .from("agent_metrics")
    .select("*")
    .order("date", { ascending: false })
    .limit(20);

  if (!metrics || metrics.length === 0) return "No KPI data yet.";

  // Group by date
  const byDate = new Map<string, any[]>();
  for (const m of metrics) {
    if (!byDate.has(m.date)) byDate.set(m.date, []);
    byDate.get(m.date)!.push(m);
  }

  const lines: string[] = [];
  for (const [date, items] of byDate) {
    const parts = items.map((i: any) => `${i.metric_name}: ${i.metric_value}`).join(", ");
    lines.push(`${date}: ${parts}`);
  }

  return `KPI History:\n${lines.join("\n")}`;
}

// ─── Trigger Agents ───

async function triggerAgent(agentPath: string): Promise<string> {
  try {
    const res = await fetch(`https://www.spikeai.studio${agentPath}?manual=true`, {
      method: "GET",
    });
    const data = await res.json();
    return JSON.stringify(data);
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
}

// ─── Main Message Handler ───

async function handleMessage(supabase: any, userMessage: string): Promise<string> {
  // Gather context data
  const pipeline = await getPipelineData(supabase);
  const platform = await getPlatformData(supabase);
  const activity = await getRecentActivity(supabase);

  // Check if user is asking about a specific lead
  let leadInfo = "";
  const nameMatch = userMessage.match(/(?:על|about|info|מידע|פרטים)\s+(.+)/i);
  if (nameMatch) {
    leadInfo = await getLeadDetails(supabase, nameMatch[1].trim());
  }

  // Check if user wants KPIs
  let kpiInfo = "";
  if (/kpi|מדד|סטטיסטיק|נתונים|ביצועים|מספרים/i.test(userMessage)) {
    kpiInfo = await getKPIs(supabase);
  }

  // Check if user wants to trigger an agent
  let agentResult = "";
  if (/הרץ סקאוט|run scout|סקאוט/i.test(userMessage)) {
    agentResult = "Triggering YouTube Scout...\n" + await triggerAgent("/api/scout");
  } else if (/הרץ מנהל|run manager|סיכום|דוח/i.test(userMessage)) {
    agentResult = "Triggering Manager...\n" + await triggerAgent("/api/manager");
  } else if (/הרץ טוויטר|x scout|twitter/i.test(userMessage)) {
    agentResult = "Triggering X Scout...\n" + await triggerAgent("/api/x-scout");
  }

  const prompt = `You are the Spike AI assistant bot. Dean (the founder) is chatting with you on Telegram.

CRITICAL RULES:
- ALWAYS respond in Hebrew (עברית)
- Be casual and friendly, like a colleague
- Use Telegram HTML formatting: <b>bold</b>
- Keep responses concise (under 400 words)
- Do NOT use em-dash or double-hyphen, use en-dash with spaces
- If Dean asks to do something you can't do, say so honestly
- Give specific names, numbers, and actionable advice
- Do NOT make up data - only use what's provided below

CURRENT SYSTEM DATA:
${pipeline}
${platform}
${activity}
${leadInfo ? "\nSPECIFIC LEAD INFO:\n" + leadInfo : ""}
${kpiInfo ? "\nKPI DATA:\n" + kpiInfo : ""}
${agentResult ? "\nAGENT RESULT:\n" + agentResult : ""}

Dean's message: "${userMessage}"

Respond in Hebrew:`;

  return await askClaude(prompt);
}

// ─── Webhook Endpoint ───

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body?.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat?.id);
    const text = message.text.trim();

    // Security: only respond to Dean
    if (chatId !== TELEGRAM_CHAT_ID) {
      return NextResponse.json({ ok: true });
    }

    // Ignore bot commands that start with /start
    if (text === "/start") {
      await sendReply(chatId, "היי דין! 👋\n\nאני הבוט של Spike AI. תשאל אותי מה שתרצה בעברית ואני אענה.\n\nלמשל: מה המצב? / כמה לידים יש? / ספר לי על Aivoxy / הרץ סקאוט");
      return NextResponse.json({ ok: true });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      await sendReply(chatId, "שגיאה: חסרים env vars.");
      return NextResponse.json({ ok: true });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const response = await handleMessage(supabase, text);
    await sendReply(chatId, response);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

// Also support GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: "Telegram webhook active" });
}
