-- =============================================
-- SmartApply AI — Database Schema Enhancements
-- Run this in Supabase SQL Editor to update your existing schema
-- =============================================

-- =============================================
-- 1. Enhanced JOBS Table
-- =============================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type text DEFAULT 'internship'
  CHECK (job_type IN ('internship', 'full-time', 'part-time', 'contract'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_scraped_at timestamptz DEFAULT now();

-- =============================================
-- 2. Enhanced APPLICATIONS Table
-- =============================================
ALTER TABLE applications ADD COLUMN IF NOT EXISTS selection_probability float;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS skill_overlap_count int DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS applied_via text DEFAULT 'manual'
  CHECK (applied_via IN ('manual', 'smart_apply'));

-- =============================================
-- 3. New MATCH_RESULTS Table (Optional - for caching)
-- =============================================
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  job_id uuid REFERENCES jobs ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes ON DELETE CASCADE,
  match_score float NOT NULL,
  semantic_score float,
  skill_score float,
  matching_skills text[] DEFAULT '{}',
  missing_skills text[] DEFAULT '{}',
  selection_probability float,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id, resume_id)
);

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own match results"
  ON match_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage match results"
  ON match_results FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
