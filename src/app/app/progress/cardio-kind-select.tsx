"use client";

import { useRouter } from "next/navigation";

export function CardioKindSelect({ value }: { value: string }) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => {
        router.push(`/app/progress?tab=kardio&kind=${e.target.value}`);
      }}
      className="h-11 w-full max-w-md rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
      aria-label="Typ kardio aktivity"
    >
      <option value="walk">Chůze</option>
      <option value="run">Běh</option>
      <option value="bike">Kolo</option>
    </select>
  );
}
