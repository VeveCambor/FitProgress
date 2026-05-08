"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { IconTrash } from "@/components/workout-icons";

import { deleteExercise } from "./actions";

export function DeleteExerciseButton({
  exerciseId,
  exerciseName,
}: {
  exerciseId: string;
  exerciseName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            `Smazat cvik „${exerciseName}“? Pokud je v historii tréninků, smazat nepůjde.`
          )
        ) {
          return;
        }
        startTransition(() => {
          void deleteExercise(exerciseId).then(() => {
            router.refresh();
          });
        });
      }}
      className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/30 text-rose-300/90 hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={`Smazat cvik ${exerciseName}`}
      title="Smazat"
    >
      <IconTrash className="h-4 w-4" />
    </button>
  );
}
