-- FitProgress: základní schéma pro cviky a tréninky.
-- Spusť v Supabase SQL editoru. (Později to můžeme převést na migrations přes Supabase CLI.)

create extension if not exists "pgcrypto";

-- 1) Katalog cviků (uživatel si spravuje vlastní)
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  aliases text[] not null default '{}'::text[],
  primary_muscle text,
  equipment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

-- 2) Trénink (jedna návštěva gymu / domácí trénink)
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  performed_at timestamptz not null default now(),
  title text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Série v rámci tréninku
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  set_index int not null,
  reps int,
  weight_kg numeric(8,2),
  rpe numeric(3,1),
  notes text,
  created_at timestamptz not null default now(),
  unique (workout_id, exercise_id, set_index)
);

create index if not exists idx_exercises_user on public.exercises (user_id);
create index if not exists idx_workouts_user_performed on public.workouts (user_id, performed_at desc);
create index if not exists idx_sets_workout on public.workout_sets (workout_id);
create index if not exists idx_sets_exercise on public.workout_sets (exercise_id);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_exercises_updated_at on public.exercises;
create trigger trg_exercises_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

drop trigger if exists trg_workouts_updated_at on public.workouts;
create trigger trg_workouts_updated_at
before update on public.workouts
for each row execute function public.set_updated_at();

-- RLS
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

drop policy if exists "exercises_select_own" on public.exercises;
create policy "exercises_select_own" on public.exercises
for select using (auth.uid() = user_id);

drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own" on public.exercises
for insert with check (auth.uid() = user_id);

drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own" on public.exercises
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own" on public.exercises
for delete using (auth.uid() = user_id);

drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own" on public.workouts
for select using (auth.uid() = user_id);

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own" on public.workouts
for insert with check (auth.uid() = user_id);

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own" on public.workouts
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own" on public.workouts
for delete using (auth.uid() = user_id);

drop policy if exists "sets_select_own" on public.workout_sets;
create policy "sets_select_own" on public.workout_sets
for select using (auth.uid() = user_id);

drop policy if exists "sets_insert_own" on public.workout_sets;
create policy "sets_insert_own" on public.workout_sets
for insert with check (auth.uid() = user_id);

drop policy if exists "sets_update_own" on public.workout_sets;
create policy "sets_update_own" on public.workout_sets
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sets_delete_own" on public.workout_sets;
create policy "sets_delete_own" on public.workout_sets
for delete using (auth.uid() = user_id);

-- 4) Kardio (chůze, běh, kolo) u tréninku
create table if not exists public.cardio_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  kind text not null check (kind in ('walk', 'run', 'bike')),
  distance_km numeric(12,3),
  duration_sec int,
  avg_speed_kmh numeric(12,3),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cardio_workout on public.cardio_logs (workout_id);
create index if not exists idx_cardio_user on public.cardio_logs (user_id);

alter table public.cardio_logs enable row level security;

drop policy if exists "cardio_select_own" on public.cardio_logs;
create policy "cardio_select_own" on public.cardio_logs
for select using (auth.uid() = user_id);

drop policy if exists "cardio_insert_own" on public.cardio_logs;
create policy "cardio_insert_own" on public.cardio_logs
for insert with check (auth.uid() = user_id);

drop policy if exists "cardio_update_own" on public.cardio_logs;
create policy "cardio_update_own" on public.cardio_logs
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cardio_delete_own" on public.cardio_logs;
create policy "cardio_delete_own" on public.cardio_logs
for delete using (auth.uid() = user_id);

-- 5) Denní aktivity mimo tréninky
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

