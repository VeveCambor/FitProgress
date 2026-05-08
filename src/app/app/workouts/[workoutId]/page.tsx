import Link from "next/link";

import { IconTrash } from "@/components/workout-icons";
import { createClient } from "@/lib/supabase/server";
import {
  addCardioLog,
  addSet,
  deleteCardioLog,
  deleteExerciseSets,
  deleteWorkoutSetGroup,
} from "../actions";

import { DeleteWorkoutButton } from "./delete-workout-button";
import { SetRunEditor } from "./set-run-editor";
import { WorkoutMetaEditor } from "./workout-meta-editor";

function formatDateTime(value: string) {
  const d = new Date(value);
  return new Intl.DateTimeFormat("cs-CZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

type WorkoutSetRow = {
  id: string;
  exercise_id: string;
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  notes: string | null;
  created_at: string;
};

function setSignature(s: WorkoutSetRow) {
  return `${s.reps ?? ""}|${s.weight_kg ?? ""}|${s.rpe ?? ""}|${s.notes ?? ""}`;
}

function groupSetsByExercise(sets: WorkoutSetRow[]) {
  const byEx = new Map<string, WorkoutSetRow[]>();
  for (const s of sets) {
    const arr = byEx.get(s.exercise_id) ?? [];
    arr.push(s);
    byEx.set(s.exercise_id, arr);
  }
  for (const list of byEx.values()) {
    list.sort((a, b) => a.set_index - b.set_index);
  }
  return Array.from(byEx.entries())
    .map(([exercise_id, list]) => ({
      exercise_id,
      sets: list,
      firstAt: Math.min(...list.map((x) => new Date(x.created_at).getTime())),
    }))
    .sort((a, b) => a.firstAt - b.firstAt);
}

function runsWithinExercise(sets: WorkoutSetRow[]) {
  const sorted = [...sets].sort((a, b) => a.set_index - b.set_index);
  const runs: {
    count: number;
    representative: WorkoutSetRow;
    ids: string[];
  }[] = [];
  for (const s of sorted) {
    const last = runs[runs.length - 1];
    if (last && setSignature(s) === setSignature(last.representative)) {
      last.count += 1;
      last.ids.push(s.id);
    } else {
      runs.push({ count: 1, representative: s, ids: [s.id] });
    }
  }
  return runs;
}

function formatRunLine(rep: WorkoutSetRow, count: number) {
  const bits: string[] = [];
  if (count > 1) bits.push(`${count}×`);
  if (rep.reps != null) bits.push(`${rep.reps} opak.`);
  if (rep.weight_kg != null) bits.push(`${rep.weight_kg} kg`);
  if (rep.rpe != null) bits.push(`RPE ${rep.rpe}`);
  if (bits.length === 0) return count > 1 ? `${count} sérií` : "—";
  return bits.join(" · ");
}

type CardioRow = {
  id: string;
  kind: string;
  distance_km: number | null;
  duration_sec: number | null;
  avg_speed_kmh: number | null;
  notes: string | null;
  created_at: string;
};

function cardioKindLabel(kind: string) {
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

function formatDurationHms(totalSec: number | null) {
  if (totalSec == null || totalSec <= 0) return null;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatCardioLine(c: CardioRow) {
  const parts: string[] = [];
  if (c.distance_km != null && c.distance_km > 0) {
    parts.push(`${c.distance_km} km`);
  }
  const t = formatDurationHms(c.duration_sec);
  if (t) parts.push(t);
  if (c.avg_speed_kmh != null && c.avg_speed_kmh > 0) {
    parts.push(`${c.avg_speed_kmh} km/h`);
  }
  return parts.length ? parts.join(" · ") : "—";
}

export default async function WorkoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { workoutId } = await params;
  const { error: pageError } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workout } = user
    ? await supabase
        .from("workouts")
        .select("id,title,performed_at,notes")
        .eq("id", workoutId)
        .single()
    : { data: null };

  const { data: exercises } = user
    ? await supabase
        .from("exercises")
        .select("id,name")
        .order("name", { ascending: true })
    : { data: null };

  const { data: setsRaw } = user
    ? await supabase
        .from("workout_sets")
        .select("id,exercise_id,set_index,reps,weight_kg,rpe,notes,created_at")
        .eq("workout_id", workoutId)
        .order("created_at", { ascending: true })
    : { data: null };

  const sets = (setsRaw ?? []) as WorkoutSetRow[];
  const exerciseGroups = groupSetsByExercise(sets);
  const exerciseMap = new Map((exercises ?? []).map((e) => [e.id, e.name]));

  const { data: cardioRaw } = user
    ? await supabase
        .from("cardio_logs")
        .select(
          "id,kind,distance_km,duration_sec,avg_speed_kmh,notes,created_at"
        )
        .eq("workout_id", workoutId)
        .order("created_at", { ascending: true })
    : { data: null };

  const cardioRows = (cardioRaw ?? []) as CardioRow[];

  if (!workout) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="text-sm text-white/60">Trénink nenalezen.</div>
        <Link className="mt-3 inline-block underline" href="/app/workouts">
          Zpět na tréninky
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-white/60">Trénink</div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {workout.title || "Bez názvu"}
            </h1>
            <div className="mt-2 text-sm text-white/60">
              {formatDateTime(workout.performed_at)}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <WorkoutMetaEditor
              workoutId={workoutId}
              title={workout.title}
              performedAtIso={workout.performed_at}
              notes={workout.notes}
            />
            <Link
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-black/40"
              href="/app/workouts"
            >
              Zpět
            </Link>
            <DeleteWorkoutButton workoutId={workoutId} />
          </div>
        </div>

        {pageError ? (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {pageError}
          </div>
        ) : null}

        {workout.notes ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70">
            {workout.notes}
          </div>
        ) : null}

        <h2 className="mt-6 text-sm font-semibold text-white/80">
          Přidat cvik (série × opakování × kg)
        </h2>
        <p className="mt-1 text-xs text-white/50">
          Např. 3 série, 10 opakování, 40 kg — uloží se tři stejné série.
        </p>

        <form
          action={addSet.bind(null, workoutId)}
          className="mt-3 space-y-3"
        >
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/80"
              htmlFor="exercise_id"
            >
              Cvik
            </label>
            <select
              id="exercise_id"
              name="exercise_id"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              required
              defaultValue={(exercises ?? [])[0]?.id ?? ""}
            >
              {(exercises ?? []).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            {(exercises?.length ?? 0) === 0 ? (
              <div className="text-xs text-white/50">
                Nejdřív si přidej cviky v{" "}
                <Link className="underline" href="/app/exercises">
                  Cviky
                </Link>
                .
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/80"
                htmlFor="set_count"
              >
                Počet sérií
              </label>
              <input
                id="set_count"
                name="set_count"
                inputMode="numeric"
                defaultValue={3}
                min={1}
                max={50}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80" htmlFor="reps">
                Opak. na sérii
              </label>
              <input
                id="reps"
                name="reps"
                inputMode="numeric"
                placeholder="10"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/80"
                htmlFor="weight_kg"
              >
                Kg
              </label>
              <input
                id="weight_kg"
                name="weight_kg"
                inputMode="decimal"
                placeholder="40"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="rpe">
              RPE (volitelné)
            </label>
            <input
              id="rpe"
              name="rpe"
              inputMode="decimal"
              placeholder="např. 8"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="notes">
              Poznámka (volitelné, ke všem sériím)
            </label>
            <input
              id="notes"
              name="notes"
              placeholder="např. pauza 2 min"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            className="h-11 w-full rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] disabled:opacity-40"
            type="submit"
            disabled={(exercises?.length ?? 0) === 0}
          >
            Přidat
          </button>
        </form>

        <h2 className="mt-8 text-sm font-semibold text-white/80">
          Kardio (chůze, běh, kolo)
        </h2>
        <p className="mt-1 text-xs text-white/50">
          Zadej vzdálenost (km), čas (min + s) a případně průměrnou rychlost
          (km/h). Ze dvou hodnot se třetí dopočítá, pokud chybí.
        </p>

        <form
          action={addCardioLog.bind(null, workoutId)}
          className="mt-3 space-y-3"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="kind">
              Aktivita
            </label>
            <select
              id="kind"
              name="kind"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              defaultValue="run"
            >
              <option value="walk">Chůze</option>
              <option value="run">Běh</option>
              <option value="bike">Kolo</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/80"
              htmlFor="distance_km"
            >
              Vzdálenost (km)
            </label>
            <input
              id="distance_km"
              name="distance_km"
              inputMode="decimal"
              placeholder="např. 5,2"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/80"
                htmlFor="duration_min"
              >
                Čas – minuty
              </label>
              <input
                id="duration_min"
                name="duration_min"
                inputMode="numeric"
                placeholder="30"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/80"
                htmlFor="duration_sec"
              >
                Čas – sekundy
              </label>
              <input
                id="duration_sec"
                name="duration_sec"
                inputMode="numeric"
                placeholder="0–59"
                min={0}
                max={59}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/80"
              htmlFor="avg_speed_kmh"
            >
              Prům. rychlost (km/h)
            </label>
            <input
              id="avg_speed_kmh"
              name="avg_speed_kmh"
              inputMode="decimal"
              placeholder="např. 10,5"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="cnotes">
              Poznámka (volitelné)
            </label>
            <input
              id="cnotes"
              name="notes"
              placeholder="terén, tep…"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            className="h-11 w-full rounded-xl border border-white/10 bg-black/30 text-sm font-semibold text-white/90 hover:bg-black/45"
            type="submit"
          >
            Přidat kardio
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Cviky v tréninku</h2>
          <div className="text-xs text-white/50">
            Cviky: {exerciseGroups.length}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {exerciseGroups.map((group) => {
            const name = exerciseMap.get(group.exercise_id) ?? "Cvik";
            const runs = runsWithinExercise(group.sets);
            return (
              <div
                key={group.exercise_id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold">{name}</div>
                    <div className="mt-0.5 text-xs text-white/45">
                      Série v tomto cviku: {group.sets.length}
                    </div>
                  </div>
                  <form
                    action={deleteExerciseSets.bind(
                      null,
                      workoutId,
                      group.exercise_id
                    )}
                  >
                    <button
                      type="submit"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/30 text-rose-300/90 hover:bg-rose-500/15 hover:text-rose-200"
                      aria-label="Smazat cvik"
                      title="Smazat cvik"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </form>
                </div>

                <ul className="mt-3 space-y-2">
                  {runs.map((run) => (
                    <li
                      key={run.ids.join("-")}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1 text-sm text-white/80">
                        {formatRunLine(run.representative, run.count)}
                        {run.representative.notes ? (
                          <div className="mt-1 text-xs text-white/45">
                            {run.representative.notes}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <SetRunEditor
                          workoutId={workoutId}
                          setIds={run.ids}
                          setCount={run.count}
                          representative={run.representative}
                        />
                        <form
                          action={deleteWorkoutSetGroup.bind(null, workoutId)}
                        >
                          {run.ids.map((id) => (
                            <input
                              key={id}
                              type="hidden"
                              name="set_id"
                              value={id}
                            />
                          ))}
                          <button
                            type="submit"
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/30 text-rose-300/90 hover:bg-rose-500/15 hover:text-rose-200"
                            aria-label={
                              run.count > 1
                                ? "Smazat blok sérií"
                                : "Smazat sérii"
                            }
                            title="Smazat"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {sets.length === 0 ? (
            <div className="rounded-xl border border-white/10 p-6 text-sm text-white/60">
              Zatím tu nejsou žádné série.
            </div>
          ) : null}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold">Kardio v tréninku</h2>
            <div className="text-xs text-white/50">
              Záznamů: {cardioRows.length}
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {cardioRows.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white/90">
                    {cardioKindLabel(c.kind)}
                  </div>
                  <div className="mt-0.5 text-sm text-white/70">
                    {formatCardioLine(c)}
                  </div>
                  {c.notes ? (
                    <div className="mt-1 text-xs text-white/45">{c.notes}</div>
                  ) : null}
                </div>
                <form action={deleteCardioLog.bind(null, workoutId, c.id)}>
                  <button
                    type="submit"
                    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/30 text-rose-300/90 hover:bg-rose-500/15 hover:text-rose-200"
                    aria-label="Smazat kardio záznam"
                    title="Smazat"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
          </ul>

          {cardioRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-white/10 p-6 text-sm text-white/60">
              Zatím žádné kardio. Přidej ho vlevo ve formuláři.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

