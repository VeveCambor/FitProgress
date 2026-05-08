-- Kardio záznamy (chůze, běh, kolo) navázané na trénink.
-- Spusť v Supabase SQL editoru (po hlavním schema.sql).

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
