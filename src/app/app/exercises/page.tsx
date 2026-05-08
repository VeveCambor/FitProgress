import { createClient } from "@/lib/supabase/server";
import { createExercise } from "./actions";

import { DeleteExerciseButton } from "./delete-exercise-button";
import { ExerciseEditor } from "./exercise-editor";

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exercises, error } = user
    ? await supabase
        .from("exercises")
        .select("id,name,primary_muscle,equipment,created_at")
        .order("created_at", { ascending: false })
    : { data: null, error: null };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <h1 className="text-xl font-semibold tracking-tight">Cviky</h1>
        <p className="mt-2 text-sm text-white/60">
          Přidej si vlastní cviky (např. “Dřep”, “Bench press”). Později na tom
          postavíme zápis tréninku a grafy progresu.
        </p>

        {errorParam ? (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {errorParam}
          </div>
        ) : null}

        <form action={createExercise} className="mt-6 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="name">
              Název
            </label>
            <input
              id="name"
              name="name"
              placeholder="např. Bench press"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/80"
                htmlFor="primary_muscle"
              >
                Sval
              </label>
              <input
                id="primary_muscle"
                name="primary_muscle"
                placeholder="např. hrudník"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/80"
                htmlFor="equipment"
              >
                Vybavení
              </label>
              <input
                id="equipment"
                name="equipment"
                placeholder="např. osa"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <button
            className="h-11 w-full rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            type="submit"
          >
            Přidat cvik
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Seznam</h2>
          <div className="text-xs text-white/50">
            {error ? "Chyba načítání" : `${exercises?.length ?? 0} položek`}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error.message}
          </div>
        ) : null}

        <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
          {(exercises ?? []).map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium">{ex.name}</div>
                <div className="text-xs text-white/50">
                  {[ex.primary_muscle, ex.equipment].filter(Boolean).join(" • ")}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <ExerciseEditor exercise={ex} />
                <DeleteExerciseButton
                  exerciseId={ex.id}
                  exerciseName={ex.name}
                />
              </div>
            </div>
          ))}

          {(exercises?.length ?? 0) === 0 ? (
            <div className="p-6 text-sm text-white/60">
              Zatím tu nic není. Přidej první cvik vlevo.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

