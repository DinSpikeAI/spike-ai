# Spike AI – Agent System Guide
## Complete Documentation (April 14, 2026)

---

## Overview

Spike AI runs 13 autonomous agents that handle creator recruitment, content marketing, SEO, and platform maintenance. All agents run on Vercel Cron Jobs + Supabase, with Claude AI (Anthropic) powering the intelligent ones.

**Total monthly cost:** ~$1-3 (Anthropic API only)
**Your daily time:** 15-20 minutes
**Everything else:** Fully automatic, 24/7

---

## Daily Schedule (UTC)

| Time | Agent | What It Does |
|------|-------|-------------|
| 7:00 | YouTube Scout | Scans YouTube for AI filmmakers |
| 7:05 | Telegram Report | Sends pipeline summary to Telegram |
| 7:10 | Follow-up + Onboarding | Alerts for leads needing follow-up + new creators without films |
| 7:15 | Reddit Scout | Scans Reddit for AI filmmakers |
| 7:20 | DM Drafter (AI) | Claude writes personalized DM drafts |
| 7:30 | Auto Enrich (AI) | Claude fills missing film metadata |
| 7:35 | Auto Cleanup | Cleans stale pipeline leads + detects new creators |
| 9:00 | Tweet Draft (AI) | Claude writes tweet 1 |
| 14:00 | Tweet Draft (AI) | Claude writes tweet 2 |
| 19:00 | Tweet Draft (AI) | Claude writes tweet 3 |

## Weekly Schedule

| Day | Time | Agent | What It Does |
|-----|------|-------|-------------|
| Monday | 6:00 | SEO Report | Weekly SEO audit of all films |
| Wednesday | 8:00 | Creator Spotlight | Creator of the Week + blog draft |
| Sunday | 8:00 | Blog Writer (AI) | Claude writes a full blog post |

---

## Agent Details

### Agent 1 – YouTube Scout + Auto Scorer

**What it does:** Searches YouTube for AI short films using 15 rotating queries (picks 3 random ones per day). For each video found, it extracts the creator name, view count, subscriber count, AI tools used, and genre. Calculates a score 1-10 based on views, subscribers, recency, and relevance. Inserts into the pipeline database automatically. Skips duplicates and low-score leads.

**Manual test:** https://www.spikeai.studio/api/scout?manual=true

**What you see:** JSON response showing how many found, added, skipped.

**What to do:** Nothing. Leads appear in your Pipeline dashboard automatically.

---

### Agent 2 – Telegram Report

**What it does:** Sends a daily summary to your Telegram with: total leads per status (new, contacted, replied, interested, signed up, active), hot leads count, pending films waiting for approval, total users.

**Manual test:** https://www.spikeai.studio/api/report?manual=true

**What you see:** Telegram message with full pipeline stats and links to Pipeline + Dashboard.

**What to do:** Read the report. Click links if action needed.

---

### Agent 3 – Follow-up Reminder + Onboarding Checker

**What it does:** Two checks in one. (1) Finds leads you contacted 3+ days ago that haven't replied – sends you their names, scores, and how many days passed. (2) Finds creators who signed up but haven't uploaded a film – splits them into new (0-3 days), waiting (3-14 days), dormant (14+ days).

**Manual test:** https://www.spikeai.studio/api/check?manual=true

**What you see:** Telegram message with action items.

**What to do:** Follow up with leads that need it. Reach out to creators who haven't uploaded.

---

### Agent 4 – Reddit Scout

**What it does:** Scans 8 subreddits (r/aivideo, r/StableDiffusion, r/runwayml, etc.) and searches for AI film posts. Scores creators by upvotes, comments, recency, and AI tools detected. Adds to pipeline.

**Manual test:** https://www.spikeai.studio/api/reddit-scout?manual=true

**Note:** Reddit sometimes blocks requests from cloud servers. The agent tries daily – some days it finds leads, some days it doesn't. YouTube Scout is the primary source.

