"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function createExercise(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const primaryMuscle = String(formData.get("primary_muscle") ?? "").trim();
  const equipment = String(formData.get("equipment") ?? "").trim();

  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("exercises").insert({
    user_id: user.id,
    name,
    primary_muscle: primaryMuscle || null,
    equipment: equipment || null,
  });

  revalidatePath("/app/exercises");
}

