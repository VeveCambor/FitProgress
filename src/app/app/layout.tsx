import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-indigo-500/40 to-fuchsia-500/30 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" />
            <div>
              <div className="text-sm font-medium text-indigo-200/80">
                FitProgress
              </div>
              <div className="text-xl font-semibold tracking-tight">App</div>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              href="/app"
            >
              Dashboard
            </Link>
            <Link
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              href="/app/exercises"
            >
              Cviky
            </Link>
            <form action="/auth/signout" method="post">
              <button
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-black/40"
                type="submit"
              >
                Odhlásit
              </button>
            </form>
          </nav>
        </header>

        <main className="mt-8">{children}</main>
      </div>
    </div>
  );
}

