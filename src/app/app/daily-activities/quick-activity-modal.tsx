"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { addDailyActivity } from "./actions";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function QuickActivityModal({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("walk");
  const [isPending, startTransition] = useTransition();

  const defaultDate = useMemo(() => todayISO(), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-linear-to-br from-cyan-500/30 to-fuchsia-500/25 text-xl font-light leading-none text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:from-cyan-500/40 hover:to-fuchsia-500/35 ${className}`}
        aria-label="Přidat denní aktivitu"
        title="Aktivita (mimo trénink)"
      >
        +
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0f1a] p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-act-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3
              id="quick-act-title"
              className="text-base font-semibold text-white"
            >
              Denní aktivita
            </h3>
            <p className="mt-1 text-xs text-white/50">
              Zapisuje se k datu — bez vazby na trénink v posilovně.
            </p>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(() => {
                  void addDailyActivity(fd).then(() => {
                    setOpen(false);
                    router.refresh();
                  });
                });
              }}
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor="qa-date"
                >
                  Den
                </label>
                <input
                  id="qa-date"
                  name="activity_date"
                  type="date"
                  required
                  defaultValue={defaultDate}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor="qa-kind"
                >
                  Aktivita
                </label>
                <select
                  id="qa-kind"
                  name="kind"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="walk">Procházka</option>
                  <option value="hike">Tůra</option>
                  <option value="run">Běh</option>
                  <option value="bike">Kolo</option>
                  <option value="swim">Plavání</option>
                  <option value="ski">Lyžování / běžky</option>
                  <option value="other">Jiné</option>
                </select>
              </div>

              {kind === "other" ? (
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-white/80"
                    htmlFor="qa-custom"
                  >
                    Název (jinde)
                  </label>
                  <input
                    id="qa-custom"
                    name="custom_label"
                    placeholder="např. jóga, brusle…"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor="qa-km"
                >
                  Vzdálenost (km, volitelné)
                </label>
                <input
                  id="qa-km"
                  name="distance_km"
                  inputMode="decimal"
                  placeholder="např. 8,5"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-white/80"
                    htmlFor="qa-dm"
                  >
                    Minuty
                  </label>
                  <input
                    id="qa-dm"
                    name="duration_min"
                    inputMode="numeric"
                    placeholder="0"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-white/80"
                    htmlFor="qa-ds"
                  >
                    Sekundy
                  </label>
                  <input
                    id="qa-ds"
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
                  htmlFor="qa-notes"
                >
                  Poznámka
                </label>
                <input
                  id="qa-notes"
                  name="notes"
                  placeholder="volitelné"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-xl border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="cursor-pointer rounded-xl bg-linear-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Ukládám…" : "Uložit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
