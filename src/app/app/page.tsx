import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { rollingDaysRange } from "@/lib/week-range";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

async function maxWeightByExerciseForWorkouts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workoutIds: string[]
) {
  const map = new Map<string, number>();
  if (workoutIds.length === 0) return map;

  const { data: sets } = await supabase
    .from("workout_sets")
    .select("exercise_id, weight_kg")
    .in("workout_id", workoutIds)
    .not("weight_kg", "is", null);

  for (const s of sets ?? []) {
    const kg = Number(s.weight_kg);
    if (!Number.isFinite(kg)) continue;
    const ex = s.exercise_id;
    map.set(ex, Math.max(map.get(ex) ?? 0, kg));
  }
  return map;
}

export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/app");

  const { from: weekFrom, to: weekTo } = rollingDaysRange(7);
  const prevWeekEnd = new Date(weekFrom);
  prevWeekEnd.setMilliseconds(prevWeekEnd.getMilliseconds() - 1);
  const prevWeekStart = new Date(weekFrom);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const { data: workoutsThisWeek } = await supabase
    .from("workouts")
    .select("id, title, performed_at")
    .eq("user_id", user.id)
    .gte("performed_at", weekFrom.toISOString())
    .lte("performed_at", weekTo.toISOString())
    .order("performed_at", { ascending: false });

  const idsThisWeek = (workoutsThisWeek ?? []).map((w) => w.id);

  const { data: workoutsPrevWeek } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", user.id)
    .gte("performed_at", prevWeekStart.toISOString())
    .lte("performed_at", prevWeekEnd.toISOString());

  const idsPrevWeek = (workoutsPrevWeek ?? []).map((w) => w.id);

  const [maxRecent, maxPrev] = await Promise.all([
    maxWeightByExerciseForWorkouts(supabase, idsThisWeek),
    maxWeightByExerciseForWorkouts(supabase, idsPrevWeek),
  ]);

  const improvedExerciseIds: { id: string; was: number; now: number }[] = [];
  for (const [exId, nowKg] of maxRecent) {
    const was = maxPrev.get(exId);
    if (was != null && nowKg > was) {
      improvedExerciseIds.push({ id: exId, was, now: nowKg });
    }
  }

  const { data: exerciseRows } =
    improvedExerciseIds.length > 0
      ? await supabase
          .from("exercises")
          .select("id, name")
          .in(
            "id",
            improvedExerciseIds.map((x) => x.id)
          )
      : { data: [] as { id: string; name: string }[] };

  const nameById = new Map((exerciseRows ?? []).map((e) => [e.id, e.name]));

  const improvements = improvedExerciseIds
    .map((x) => ({
      name: nameById.get(x.id) ?? "Cvik",
      was: x.was,
      now: x.now,
    }))
    .sort((a, b) => b.now - b.now)
    .slice(0, 6);

  const { data: lastWorkouts } = await supabase
    .from("workouts")
    .select("id, title, performed_at")
    .eq("user_id", user.id)
    .order("performed_at", { ascending: false })
    .limit(5);

  const workoutCountWeek = workoutsThisWeek?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="text-sm text-white/60">Ahoj</div>
        <div className="mt-1 text-lg font-semibold">{user.email}</div>
        <p className="mt-3 text-sm text-white/55">
          Přehled za <strong className="text-white/80">posledních 7 dní</strong>{" "}
          a rychlé odkazy.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            href="/app/workouts/new"
          >
            Nový trénink
          </Link>
          <Link
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-black/40"
            href="/app/progress"
          >
            Progres
          </Link>
          <Link
            className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-black/40"
            href="/app/exercises"
          >
            Cviky
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <div className="text-xs font-medium text-indigo-200/80">
            Tréninky (7 dní)
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">
            {workoutCountWeek}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <h2 className="text-base font-semibold">Poslední tréninky</h2>
          <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
            {(lastWorkouts ?? []).map((w) => (
              <li key={w.id}>
                <Link
                  href={`/app/workouts/${w.id}`}
                  className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-white/5"
                >
                  <span className="font-medium">
                    {w.title || "Trénink"}
                  </span>
                  <span className="shrink-0 text-xs text-white/45">
                    {formatDate(w.performed_at)}
                  </span>
                </Link>
              </li>
            ))}
            {(lastWorkouts?.length ?? 0) === 0 ? (
              <li className="px-3 py-6 text-sm text-white/55">
                Zatím žádný trénink.{" "}
                <Link className="underline text-indigo-300" href="/app/workouts/new">
                  Vytvoř první
                </Link>
                .
              </li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <h2 className="text-base font-semibold">
            Vyšší max. váha vs. předchozích 7 dní
          </h2>
          <p className="mt-1 text-xs text-white/45">
            Porovnání nejvyšší váhy u cviku: tento týden oproti týdnu před ním.
          </p>
          <ul className="mt-3 space-y-2">
            {improvements.map((row) => (
              <li
                key={row.name + row.was}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
              >
                <span className="font-medium text-white/90">{row.name}</span>
                <span className="shrink-0 tabular-nums text-white/60">
                  <span className="text-white/40">{row.was} kg</span>
                  <span className="mx-1.5 text-white/25">→</span>
                  <span className="text-emerald-300/90">{row.now} kg</span>
                </span>
              </li>
            ))}
            {improvements.length === 0 ? (
              <li className="rounded-lg border border-white/5 bg-black/20 px-3 py-4 text-sm text-white/50">
                Buď zatím nemáš dost dat ve dvou po sobě jdoucích týdnech, nebo
                se max. váhy nezvýšily. Pokračuj v tréninku a{" "}
                <Link className="underline text-indigo-300" href="/app/progress">
                  koukni na graf
                </Link>
                .
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
