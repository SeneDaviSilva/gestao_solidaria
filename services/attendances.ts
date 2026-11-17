"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Attendance } from "@/utils/supabase/attendances";
import type { SortBy, SortOrder } from "@/utils/sorting";

type AttendanceInput = Pick<
  Attendance,
  "beneficiary_id" | "type" | "description"
>;

export async function getAttendances(
  searchQuery?: string,
  filterType?: string,
  sortBy: SortBy = "created_at",
  sortOrder: SortOrder = "desc",
): Promise<Attendance[]> {
  const supabase = await createClient();
  let request = supabase
    .from("attendances")
    .select(
      "id, beneficiary_id, type, description, date, created_at, created_by_name, beneficiaries!inner ( name )",
    );

  if (searchQuery) {
    request = request.ilike("beneficiaries.name", `%${searchQuery}%`);
  }
  if (filterType && filterType !== "all") {
    request = request.eq("type", filterType);
  }

  const { data, error } = await request;
  if (error) {
    return [];
  }

  const attendances: Attendance[] = (data ?? []).map((record) => {
    const beneficiary = Array.isArray(record.beneficiaries)
      ? record.beneficiaries[0]
      : record.beneficiaries;

    return {
      ...record,
      beneficiaries: beneficiary ? { name: beneficiary.name } : undefined,
    };
  });
  const direction = sortOrder === "asc" ? 1 : -1;

  return attendances.sort((first, second) => {
    if (sortBy === "name") {
      return (first.beneficiaries?.name ?? "").localeCompare(
        second.beneficiaries?.name ?? "",
        "pt-BR",
        { sensitivity: "base" },
      ) * direction;
    }

    if (sortBy === "category") {
      return first.type.localeCompare(second.type, "pt-BR", {
        sensitivity: "base",
      }) * direction;
    }

    const firstTimestamp = Date.parse(
      sortBy === "date" ? first.date : first.created_at,
    );
    const secondTimestamp = Date.parse(
      sortBy === "date" ? second.date : second.created_at,
    );
    const comparison =
      Number.isNaN(firstTimestamp) || Number.isNaN(secondTimestamp)
        ? 0
        : firstTimestamp - secondTimestamp;
    return comparison * direction;
  });
}

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
