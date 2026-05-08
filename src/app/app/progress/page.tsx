import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { ExerciseSelect } from "./exercise-select";
import { ExerciseWeightChart, type ChartPoint } from "./exercise-weight-chart";

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ exercise?: string }>;
}) {
  const { exercise: exerciseParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exercises } = user
    ? await supabase
        .from("exercises")
        .select("id,name")
        .order("name", { ascending: true })
    : { data: null };

  const list = exercises ?? [];
  const selectedId =
    exerciseParam && list.some((e) => e.id === exerciseParam)
      ? exerciseParam
      : list[0]?.id ?? "";

  let chartData: ChartPoint[] = [];

  if (user && selectedId) {
    const { data: rows } = await supabase
      .from("workout_sets")
      .select(
        "workout_id, weight_kg, workouts!inner(performed_at)"
      )
      .eq("user_id", user.id)
      .eq("exercise_id", selectedId)
      .not("weight_kg", "is", null);

    type Row = {
      workout_id: string;
      weight_kg: number | null;
      workouts: { performed_at: string } | { performed_at: string }[];
    };

    const byWorkout = new Map<
      string,
      { performed_at: string; maxKg: number }
    >();

    for (const raw of (rows ?? []) as Row[]) {
      const w = Array.isArray(raw.workouts)
        ? raw.workouts[0]
        : raw.workouts;
      if (!w?.performed_at) continue;
      const kg = Number(raw.weight_kg);
      if (!Number.isFinite(kg)) continue;
      const prev = byWorkout.get(raw.workout_id);
      if (!prev) {
        byWorkout.set(raw.workout_id, {
          performed_at: w.performed_at,
          maxKg: kg,
        });
      } else {
        prev.maxKg = Math.max(prev.maxKg, kg);
      }
    }

    chartData = Array.from(byWorkout.values())
      .sort(
        (a, b) =>
          new Date(a.performed_at).getTime() -
          new Date(b.performed_at).getTime()
      )
      .map((x) => ({
        label: formatShortDate(x.performed_at),
        maxKg: Math.round(x.maxKg * 10) / 10,
        sortKey: new Date(x.performed_at).getTime(),
      }));
  }

  const title = list.find((e) => e.id === selectedId)?.name ?? "Progres";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <h1 className="text-xl font-semibold tracking-tight">Progres</h1>
        <p className="mt-2 text-sm text-white/60">
          Graf ukazuje <strong className="text-white/80">nejvyšší váhu</strong>{" "}
          u vybraného cviku v každém tréninku (např. 3×10 @ 40 kg → 40 kg).
        </p>

        {list.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">
            Zatím nemáš žádné cviky.{" "}
            <Link className="underline text-indigo-300" href="/app/exercises">
              Přidej je tady
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-medium text-white/50">Cvik</div>
              <div className="mt-1">
                <ExerciseSelect exercises={list} value={selectedId} />
              </div>
            </div>
            <Link
              className="shrink-0 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/80 hover:bg-black/40"
              href="/app/workouts"
            >
              Zapsat trénink
            </Link>
          </div>
        )}
      </div>

      {list.length > 0 && selectedId ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-white/45">
            Body = tréninky v čase · max. kg za trénink
          </p>
          <div className="mt-4">
            <ExerciseWeightChart data={chartData} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
