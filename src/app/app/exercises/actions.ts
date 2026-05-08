"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function revalidateExerciseDependents() {
  revalidatePath("/app/exercises");
  revalidatePath("/app/workouts");
  revalidatePath("/app/progress");
}

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

  const { error } = await supabase.from("exercises").insert({
    user_id: user.id,
    name,
    primary_muscle: primaryMuscle || null,
    equipment: equipment || null,
  });

  if (error) {
    redirect(
      `/app/exercises?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidateExerciseDependents();
}

export async function updateExercise(exerciseId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const primaryMuscle = String(formData.get("primary_muscle") ?? "").trim();
  const equipment = String(formData.get("equipment") ?? "").trim();

  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/exercises");

  const { error } = await supabase
    .from("exercises")
    .update({
      name,
      primary_muscle: primaryMuscle || null,
      equipment: equipment || null,
    })
    .eq("id", exerciseId)
    .eq("user_id", user.id);

  if (error) {
    redirect(
      `/app/exercises?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidateExerciseDependents();
}

export async function deleteExercise(exerciseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/exercises");

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", user.id);

  if (error) {
    const msg =
      error.code === "23503"
        ? "Cvik nelze smazat — používá se v historii tréninků."
        : error.message;
    redirect(`/app/exercises?error=${encodeURIComponent(msg)}`);
  }

  revalidateExerciseDependents();
}

