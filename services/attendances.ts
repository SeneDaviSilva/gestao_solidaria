"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Attendance } from "@/utils/supabase/attendances";

type AttendanceInput = Pick<
  Attendance,
  "beneficiary_id" | "type" | "description"
>;

export async function createAttendance(
  data: AttendanceInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const createdByName =
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const { error } = await supabase.from("attendances").insert({
    ...data,
    created_by_name: createdByName,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteAttendance(
  id: string,
): Promise<{ success: boolean }> {
  if (!id.trim()) {
    return { success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("attendances").delete().eq("id", id);

  if (error) {
    return { success: false };
  }

  revalidatePath("/attendances");
  revalidatePath("/");
  return { success: true };
}
