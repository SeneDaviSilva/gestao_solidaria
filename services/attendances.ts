"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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
