-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Outreach Sequencer Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Sequence tracking on creator_leads
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS sequence_step INTEGER DEFAULT 0;
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS sequence_started_at TIMESTAMPTZ;
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS next_sequence_at TIMESTAMPTZ;
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS sequence_paused BOOLEAN DEFAULT false;

-- YouTube auto-comment tracking
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS youtube_commented BOOLEAN DEFAULT false;
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS youtube_comment_id TEXT;

-- Engagement metrics (filled by enhanced scout)
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS engagement_ratio NUMERIC(5,2);
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS upload_frequency TEXT;
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS channel_age_days INTEGER;
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS subscriber_count INTEGER;
ALTER TABLE creator_leads ADD COLUMN IF NOT EXISTS view_count INTEGER;

-- Index for sequencer queries
CREATE INDEX IF NOT EXISTS idx_leads_sequence ON creator_leads (sequence_step, next_sequence_at)
  WHERE sequence_paused = false AND sequence_step > 0;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════
-- New columns: sequence_step, sequence_started_at, next_sequence_at,
--   sequence_paused, youtube_commented, youtube_comment_id,
--   engagement_ratio, upload_frequency, channel_age_days,
--   subscriber_count, view_count
-- New index: idx_leads_sequence
-- ═══════════════════════════════════════════════════════════════
