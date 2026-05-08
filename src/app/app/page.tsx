import Link from "next/link";
import { redirect } from "next/navigation";

import { dailyActivityLabel } from "@/lib/daily-activity-labels";
import { formatDurationHms } from "@/lib/format-duration";
import { createClient } from "@/lib/supabase/server";
import { rollingDaysRange } from "@/lib/week-range";

import { ActivityMonthCalendar } from "./daily-activities/activity-month-calendar";
import { CalendarDayDetailPanel } from "./daily-activities/calendar-day-detail-panel";
import { DeleteDailyActivityButton } from "./daily-activities/delete-daily-activity-button";
import { EditDailyActivityModal } from "./daily-activities/edit-daily-activity-modal";
import { QuickActivityModal } from "./daily-activities/quick-activity-modal";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function parseViewMonth(m: string | undefined) {
  const now = new Date();
  if (!m || !/^\d{4}-\d{2}$/.test(m)) {
    return {
      y: now.getFullYear(),
      mon: now.getMonth(),
      key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    };
  }
  const [ys, ms] = m.split("-").map(Number);
  if (ms < 1 || ms > 12 || !Number.isFinite(ys)) {
    return parseViewMonth(undefined);
  }
  return { y: ys, mon: ms - 1, key: m };
}

function monthRangeStrings(y: number, mon: number) {
  const first = `${y}-${String(mon + 1).padStart(2, "0")}-01`;
  const lastD = new Date(y, mon + 1, 0).getDate();
  const last = `${y}-${String(mon + 1).padStart(2, "0")}-${String(lastD).padStart(2, "0")}`;
  return { first, last };
}

function formatListDayDate(dateStr: string) {
  const [Y, M, D] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(Y, M - 1, D));
}

/** Kalendářní den v Europe/Prague (YYYY-MM-DD) pro zarovnání s měsíčním pohledem. */
function dateKeyPrague(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE", {
    timeZone: "Europe/Prague",
  });
}

