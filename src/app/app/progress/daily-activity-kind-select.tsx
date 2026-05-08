"use client";

import { useRouter } from "next/navigation";

import { DAILY_ACTIVITY_KINDS, dailyActivityLabel } from "@/lib/daily-activity-labels";

export function DailyActivityKindSelect({ value }: { value: string }) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => {
        router.push(`/app/progress?tab=denni&dailyKind=${e.target.value}`);
      }}
      className="h-11 w-full max-w-md rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
      aria-label="Typ denní aktivity"
    >
      {DAILY_ACTIVITY_KINDS.map((k) => (
        <option key={k} value={k}>
          {dailyActivityLabel(k, null)}
        </option>
      ))}
    </select>
  );
}
