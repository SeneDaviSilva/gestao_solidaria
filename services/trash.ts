"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type TrashBeneficiary = {
  id: string;
  name: string;
  contact: string | null;
  category: string | null;
  deleted_at: string;
};

export type TrashAttendance = {
  id: string;
  type: string;
  description: string | null;
  date: string;
  deleted_at: string;
  created_by_name: string | null;
  beneficiaries?: { name: string } | { name: string }[] | null;
};

export type TrashSupportType = {
  id: string;
  name: string;
  deleted_at: string;
};

export type TrashItems = {
  beneficiaries: TrashBeneficiary[];
  attendances: TrashAttendance[];
  supportTypes: TrashSupportType[];
};

function revalidateTrashRoutes() {
  revalidatePath("/");
  revalidatePath("/beneficiaries");
  revalidatePath("/attendances");
  revalidatePath("/history");
  revalidatePath("/settings");
  revalidatePath("/trash");
}

export async function getTrashItems(): Promise<TrashItems> {
  const supabase = await createClient();
  const [beneficiaries, attendances, supportTypes] = await Promise.all([
    supabase
      .from("beneficiaries")
      .select("id, name, contact, category, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("attendances")
      .select(
        "id, type, description, date, deleted_at, created_by_name, beneficiaries(name)",
      )
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    supabase
      .from("support_types")
      .select("id, name, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  return {
    beneficiaries: (beneficiaries.data ?? []) as TrashBeneficiary[],
    attendances: (attendances.data ?? []) as TrashAttendance[],
    supportTypes: (supportTypes.data ?? []) as TrashSupportType[],
  };
}

export async function restoreTrashItem(
  type: "beneficiary" | "attendance" | "support_type",
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const table =
    type === "beneficiary"
      ? "beneficiaries"
      : type === "attendance"
        ? "attendances"
        : "support_types";

  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  if (type === "beneficiary") {
    const { error: attendanceError } = await supabase
      .from("attendances")
      .update({ deleted_at: null })
      .eq("beneficiary_id", id)
      .not("deleted_at", "is", null);

    if (attendanceError) {
      return { success: false, error: attendanceError.message };
    }
  }

  revalidateTrashRoutes();
  return { success: true };
}

export async function permanentDeleteTrashItem(
  type: "beneficiary" | "attendance" | "support_type",
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const table =
    type === "beneficiary"
      ? "beneficiaries"
      : type === "attendance"
        ? "attendances"
        : "support_types";

  if (type === "beneficiary") {
    const attendanceResult = await supabase
      .from("attendances")
      .delete()
      .eq("beneficiary_id", id)
      .not("deleted_at", "is", null);
    if (attendanceResult.error) {
      return { success: false, error: attendanceResult.error.message };
    }
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateTrashRoutes();
  return { success: true };
}

export async function emptyTrash(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const attendanceResult = await supabase
    .from("attendances")
    .delete()
    .not("deleted_at", "is", null);
  if (attendanceResult.error) {
    return { success: false, error: attendanceResult.error.message };
  }

  const beneficiaryResult = await supabase
    .from("beneficiaries")
    .delete()
    .not("deleted_at", "is", null);
  if (beneficiaryResult.error) {
    return { success: false, error: beneficiaryResult.error.message };
  }

  const supportTypeResult = await supabase
    .from("support_types")
    .delete()
    .not("deleted_at", "is", null);
  if (supportTypeResult.error) {
    return { success: false, error: supportTypeResult.error.message };
  }

  revalidateTrashRoutes();
  return { success: true };
}