**What to do:** Nothing. Leads appear in Pipeline if found.

---

### Agent 5 – DM Drafter (AI-Powered)

**What it does:** Takes the top 5 hot leads (score 7+, status "new") from the pipeline. For each one, Claude reads their brief (film title, AI tools, genre, view count) and writes a personalized DM as Dean, Founder of Spike AI. Also writes a YouTube comment to post under their video before sending the DM (to warm up the relationship).

**Manual test:** https://www.spikeai.studio/api/draft?manual=true

**What you see:** Separate Telegram messages for each lead with: the DM draft, the YouTube comment draft, and tips.

**What to do:**
1. Post the YouTube comment under their video FIRST
2. Wait a day
3. Copy the DM and send it to the creator
4. Go to Pipeline, find the lead, change status to "contacted"
5. Edit anything that doesn't sound like you

---

### Agent 6 – Tweet Writer (AI-Powered)

**What it does:** Picks a random film from the top 10 on the platform. Claude writes a creative tweet in one of 6 rotating styles: hype, artistic, casual, creator celebration, audience question, or AI progress comparison. Each tweet is different and under 280 characters.

**Manual test:** https://www.spikeai.studio/api/tweet?manual=true

**What you see:** Telegram message with the tweet text, character count, film name, and style used.

**What to do:** Copy the tweet text from Telegram, paste in Twitter, add a screenshot/thumbnail if you want, and post. Takes 10 seconds.

---

### Agent 7 – Auto Film Enrichment (AI-Powered)

**What it does:** Finds approved films with missing metadata (no tagline, short description, no genre). Claude generates the missing fields based on the film title and existing info. Updates the database automatically. Processes up to 5 films per run.

**Manual test:** https://www.spikeai.studio/api/auto-enrich?manual=true

**What you see:** Telegram message listing which films were updated and what was added.

**What to do:** Nothing. Films are enriched automatically. You can review changes in the Dashboard if you want.

**Important:** This agent only enriches APPROVED films. It never approves or publishes films.

---

### Agent 8 – Auto Cleanup

**What it does:** Three automatic tasks: (1) Marks leads as "no_response" if you followed up 7+ days ago with no reply, or contacted 10+ days ago with no follow-up. (2) Detects new creators who joined in the last 24 hours and sends you a notification. (3) Detects new pending film submissions and alerts you.

**Manual test:** https://www.spikeai.studio/api/auto-cleanup?manual=true

**What you see:** Telegram message with cleanup actions and pipeline stats.

**What to do:** Nothing for cleanup. For new creators/films, go to Dashboard to review.

---

### Agent 9 – SEO Report

**What it does:** Weekly audit of all approved films. Calculates an SEO Score (0-100) based on: how many films have good descriptions, custom posters, AI tools tagged, genres set, and taglines. Lists specific films that need fixing. Suggests blog topics based on platform data.

**Manual test:** https://www.spikeai.studio/api/seo?manual=true

**What you see:** Telegram message with SEO score, films needing fixes, and blog topic ideas.

**What to do:** Fix the films listed in the report via Dashboard. Consider writing the suggested blog topics.

---

### Agent 10 – Blog Auto-Writer (AI-Powered)

**What it does:** Every Sunday, Claude writes a complete blog post based on real platform data. Rotates between 5 topic types: weekly roundup, tool comparison, creator spotlight, industry trends, how-to guide. Saves to the blog_drafts table in Supabase.

**Manual test:** https://www.spikeai.studio/api/auto-blog?manual=true

**What you see:** Telegram notification with the article title and type.

**What to do:** Nothing – the article is auto-saved. In the future, the blog page will display these automatically.

---

### Agent 11 – Creator Spotlight

**What it does:** Every Wednesday, picks the creator with the most upvotes/films on the platform. Builds a tweet draft and a blog-ready spotlight text. Sends both to Telegram.

**Manual test:** https://www.spikeai.studio/api/spotlight?manual=true

