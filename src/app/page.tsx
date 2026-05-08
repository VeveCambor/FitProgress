import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <main className="w-full max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_80px_rgba(0,0,0,0.55)]">
          <div className="text-sm font-medium text-indigo-200/80">
            FitProgress
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Tréninkový deník a progres.
          </h1>
          <p className="mt-3 text-base text-white/60">
            Zapisuj tréninky, sleduj PR, objem a týdenní přehledy. Přihlášení je
            zatím přes magic link.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
              href="/login"
            >
              Přihlásit se
            </Link>
            <Link
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-black/30 px-5 text-sm font-semibold text-white/80 hover:bg-black/40"
              href="/app"
            >
              Přejít do appky
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
