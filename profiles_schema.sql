-- =============================================
-- SmartApply AI — Profiles Table Schema
-- Copy and run this in your Supabase SQL Editor
-- =============================================

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  target_role text,
  phone text,
  location text,
  education text,
  experience text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  bio text,
  skills text[] default '{}',
  preferences jsonb default '{"remote_preference": false, "notifications_enabled": true}'::jsonb,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can manage their own profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Service role can manage profiles"
  on public.profiles for all
  to service_role
  using (true)
  with check (true);
