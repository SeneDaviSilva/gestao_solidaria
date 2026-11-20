"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Beneficiary } from "@/utils/supabase/beneficiaries";
import { normalizeText } from "@/utils/normalizeText";
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
    .select("id, name, contact, category, created_at, created_by_name")
    .is("deleted_at", null);

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

export async function createBeneficiariesBulk(
  items: { name: string; contact?: string; category: string }[],
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      success: false,
      count: 0,
      error: "Nenhum assistido foi informado para importação.",
    };
  }

  const candidates = items.filter(
    (item) =>
      item &&
      typeof item.name === "string" &&
      item.name.trim().length > 0,
  );
  if (candidates.length === 0) {
    return {
      success: false,
      count: 0,
      error: "Nenhuma linha contém um nome válido.",
    };
  }

  const supabase = await createClient();
  const { data: supportTypeRows, error: supportTypesError } = await supabase
    .from("support_types")
    .select("name")
    .is("deleted_at", null);

  if (supportTypesError) {
    return {
      success: false,
      count: 0,
      error: `Não foi possível validar as categorias: ${supportTypesError.message}`,
    };
  }

  const supportTypeNames = (supportTypeRows ?? [])
    .map(({ name }) => name)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.trim().length > 0,
    );
  const supportTypesByName = new Map(
    supportTypeNames.map((name) => [normalizeText(name), name]),
  );
  const fallbackCategory =
    supportTypesByName.get("geral") ?? supportTypesByName.get("outros");
  const rows = candidates.flatMap((item) => {
    const category =
      typeof item.category === "string"
        ? supportTypesByName.get(normalizeText(item.category)) ??
          fallbackCategory
        : fallbackCategory;

    if (!category) {
      return [];
    }

    const contact =
      typeof item.contact === "string"
        ? item.contact.replace(/\D/g, "").slice(0, 11)
        : "";

    return [
      {
        name: item.name.trim(),
        contact: contact || null,
        category,
      },
    ];
  });

  if (rows.length === 0) {
    return {
      success: false,
      count: 0,
      error:
        'Não há uma categoria válida. Cadastre "Geral" ou "Outros" em Tipos de Apoio.',
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const createdByName =
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const { error } = await supabase.from("beneficiaries").insert(
    rows.map((row) => ({
      ...row,
      created_by_name: createdByName,
    })),
  );

  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  revalidatePath("/beneficiaries");
  revalidatePath("/");
  return { success: true, count: rows.length };
}

export async function deleteBeneficiary(
  id: string,
): Promise<{ success: boolean }> {
  if (!id.trim()) {
    return { success: false };
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error: beneficiaryError } = await supabase
    .from("beneficiaries")
    .update({ deleted_at: deletedAt })
    .eq("id", id)
    .is("deleted_at", null);

  if (beneficiaryError) {
    return { success: false };
  }

  const { error: attendanceError } = await supabase
    .from("attendances")
    .update({ deleted_at: deletedAt })
    .eq("beneficiary_id", id)
    .is("deleted_at", null);

  if (attendanceError) {
    return { success: false };
  }

  revalidatePath("/beneficiaries");
  revalidatePath("/attendances");
  revalidatePath("/history");
  revalidatePath("/");
  revalidatePath("/trash");
  return { success: true };
}
