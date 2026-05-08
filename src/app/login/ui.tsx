"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("password");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = useMemo(() => {
    if (isPending) return true;
    if (!isEmail(email)) return true;
    if (mode === "password") return password.length < 6;
    return false;
  }, [email, isPending, mode, password.length]);

  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setMode("password");
          }}
          className={`h-9 rounded-lg text-sm font-semibold transition ${
            mode === "password"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          Email + heslo
        </button>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            setMode("magic");
          }}
          className={`h-9 rounded-lg text-sm font-semibold transition ${
            mode === "magic"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          Magic link
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="např. ja@domena.cz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none ring-0 placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
          autoComplete="email"
        />
      </div>

      {mode === "password" ? (
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-white/80"
            htmlFor="password"
          >
            Heslo
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="min. 6 znaků"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none ring-0 placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
            autoComplete="current-password"
          />
        </div>
      ) : null}

      {mode === "password" ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={disabled}
            className="h-11 w-full rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-opacity disabled:opacity-40"
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const supabase = createClient();
                const { error } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                if (error) {
                  setMessage(error.message);
                  return;
                }
                router.push(next);
                router.refresh();
              });
            }}
          >
            Přihlásit
          </button>
          <button
            type="button"
            disabled={disabled}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/30 text-sm font-semibold text-white/80 hover:bg-black/40 transition-opacity disabled:opacity-40"
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const supabase = createClient();
                const { error } = await supabase.auth.signUp({
                  email,
                  password,
                });
                if (error) {
                  setMessage(error.message);
                  return;
                }
                setMessage(
                  "Účet vytvořen. Pokud máš v Supabase zapnuté potvrzení emailu, potvrď ho; jinak se můžeš rovnou přihlásit."
                );
              });
            }}
          >
            Registrovat
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          className="h-11 w-full rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-opacity disabled:opacity-40"
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const supabase = createClient();
              const origin =
                typeof window !== "undefined" ? window.location.origin : "";

              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
                    next
                  )}`,
                },
              });

              if (error) {
                setMessage(error.message);
                return;
              }

              setMessage("Odkaz pro přihlášení byl odeslán na email.");
            });
          }}
        >
          Poslat přihlašovací odkaz
        </button>
      )}

      {message ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
          {message}
        </div>
      ) : null}
    </form>
  );
}

