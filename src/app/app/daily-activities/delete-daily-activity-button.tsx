"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { IconTrash } from "@/components/workout-icons";

import { deleteDailyActivity } from "./actions";

export function DeleteDailyActivityButton({
  activityId,
  label,
}: {
  activityId: string;
  label: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(`Smazat aktivitu „${label}“?`)) return;
        startTransition(() => {
          void deleteDailyActivity(activityId).then(() => router.refresh());
        });
      }}
      className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/30 text-rose-300/90 hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Smazat aktivitu"
      title="Smazat"
    >
      <IconTrash className="h-3.5 w-3.5" />
    </button>
  );
}
