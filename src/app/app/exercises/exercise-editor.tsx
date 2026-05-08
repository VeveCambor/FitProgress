"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { IconPencil } from "@/components/workout-icons";

import { updateExercise } from "./actions";

export function ExerciseEditor({
  exercise,
}: {
  exercise: {
    id: string;
    name: string;
    primary_muscle: string | null;
    equipment: string | null;
  };
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
        aria-label={`Upravit cvik ${exercise.name}`}
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
            aria-labelledby={`edit-ex-${exercise.id}`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3
              id={`edit-ex-${exercise.id}`}
              className="text-base font-semibold text-white"
            >
              Upravit cvik
            </h3>

            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(() => {
                  void updateExercise(exercise.id, fd).then(() => {
                    setOpen(false);
                    router.refresh();
                  });
                });
              }}
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-white/80"
                  htmlFor={`edit-name-${exercise.id}`}
                >
                  Název
                </label>
                <input
                  id={`edit-name-${exercise.id}`}
                  name="name"
                  required
                  defaultValue={exercise.name}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-white/80"
                    htmlFor={`edit-muscle-${exercise.id}`}
                  >
                    Sval
                  </label>
                  <input
                    id={`edit-muscle-${exercise.id}`}
                    name="primary_muscle"
                    defaultValue={exercise.primary_muscle ?? ""}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-white/80"
                    htmlFor={`edit-eq-${exercise.id}`}
                  >
                    Vybavení
                  </label>
                  <input
                    id={`edit-eq-${exercise.id}`}
                    name="equipment"
                    defaultValue={exercise.equipment ?? ""}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
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
