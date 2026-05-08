import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/app");

  return (
    <div className="min-h-dvh px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="text-sm text-white/60">Přihlášen jako</div>
          <div className="mt-1 text-lg font-semibold">{user.email}</div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="text-sm font-medium text-indigo-200/80">
              Další krok
            </div>
            <div className="mt-2 text-white/70">
              Teď přidáme databázové tabulky (cviky, tréninky, série) + první
              obrazovku pro zápis tréninku.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="text-sm font-medium text-indigo-200/80">Status</div>
            <div className="mt-2 text-white/70">
              Auth hotový, `/app` je chráněné.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

