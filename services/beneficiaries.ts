"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Beneficiary } from "@/utils/supabase/beneficiaries";
import type { SortBy, SortOrder } from "@/utils/sorting";

type BeneficiaryInput = Pick<Beneficiary, "name" | "contact" | "category">;

export async function getBeneficiaries(
  searchQuery?: string,
  sortBy: SortBy = "created_at",
  sortOrder: SortOrder = "desc",
): Promise<Beneficiary[]> {
  const supabase = await createClient();
  let request = supabase
    .from("beneficiaries")
    .select("id, name, contact, category, created_at, created_by_name");

  if (searchQuery) {
    request = request.ilike("name", `%${searchQuery}%`);
  }

  const { data, error } = await request;
  if (error) {
    return [];
  }

  const beneficiaries = (data ?? []) as Beneficiary[];
  const direction = sortOrder === "asc" ? 1 : -1;

  return beneficiaries.sort((first, second) => {
    if (sortBy === "name") {
      return first.name.localeCompare(second.name, "pt-BR", {
        sensitivity: "base",
      }) * direction;
    }

    if (sortBy === "category") {
      return (first.category ?? "").localeCompare(second.category ?? "", "pt-BR", {
        sensitivity: "base",
      }) * direction;
    }

    const firstDate = Date.parse(first.created_at);
    const secondDate = Date.parse(second.created_at);
    const comparison =
      Number.isNaN(firstDate) || Number.isNaN(secondDate)
        ? 0
        : firstDate - secondDate;
    return comparison * direction;
  });
}

export async function createBeneficiary(
  data: BeneficiaryInput,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const createdByName =
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const contact =
    typeof data.contact === "string"
      ? data.contact.replace(/\D/g, "").slice(0, 11)
      : "";

  const { error } = await supabase.from("beneficiaries").insert({
    ...data,
    contact: contact || null,
    created_by_name: createdByName,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteBeneficiary(
  id: string,
): Promise<{ success: boolean }> {
  if (!id.trim()) {
    return { success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("beneficiaries")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false };
  }

  revalidatePath("/beneficiaries");
  revalidatePath("/attendances");
  revalidatePath("/");
  return { success: true };
}
