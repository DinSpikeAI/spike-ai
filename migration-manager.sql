-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Manager + Memory + KPI Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Creator Memory - remembers everything about each creator
CREATE TABLE IF NOT EXISTS creator_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID UNIQUE,
  name TEXT,
  platform TEXT,
  ai_tools TEXT[],
  genre TEXT,
  score INTEGER,
  interaction_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  interactions JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE creator_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage creator memory"
  ON creator_memory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Service role can always access (for agents)
CREATE POLICY "Service role access creator memory"
  ON creator_memory FOR ALL
  USING (auth.role() = 'service_role');

-- 2. Agent Metrics - daily KPI tracking
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, metric_name)
);

ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view metrics"
  ON agent_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role access metrics"
  ON agent_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- 3. Index for fast KPI queries
CREATE INDEX IF NOT EXISTS idx_metrics_date ON agent_metrics (date, metric_name);
CREATE INDEX IF NOT EXISTS idx_memory_lead ON creator_memory (lead_id);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════
-- New tables: creator_memory, agent_metrics
-- RLS: admin read, service_role full access
-- Indexes: idx_metrics_date, idx_memory_lead
-- ═══════════════════════════════════════════════════════════════
