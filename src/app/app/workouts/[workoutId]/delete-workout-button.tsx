"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { IconTrash } from "@/components/workout-icons";

import { deleteWorkout } from "../actions";

export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            "Opravdu smazat celý trénink včetně všech sérií? Tuto akci nelze vrátit."
          )
        ) {
          return;
        }
        startTransition(() => {
          void deleteWorkout(workoutId).then(() => {
            router.push("/app/workouts");
            router.refresh();
          });
        });
      }}
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/30 text-rose-300/90 hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Smazat trénink"
      title="Smazat trénink"
    >
      <IconTrash className="h-4 w-4" />
    </button>
  );
}
