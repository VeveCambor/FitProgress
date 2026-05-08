-- Denní aktivity mimo tréninky (procházka, tůra, běh…).
-- Spusť v Supabase SQL editoru.

create table if not exists public.daily_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null,
  kind text not null check (kind in ('walk', 'hike', 'run', 'bike', 'swim', 'ski', 'other')),
  custom_label text,
  distance_km numeric(12,3),
  duration_sec int,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_daily_act_user_date on public.daily_activities (user_id, activity_date desc);

alter table public.daily_activities enable row level security;

drop policy if exists "daily_act_select_own" on public.daily_activities;
create policy "daily_act_select_own" on public.daily_activities
for select using (auth.uid() = user_id);

drop policy if exists "daily_act_insert_own" on public.daily_activities;
create policy "daily_act_insert_own" on public.daily_activities
for insert with check (auth.uid() = user_id);

drop policy if exists "daily_act_update_own" on public.daily_activities;
create policy "daily_act_update_own" on public.daily_activities
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_act_delete_own" on public.daily_activities;
create policy "daily_act_delete_own" on public.daily_activities
for delete using (auth.uid() = user_id);
