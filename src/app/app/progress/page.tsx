import Link from "next/link";

import {
  DAILY_ACTIVITY_KINDS,
  type DailyActivityKind,
  dailyActivityLabel,
} from "@/lib/daily-activity-labels";
import { formatDurationHms } from "@/lib/format-duration";
import { createClient } from "@/lib/supabase/server";

import { CardioDistanceChart, type CardioChartPoint } from "./cardio-distance-chart";
import { CardioKindSelect } from "./cardio-kind-select";
import { DailyActivityChart, type DailyActivityChartPoint } from "./daily-activity-chart";
import { DailyActivityKindSelect } from "./daily-activity-kind-select";
import { ExerciseSelect } from "./exercise-select";
import { ExerciseWeightChart, type ChartPoint } from "./exercise-weight-chart";

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

function cardioKindTitle(kind: string) {
  switch (kind) {
    case "walk":
      return "Chůze";
    case "run":
      return "Běh";
    case "bike":
      return "Kolo";
    default:
      return kind;
  }
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{
    exercise?: string;
    tab?: string;
    kind?: string;
    dailyKind?: string;
  }>;
}) {
  const {
    exercise: exerciseParam,
    tab: tabParam,
    kind: kindParam,
    dailyKind: dailyKindParam,
  } = await searchParams;
  const tab =
    tabParam === "kardio"
      ? "kardio"
      : tabParam === "denni"
        ? "denni"
        : "sila";

  const dailyKind: DailyActivityKind = DAILY_ACTIVITY_KINDS.includes(
    dailyKindParam as DailyActivityKind
  )
    ? (dailyKindParam as DailyActivityKind)
    : "walk";

  const cardioKind =
    kindParam === "walk" || kindParam === "run" || kindParam === "bike"
      ? kindParam
      : "run";

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
  let cardioChartData: CardioChartPoint[] = [];
  let dailyChartData: DailyActivityChartPoint[] = [];
  let dailyTotalKm = 0;
  let dailyTotalSec = 0;

  if (user && tab === "sila" && selectedId) {
    const { data: rows } = await supabase
      .from("workout_sets")
      .select("workout_id, weight_kg, workouts!inner(performed_at)")
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

  if (user && tab === "kardio") {
    const { data: rows } = await supabase
      .from("cardio_logs")
      .select("workout_id, distance_km, kind, workouts!inner(performed_at)")
      .eq("user_id", user.id)
      .eq("kind", cardioKind)
      .not("distance_km", "is", null);

    type CRow = {
      workout_id: string;
      distance_km: number | null;
      kind: string;
      workouts: { performed_at: string } | { performed_at: string }[];
    };

    const byWorkout = new Map<
      string,
      { performed_at: string; distanceKm: number }
    >();

    for (const raw of (rows ?? []) as CRow[]) {
      const w = Array.isArray(raw.workouts)
        ? raw.workouts[0]
        : raw.workouts;
      if (!w?.performed_at) continue;
      const km = Number(raw.distance_km);
      if (!Number.isFinite(km) || km <= 0) continue;
      const prev = byWorkout.get(raw.workout_id);
      if (!prev) {
        byWorkout.set(raw.workout_id, {
          performed_at: w.performed_at,
          distanceKm: km,
        });
      } else {
        prev.distanceKm += km;
      }
    }

    cardioChartData = Array.from(byWorkout.values())
      .sort(
        (a, b) =>
          new Date(a.performed_at).getTime() -
          new Date(b.performed_at).getTime()
      )
      .map((x) => ({
        label: formatShortDate(x.performed_at),
        distanceKm: Math.round(x.distanceKm * 100) / 100,
        sortKey: new Date(x.performed_at).getTime(),
      }));
  }

  if (user && tab === "denni") {
    const { data: dailyRows } = await supabase
      .from("daily_activities")
      .select("activity_date, distance_km, duration_sec")
      .eq("user_id", user.id)
      .eq("kind", dailyKind)
      .order("activity_date", { ascending: true });

    const byDay = new Map<string, { km: number; sec: number }>();
    for (const row of dailyRows ?? []) {
      const d = String(row.activity_date);
      const km =
        row.distance_km != null ? Number(row.distance_km) : 0;
      const sec =
        row.duration_sec != null ? Number(row.duration_sec) : 0;
      const cur = byDay.get(d) ?? { km: 0, sec: 0 };
      cur.km += Number.isFinite(km) ? km : 0;
      cur.sec += Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
      byDay.set(d, cur);
    }

    for (const [, v] of byDay) {
      dailyTotalKm += v.km;
      dailyTotalSec += v.sec;
    }

    dailyChartData = Array.from(byDay.entries())
      .filter(([, v]) => v.km > 0)
      .map(([dateStr, v]) => ({
        label: formatShortDate(`${dateStr}T12:00:00.000Z`),
        distanceKm: Math.round(v.km * 100) / 100,
        durationSec: v.sec,
        sortKey: new Date(`${dateStr}T12:00:00`).getTime(),
      }))
      .sort((a, b) => a.sortKey - b.sortKey);
  }

  const strengthTitle = list.find((e) => e.id === selectedId)?.name ?? "Progres";
  const silaHref = selectedId
    ? `/app/progress?exercise=${selectedId}`
    : "/app/progress";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <h1 className="text-xl font-semibold tracking-tight">Progres</h1>
        <p className="mt-2 text-sm text-white/60">
          Síla (max. kg za trénink), kardio u tréninků (km za session) a denní
          aktivity mimo posilovnu (součet km a času za kalendářní den).
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full max-w-2xl gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
            <Link
              href={silaHref}
              className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:px-3 sm:text-sm ${
                tab === "sila"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/55 hover:text-white/85"
              }`}
            >
              Síla
            </Link>
            <Link
              href={`/app/progress?tab=kardio&kind=${cardioKind}`}
              className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:px-3 sm:text-sm ${
                tab === "kardio"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/55 hover:text-white/85"
              }`}
            >
              Kardio
            </Link>
            <Link
              href={`/app/progress?tab=denni&dailyKind=${dailyKind}`}
              className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-semibold transition sm:px-3 sm:text-sm ${
                tab === "denni"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/55 hover:text-white/85"
              }`}
            >
              Denní aktivity
            </Link>
          </div>
          <Link
            className="shrink-0 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/80 hover:bg-black/40"
            href="/app/workouts"
          >
            Zapsat trénink
          </Link>
        </div>

        {tab === "sila" ? (
          <>
            {list.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">
                Zatím nemáš žádné cviky.{" "}
                <Link className="underline text-indigo-300" href="/app/exercises">
                  Přidej je tady
                </Link>
                .
              </p>
            ) : (
              <div className="mt-4">
                <div className="text-xs font-medium text-white/50">Cvik</div>
                <div className="mt-1">
                  <ExerciseSelect exercises={list} value={selectedId} />
                </div>
              </div>
            )}
          </>
        ) : tab === "kardio" ? (
          <div className="mt-4">
            <div className="text-xs font-medium text-white/50">Aktivita</div>
            <div className="mt-1">
              <CardioKindSelect value={cardioKind} />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-xs font-medium text-white/50">Typ aktivity</div>
            <div className="mt-1">
              <DailyActivityKindSelect value={dailyKind} />
            </div>
          </div>
        )}
      </div>

      {tab === "sila" && list.length > 0 && selectedId ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <h2 className="text-lg font-semibold">{strengthTitle}</h2>
          <p className="mt-1 text-xs text-white/45">
            Body = tréninky v čase · max. kg za trénink
          </p>
          <div className="mt-4">
            <ExerciseWeightChart data={chartData} />
          </div>
        </div>
      ) : null}

      {tab === "kardio" ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <h2 className="text-lg font-semibold">
            {cardioKindTitle(cardioKind)} · km za trénink
          </h2>
          <p className="mt-1 text-xs text-white/45">
            V jednom tréninku můžeš mít víc záznamů stejného typu — v grafu se
            sečtou.
          </p>
          <div className="mt-4">
            <CardioDistanceChart data={cardioChartData} />
          </div>
        </div>
      ) : null}

      {tab === "denni" ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <h2 className="text-lg font-semibold">
            {dailyActivityLabel(dailyKind, null)} · km za den
          </h2>
          <p className="mt-1 text-xs text-white/45">
            Záznamy z dashboardu (mimo tréninky). Víc aktivit stejného typu v
            jeden den se v grafu sečtou. V bublině uvidíš i souhrnný čas v ten
            den.
          </p>
          <div className="mt-4">
            <DailyActivityChart data={dailyChartData} />
          </div>
          {(dailyTotalKm > 0 || dailyTotalSec > 0) && (
            <p className="mt-4 text-sm text-white/60">
              <span className="font-medium text-white/80">Souhrn (všechny dny):</span>{" "}
              {[
                dailyTotalKm > 0
                  ? `${Math.round(dailyTotalKm * 100) / 100} km`
                  : null,
                dailyTotalSec > 0 ? formatDurationHms(dailyTotalSec) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <p className="mt-3 text-xs text-white/40">
            <Link className="underline text-indigo-300/90" href="/app">
              Přidat záznam na dashboardu
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
