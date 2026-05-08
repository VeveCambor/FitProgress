import Link from "next/link";

import { LoginForm } from "./ui";

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_80px_rgba(0,0,0,0.5)]">
        <div className="mb-6">
          <div className="text-sm font-medium text-indigo-200/80">FitProgress</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Přihlášení
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Přihlas se přes email (magic link). Později můžeme přidat Google.
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 text-xs text-white/50">
          <Link className="underline hover:text-white/70" href="/">
            Zpět na úvod
          </Link>
        </div>
      </div>
    </div>
  );
}

