-- Motherboard — Supabase schema
-- Run this in the Supabase SQL editor after creating your project.

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  completed boolean default false,
  priority text check (priority in ('high','medium','low')) default 'medium',
  due_date date,
  created_at timestamptz default now()
);

-- Habits
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  date date not null,
  unique(habit_id, date)
);

-- Goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text check (category in ('health','career','personal','finance','learning')),
  progress int default 0 check (progress between 0 and 100),
  target_date date,
  notes text,
  created_at timestamptz default now()
);

-- Fitness logs
create table if not exists fitness_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  workout_type text not null,
  duration_min int,
  calories int,
  notes text,
  created_at timestamptz default now()
);

-- Focus tasks (daily)
create table if not exists focus_tasks (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  title text not null,
  estimated_min int default 30,
  done boolean default false,
  created_at timestamptz default now()
);

-- Journal entries
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null unique default current_date,
  content text not null,
  mood int check (mood between 1 and 5),
  created_at timestamptz default now()
);

-- Sleep logs
create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique default current_date,
  bedtime time not null,
  wake_time time not null,
  quality int check (quality between 1 and 5),
  notes text,
  created_at timestamptz default now()
);

-- Reading items
create table if not exists reading_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  type text check (type in ('book','article','course','podcast')),
  status text check (status in ('queue','in_progress','done')) default 'queue',
  url text,
  created_at timestamptz default now()
);

-- Health metrics (Apple Health / manual)
create table if not exists health_metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  weight_lbs numeric,
  body_fat_pct numeric,
  lean_mass_lbs numeric,
  source text default 'manual',
  created_at timestamptz default now()
);

-- Row Level Security (enable for all tables)
alter table tasks enable row level security;
alter table habits enable row level security;
alter table habit_completions enable row level security;
alter table goals enable row level security;
alter table fitness_logs enable row level security;
alter table focus_tasks enable row level security;
alter table journal_entries enable row level security;
alter table sleep_logs enable row level security;
alter table reading_items enable row level security;
alter table health_metrics enable row level security;

-- Policies: allow all for authenticated users (single-user dashboard)
create policy "allow_all" on tasks for all using (true) with check (true);
create policy "allow_all" on habits for all using (true) with check (true);
create policy "allow_all" on habit_completions for all using (true) with check (true);
create policy "allow_all" on goals for all using (true) with check (true);
create policy "allow_all" on fitness_logs for all using (true) with check (true);
create policy "allow_all" on focus_tasks for all using (true) with check (true);
create policy "allow_all" on journal_entries for all using (true) with check (true);
create policy "allow_all" on sleep_logs for all using (true) with check (true);
create policy "allow_all" on reading_items for all using (true) with check (true);
create policy "allow_all" on health_metrics for all using (true) with check (true);