function parseSelectedDay(
  d: string | undefined,
  monthFirst: string,
  monthLast: string
) {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  if (d < monthFirst || d > monthLast) return null;
  return d;
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

export default async function AppHome({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; d?: string; error?: string }>;
}) {
  const { m: monthParam, d: dayParam, error: pageError } = await searchParams;
  const { y, mon, key: monthKey } = parseViewMonth(monthParam);
  const { first: monthFirst, last: monthLast } = monthRangeStrings(y, mon);
  const selectedDay = parseSelectedDay(dayParam, monthFirst, monthLast);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/app");

  const { data: dailyActs } = await supabase
    .from("daily_activities")
    .select(
      "id, activity_date, kind, custom_label, distance_km, duration_sec, notes, created_at"
    )
    .eq("user_id", user.id)
    .gte("activity_date", monthFirst)
    .lte("activity_date", monthLast)
    .order("activity_date", { ascending: false })
    .order("created_at", { ascending: false });

  const daysWithActivity = new Set<string>();
  for (const a of dailyActs ?? []) {
    if (a.activity_date) daysWithActivity.add(String(a.activity_date));
  }

  const padStartMs = Date.UTC(y, mon, 1) - 2 * 24 * 60 * 60 * 1000;
  const padEndMs = Date.UTC(y, mon + 1, 0, 23, 59, 59, 999) + 2 * 24 * 60 * 60 * 1000;
  const { data: workoutsMonthPad } = await supabase
    .from("workouts")
    .select("id, title, performed_at")
    .eq("user_id", user.id)
    .gte("performed_at", new Date(padStartMs).toISOString())
    .lte("performed_at", new Date(padEndMs).toISOString());

  const daysWithWorkout = new Set<string>();
  const workoutsByDate = new Map<
    string,
    { id: string; title: string | null; performed_at: string }[]
  >();
  for (const w of workoutsMonthPad ?? []) {
    if (!w.performed_at) continue;
    const k = dateKeyPrague(w.performed_at);
    if (k < monthFirst || k > monthLast) continue;
    daysWithWorkout.add(k);
    const arr = workoutsByDate.get(k) ?? [];
    arr.push({
      id: w.id,
      title: w.title,
      performed_at: w.performed_at,
    });
    workoutsByDate.set(k, arr);
  }
  for (const arr of workoutsByDate.values()) {
    arr.sort(
      (a, b) =>
        new Date(a.performed_at).getTime() - new Date(b.performed_at).getTime()
    );
  }

  const activitiesForSelectedDay =
    selectedDay == null
      ? []
      : (dailyActs ?? []).filter(
          (a) => String(a.activity_date) === selectedDay
        );
  const workoutsForSelectedDay = selectedDay
    ? (workoutsByDate.get(selectedDay) ?? [])
    : [];

  const prevMonth = new Date(y, mon - 1, 1);
  const nextMonth = new Date(y, mon + 1, 1);
  const prevKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthTitle = new Intl.DateTimeFormat("cs-CZ", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, mon, 1));

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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="text-sm text-white/60">Ahoj</div>
        <div className="mt-1 text-lg font-semibold">{user.email}</div>
        <p className="mt-3 text-sm text-white/55">
          Přehled za <strong className="text-white/80">posledních 7 dní</strong>{" "}
          a rychlé odkazy.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
        {pageError ? (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {pageError}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 className="text-base font-semibold">Denní aktivity</h2>
            <p className="mt-1 text-xs text-white/45">
              Mimo tréninky — procházka, tůra, kolo, plavání… Klikni na den pro
              detail. V kalendáři:{" "}
              <span className="text-fuchsia-300/90">fialově trénink</span>,{" "}
              <span className="text-cyan-300/85">tyrkysově aktivita</span>.
            </p>
          </div>
          <QuickActivityModal className="self-start" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <Link
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white/80 hover:bg-black/45"
            href={`/app?m=${prevKey}`}
          >
            ‹ Dříve
          </Link>
          <span className="text-sm font-medium capitalize text-white/90">
            {monthTitle}
          </span>
          <Link
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white/80 hover:bg-black/45"
            href={`/app?m=${nextKey}`}
          >
            Později ›
          </Link>
        </div>

        {selectedDay ? (
          <CalendarDayDetailPanel
            dateStr={selectedDay}
            monthKey={monthKey}
            activities={activitiesForSelectedDay.map((a) => ({
              id: a.id,
              activity_date: String(a.activity_date),
              kind: String(a.kind),
              custom_label: (a.custom_label as string | null) ?? null,
              distance_km:
                a.distance_km != null ? Number(a.distance_km) : null,
              duration_sec:
                a.duration_sec != null ? Number(a.duration_sec) : null,
              notes: (a.notes as string | null) ?? null,
            }))}
            workouts={workoutsForSelectedDay}
          />
        ) : null}

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,300px)_1fr]">
          <ActivityMonthCalendar
            year={y}
            monthIndex={mon}
            datesWithActivity={Array.from(daysWithActivity)}
            datesWithWorkout={Array.from(daysWithWorkout)}
            viewMonthKey={monthKey}
            selectedDay={selectedDay}
          />
          <div>
            <h3 className="text-sm font-medium text-white/70">
              Záznamy ({monthKey})
            </h3>
            <ul className="mt-2 max-h-[min(24rem,50vh)] space-y-2 overflow-y-auto pr-1">
              {(dailyActs ?? []).map((a) => {
                const label = dailyActivityLabel(
                  a.kind,
                  a.custom_label as string | null
                );
                const bits: string[] = [label];
                if (a.distance_km != null && Number(a.distance_km) > 0) {
                  bits.push(`${a.distance_km} km`);
                }
                const dur = formatDurationHms(a.duration_sec);
                if (dur) bits.push(dur);
                return (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white/45">
                        {formatListDayDate(String(a.activity_date))}
                      </div>
                      <div className="text-sm text-white/85">
                        {bits.join(" · ")}
                      </div>
                      {a.notes ? (
                        <div className="mt-0.5 text-xs text-white/40">
                          {a.notes}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <EditDailyActivityModal
                        activity={{
                          id: a.id,
                          activity_date: String(a.activity_date),
                          kind: String(a.kind),
                          custom_label:
                            (a.custom_label as string | null) ?? null,
                          distance_km:
                            a.distance_km != null
                              ? Number(a.distance_km)
                              : null,
                          duration_sec:
                            a.duration_sec != null
                              ? Number(a.duration_sec)
                              : null,
                          notes: (a.notes as string | null) ?? null,
                        }}
                      />
                      <DeleteDailyActivityButton
                        activityId={a.id}
                        label={label}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {(dailyActs?.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-white/50">
                V tomto měsíci zatím žádná aktivita mimo trénink — použij + vpravo
                nahoře u nadpisu.
              </p>
            ) : null}
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
