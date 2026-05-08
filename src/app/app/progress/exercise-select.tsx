"use client";

import { useRouter } from "next/navigation";

export function ExerciseSelect({
  exercises,
  value,
}: {
  exercises: { id: string; name: string }[];
  value: string;
}) {
  const router = useRouter();

  if (exercises.length === 0) return null;

  return (
    <select
      value={value}
      onChange={(e) => {
        const id = e.target.value;
        router.push(id ? `/app/progress?exercise=${id}` : "/app/progress");
      }}
      className="h-11 w-full max-w-md rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-indigo-400/40 focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
      aria-label="Vybrat cvik"
    >
      {exercises.map((ex) => (
        <option key={ex.id} value={ex.id}>
          {ex.name}
        </option>
      ))}
    </select>
  );
}
