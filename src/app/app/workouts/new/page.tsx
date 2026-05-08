import { createWorkout } from "../actions";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewWorkoutPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <h1 className="text-xl font-semibold tracking-tight">Nový trénink</h1>
        <p className="mt-2 text-sm text-white/60">
          Vytvoř trénink, potom v detailu přidáš série.
        </p>

        <form action={createWorkout} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="title">
              Název (volitelné)
            </label>
            <input
              id="title"
              name="title"
              placeholder="např. Push"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/80"
                htmlFor="performed_at"
              >
                Datum
              </label>
              <input
                id="performed_at"
                name="performed_at"
                type="date"
                defaultValue={todayISO()}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80" htmlFor="notes">
              Poznámky (volitelné)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="např. cítil/a jsem se dobře, zkusit příště +2.5 kg…"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            className="h-11 w-full rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            type="submit"
          >
            Vytvořit trénink
          </button>
        </form>
      </section>
    </div>
  );
}

