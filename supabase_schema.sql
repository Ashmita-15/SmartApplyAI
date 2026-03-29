-- =============================================
-- SmartApply AI — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- RESUMES TABLE
-- =============================================
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  filename text not null,
  file_url text,
  skills text[] default '{}',
  raw_text text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table resumes enable row level security;

create policy "Users can manage their own resumes"
  on resumes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow service role (backend) to insert
create policy "Service role can insert resumes"
  on resumes for insert
  to service_role
  with check (true);

create policy "Service role can read resumes"
  on resumes for select
  to service_role
  using (true);

-- =============================================
-- JOBS TABLE
-- =============================================
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  location text default 'Remote',
  description text default '',
  skills text[] default '{}',
  stipend text,
  duration text,
  job_type text default 'internship' check (job_type in ('internship', 'full-time', 'part-time', 'contract')),
  apply_link text unique,
  platform text default 'internshala',
  is_active boolean default true,
  last_scraped_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Jobs are public (readable by all authenticated users)
alter table jobs enable row level security;

create policy "Anyone can read jobs"
  on jobs for select
  to authenticated, anon
  using (true);

create policy "Service role can manage jobs"
  on jobs for all
  to service_role
  using (true)
  with check (true);

-- =============================================
-- APPLICATIONS TABLE
-- =============================================
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  job_id uuid references jobs on delete set null,
  resume_id uuid references resumes on delete set null,
  status text default 'applied' check (
    status in ('applied', 'pending', 'interview', 'offered', 'rejected', 'manual_required', 'applying')
  ),
  match_score float,
  selection_probability float,
  skill_overlap_count int default 0,
  applied_via text default 'manual' check (applied_via in ('manual', 'smart_apply')),
  applied_at timestamptz default now()
);

alter table applications enable row level security;

create policy "Users can manage their own applications"
  on applications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role can manage applications"
  on applications for all
  to service_role
  using (true)
  with check (true);

-- =============================================
-- REALTIME
alter publication supabase_realtime add table applications;

-- =============================================
-- MATCH_RESULTS TABLE (Optional - for caching)
-- =============================================
create table if not exists match_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  job_id uuid references jobs on delete cascade,
  resume_id uuid references resumes on delete cascade,
  match_score float not null,
  semantic_score float,
  skill_score float,
  matching_skills text[] default '{}',
  missing_skills text[] default '{}',
  selection_probability float,
  computed_at timestamptz default now(),
  unique(user_id, job_id, resume_id)
);

alter table match_results enable row level security;

create policy "Users can view their own match results"
  on match_results for select
  using (auth.uid() = user_id);

create policy "Service role can manage match results"
  on match_results for all
  to service_role
  using (true)
  with check (true);

-- =============================================
-- STORAGE BUCKET
-- =============================================
-- Run this manually in Supabase Storage UI or via API:
-- Create a bucket called "resumes" with public access

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict do nothing;

create policy "Anyone can upload resumes"
  on storage.objects for insert
  with check (bucket_id = 'resumes');

create policy "Public read access to resumes"
  on storage.objects for select
  using (bucket_id = 'resumes');

-- =============================================
-- SEED: Sample Jobs (for testing without scraping)
-- =============================================
insert into jobs (title, company, location, skills, stipend, apply_link, platform) values
  ('Software Development Intern', 'TechCorp India', 'Remote', ARRAY['Python', 'Django', 'REST API', 'SQL'], '₹15,000/month', 'https://internshala.com/internship/1', 'internshala'),
  ('Frontend Developer Intern', 'StartupXYZ', 'Bangalore', ARRAY['React.js', 'JavaScript', 'TailwindCSS', 'HTML', 'CSS'], '₹12,000/month', 'https://internshala.com/internship/2', 'internshala'),
  ('Data Science Intern', 'Analytics Hub', 'Remote', ARRAY['Python', 'Machine Learning', 'Pandas', 'NumPy', 'Scikit-learn'], '₹20,000/month', 'https://internshala.com/internship/3', 'internshala'),
  ('Machine Learning Intern', 'AI Solutions Ltd', 'Hyderabad', ARRAY['Python', 'TensorFlow', 'Deep Learning', 'NLP', 'PyTorch'], '₹25,000/month', 'https://internshala.com/internship/4', 'internshala'),
  ('Full Stack Developer Intern', 'WebWorks Technologies', 'Delhi', ARRAY['React.js', 'Node.js', 'MongoDB', 'Express.js', 'JavaScript'], '₹22,000/month', 'https://internshala.com/internship/5', 'internshala'),
  ('DevOps Engineer Intern', 'InfraCloud', 'Remote', ARRAY['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Terraform'], '₹20,000/month', 'https://internshala.com/internship/6', 'internshala'),
  ('UI/UX Design Intern', 'DesignStudio', 'Mumbai', ARRAY['Figma', 'UI Design', 'Prototyping', 'User Research'], '₹10,000/month', 'https://internshala.com/internship/7', 'internshala'),
  ('Backend Developer Intern', 'CloudBase Inc', 'Remote', ARRAY['Node.js', 'Express.js', 'MongoDB', 'REST API', 'Docker'], '₹18,000/month', 'https://internshala.com/internship/8', 'internshala'),
  ('Android App Developer Intern', 'MobileFirst', 'Pune', ARRAY['Android', 'Java', 'Kotlin', 'Android Studio', 'Firebase'], '₹14,000/month', 'https://internshala.com/internship/9', 'internshala'),
  ('Cybersecurity Intern', 'SecureNet', 'Noida', ARRAY['Network Security', 'Penetration Testing', 'Python', 'Linux', 'Kali Linux'], '₹16,000/month', 'https://internshala.com/internship/10', 'internshala')
on conflict (apply_link) do nothing;
