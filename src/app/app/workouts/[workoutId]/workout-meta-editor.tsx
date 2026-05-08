"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { IconPencil } from "@/components/workout-icons";

import { updateWorkout } from "../actions";

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function WorkoutMetaEditor({
  workoutId,
  title,
  performedAtIso,
  notes,
}: {
  workoutId: string;
  title: string | null;
  performedAtIso: string;
  notes: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/30 text-white/75 hover:bg-black/45 hover:text-white"
        aria-label="Upravit trénink"
        title="Upravit název a datum"
      >
        <IconPencil className="h-4 w-4" />
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
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c0f1a] p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-workout-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3
              id="edit-workout-title"
              className="text-base font-semibold text-white"
            >
              Upravit trénink
            </h3>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(() => {
                  void updateWorkout(workoutId, fd).then(() => {
                    setOpen(false);
                    router.refresh();
                  });
                });
              }}
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor="wm-title"
                >
                  Název
                </label>
                <input
                  id="wm-title"
                  name="title"
                  defaultValue={title ?? ""}
                  placeholder="např. Push / Běh"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor="wm-date"
                >
                  Datum tréninku
                </label>
                <input
                  id="wm-date"
                  name="performed_at"
                  type="date"
                  required
                  defaultValue={toDateInputValue(performedAtIso)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor="wm-notes"
                >
                  Poznámky
                </label>
                <textarea
                  id="wm-notes"
                  name="notes"
                  rows={3}
                  defaultValue={notes ?? ""}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
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
