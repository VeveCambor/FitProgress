"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { IconPencil } from "@/components/workout-icons";

import { updateWorkoutSetGroup } from "../actions";

type Rep = {
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  notes: string | null;
};

export function SetRunEditor({
  workoutId,
  setIds,
  setCount,
  representative,
}: {
  workoutId: string;
  setIds: string[];
  setCount: number;
  representative: Rep;
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
        aria-label="Upravit blok sérií"
        title="Upravit"
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
            aria-labelledby="edit-block-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3
              id="edit-block-title"
              className="text-base font-semibold text-white"
            >
              Upravit blok
            </h3>
            <p className="mt-1 text-xs text-white/50">
              Změny se uloží ke všem sériím v tomto bloku.
            </p>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(() => {
                  void updateWorkoutSetGroup(workoutId, fd).then(() => {
                    setOpen(false);
                    router.refresh();
                  });
                });
              }}
            >
              {setIds.map((id) => (
                <input key={id} type="hidden" name="set_id" value={id} />
              ))}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label
                    className="text-xs font-medium text-white/70"
                    htmlFor={`set_count_${setIds[0]}`}
                  >
                    Počet sérií
                  </label>
                  <input
                    id={`set_count_${setIds[0]}`}
                    name="set_count"
                    type="number"
                    min={1}
                    max={50}
                    defaultValue={setCount}
                    className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-medium text-white/70"
                    htmlFor={`reps_${setIds[0]}`}
                  >
                    Opak.
                  </label>
                  <input
                    id={`reps_${setIds[0]}`}
                    name="reps"
                    type="number"
                    inputMode="numeric"
                    defaultValue={representative.reps ?? ""}
                    placeholder="10"
                    className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-medium text-white/70"
                    htmlFor={`kg_${setIds[0]}`}
                  >
                    Kg
                  </label>
                  <input
                    id={`kg_${setIds[0]}`}
                    name="weight_kg"
                    type="text"
                    inputMode="decimal"
                    defaultValue={representative.weight_kg ?? ""}
                    placeholder="40"
                    className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-medium text-white/70"
                  htmlFor={`rpe_${setIds[0]}`}
                >
                  RPE (volitelné)
                </label>
                <input
                  id={`rpe_${setIds[0]}`}
                  name="rpe"
                  type="text"
                  inputMode="decimal"
                  defaultValue={representative.rpe ?? ""}
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-medium text-white/70"
                  htmlFor={`notes_${setIds[0]}`}
                >
                  Poznámka
                </label>
                <input
                  id={`notes_${setIds[0]}`}
                  name="notes"
                  type="text"
                  defaultValue={representative.notes ?? ""}
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-2 text-sm outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-500/30"
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
