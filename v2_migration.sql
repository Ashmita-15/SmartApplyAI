-- =============================================
-- SmartApply AI — v2.0 Schema Migration
-- Run this in Supabase SQL Editor AFTER the base schema
-- =============================================

-- =============================================
-- ENHANCED JOBS TABLE
-- =============================================
ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS detected_questions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS deadline timestamptz,
  ADD COLUMN IF NOT EXISTS salary_range text,
  ADD COLUMN IF NOT EXISTS source_url text;

-- =============================================
-- ENHANCED PROFILES TABLE
-- =============================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS experience_structured jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS education_structured jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS projects jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cover_letter_tone text DEFAULT 'professional'
    CHECK (cover_letter_tone IN ('professional', 'conversational', 'enthusiastic')),
  ADD COLUMN IF NOT EXISTS target_roles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS total_experience_months int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resume_text text;

-- =============================================
-- ENHANCED MATCH RESULTS
-- =============================================
ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS requirement_map jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS score_breakdown jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS improvement_suggestions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS selection_probability_label text,
  ADD COLUMN IF NOT EXISTS strategic_advice text;

-- =============================================
-- ENHANCED APPLICATIONS TABLE
-- =============================================
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS submitted_data jsonb DEFAULT '{}';

-- =============================================
-- AUTOFILL HISTORY TABLE (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS autofill_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  job_id uuid REFERENCES jobs ON DELETE SET NULL,
  payload jsonb NOT NULL,
  quality_report jsonb DEFAULT '{}',
  platform_notes jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE autofill_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their autofill history"
  ON autofill_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage autofill history"
  ON autofill_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