**What you see:** Telegram message with tweet draft + blog draft for Creator of the Week.

**What to do:** Copy the tweet and post on Twitter. Use the blog draft for a website post if you want.

---

## Pipeline Dashboard

**URL:** https://www.spikeai.studio/admin/pipeline

**What it is:** Your CRM for creator recruitment. Only you (admin) can see it.

**How to use:**
- **Add Lead** button – manually add a creator you found
- **Click on a lead** – opens detail panel with score, status, outreach history
- **Change score** – click the number buttons (1-10)
- **Change status** – use the dropdown (new → contacted → replied → interested → signed_up → active)
- **Log outreach** – paste the DM you sent, click "Log Sent"
- **Log reply** – paste their response, click "Log Reply +" (positive) or "Reply -" (declined)
- **Filter** – by status, platform, or search by name
- **Sort** – by score, date, or status

---

## Your Daily Routine (15-20 minutes)

**Morning (after 7:30 AM UTC):**
1. Open Telegram – read Report, Follow-up alerts, DM drafts
2. Open Pipeline – review new leads, send DMs (copy from Telegram)
3. Open Dashboard – approve pending films, review new creators

**Throughout the day:**
4. Check Telegram at 9:00, 14:00, 19:00 – copy and post tweet drafts
5. If a creator replies to your DM – update their status in Pipeline

**Wednesday:** Post the Creator Spotlight tweet
**Monday:** Review SEO report, fix any films mentioned

---

## Environment Variables (Vercel)

| Variable | Source | Used By |
|----------|--------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase Dashboard | All agents |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Dashboard | All agents |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Dashboard → Settings → API | All agents |
| YOUTUBE_API_KEY | Google Cloud Console | YouTube Scout |
| TELEGRAM_BOT_TOKEN | Telegram @BotFather | All Telegram notifications |
| TELEGRAM_CHAT_ID | 360400574 | All Telegram notifications |
| CRON_SECRET | Your custom secret | Cron authentication |
| ANTHROPIC_API_KEY | console.anthropic.com | DM Drafter, Tweet Writer, Auto Enrich, Blog Writer |
| TWITTER_API_KEY | developer.x.com | (Ready for future use) |
| TWITTER_API_SECRET | developer.x.com | (Ready for future use) |
| TWITTER_ACCESS_TOKEN | developer.x.com | (Ready for future use) |
| TWITTER_ACCESS_SECRET | developer.x.com | (Ready for future use) |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| creator_leads | Pipeline – all potential creators |
| outreach_log | Every DM/message sent to creators |
| blog_drafts | Auto-generated blog posts |
| movies | Films on the platform |
| profiles | User accounts |
| user_votes | Upvotes |
| watchlist | User watchlists |
| notifications | Admin notifications |
| pioneer_creators | Featured creators on Creators page |

---

## Costs

| Service | Monthly Cost |
|---------|-------------|
| Vercel (hosting + crons) | Free |
| Supabase (database + auth) | Free |
| YouTube Data API | Free (10,000 requests/day) |
| Reddit API | Free |
| Telegram Bot API | Free |
| Anthropic API (Claude) | ~$1-3 |
| **Total** | **~$1-3/month** |

---

## Troubleshooting

**Agent returns "Missing environment variables":**
The env vars aren't loaded. Go to Vercel → Project → Settings → Environment Variables, verify they exist, then do a redeploy: `git commit --allow-empty -m "redeploy" && git push`

**Agent returns "Unauthorized":**
You're testing without `?manual=true` in the URL. Add it.

**Telegram not receiving messages:**
Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel env vars. Make sure you sent /start to the bot.

**YouTube Scout finds 0:**
YouTube API quota might be exhausted (resets daily) or the API key is wrong. Check Google Cloud Console.

**Claude returns empty/error:**
Check ANTHROPIC_API_KEY in Vercel. Check credit balance at console.anthropic.com.
