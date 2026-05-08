import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

function formatDate(value: string) {
  const d = new Date(value);
  return new Intl.DateTimeFormat("cs-CZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workouts } = user
    ? await supabase
        .from("workouts")
        .select("id,title,performed_at")
        .order("performed_at", { ascending: false })
        .limit(50)
    : { data: null };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <h1 className="text-xl font-semibold tracking-tight">Tréninky</h1>
        <p className="mt-2 text-sm text-white/60">
          Vytvoř nový trénink a přidej série. Tady pak postavíme grafy a
          týdenní přehled.
        </p>

        {errorParam ? (
          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {errorParam}
          </div>
        ) : null}

        <Link
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          href="/app/workouts/new"
        >
          Nový trénink
        </Link>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Poslední</h2>
          <div className="text-xs text-white/50">
            {workouts?.length ?? 0} položek
          </div>
        </div>

        <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
          {(workouts ?? []).map((w) => (
            <Link
              key={w.id}
              href={`/app/workouts/${w.id}`}
              className="flex items-center justify-between gap-4 p-3 hover:bg-white/5"
            >
              <div>
                <div className="font-medium">
                  {w.title || "Trénink"}
                </div>
                <div className="text-xs text-white/50">
                  {formatDate(w.performed_at)}
                </div>
              </div>
              <div className="text-xs text-white/40">Otevřít</div>
            </Link>
          ))}

          {(workouts?.length ?? 0) === 0 ? (
            <div className="p-6 text-sm text-white/60">
              Zatím tu žádný trénink není.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

