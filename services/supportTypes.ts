"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { sortSupportTypes } from "@/utils/supportTypes";

export type SupportType = {
  id: string;
  name: string;
};

function revalidateSupportTypePaths() {
  revalidatePath("/settings");
  revalidatePath("/beneficiaries");
  revalidatePath("/attendances");
}

export async function getSupportTypes(): Promise<SupportType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_types")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Não foi possível carregar os tipos de apoio: ${error.message}`);
  }

  return sortSupportTypes((data ?? []) as SupportType[]);
}

export async function createSupportType(
  name: string,
): Promise<{
  success: boolean;
  data?: SupportType;
  error?: string;
}> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: "Informe o nome do tipo de apoio." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_types")
    .insert({ name: trimmedName })
    .select("id, name")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data) {
    return {
      success: false,
      error: "O tipo de apoio foi salvo, mas não foi possível recuperá-lo.",
    };
  }

  revalidateSupportTypePaths();
  return { success: true, data: data as SupportType };
}

export async function updateSupportType(
  id: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  const trimmedId = id.trim();
  const trimmedName = name.trim();
  if (!trimmedId) {
    return { success: false, error: "Tipo de apoio inválido." };
  }
  if (!trimmedName) {
    return { success: false, error: "Informe o nome do tipo de apoio." };
  }

  const supabase = await createClient();
  const { data: currentType, error: lookupError } = await supabase
    .from("support_types")
    .select("name")
    .eq("id", trimmedId)
    .maybeSingle();

  if (lookupError) {
    return { success: false, error: lookupError.message };
  }
  if (!currentType) {
    return { success: false, error: "Tipo de apoio não encontrado." };
  }
  if (currentType.name.trim().toLocaleLowerCase("pt-BR") === "outros") {
    return {
      success: false,
      error: "O tipo de apoio padrão “Outros” não pode ser editado.",
    };
  }

  const { data, error } = await supabase
    .from("support_types")
    .update({ name: trimmedName })
    .eq("id", trimmedId)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data) {
    return { success: false, error: "Tipo de apoio não encontrado." };
  }

  revalidateSupportTypePaths();
  return { success: true };
}

export async function deleteSupportType(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    return { success: false, error: "Tipo de apoio inválido." };
  }

  const supabase = await createClient();
  const { data: supportType, error: lookupError } = await supabase
    .from("support_types")
    .select("name")
    .eq("id", trimmedId)
    .maybeSingle();

  if (lookupError) {
    return { success: false, error: lookupError.message };
  }
  if (!supportType) {
    return { success: false, error: "Tipo de apoio não encontrado." };
  }
  if (supportType.name.trim().toLocaleLowerCase("pt-BR") === "outros") {
    return {
      success: false,
      error: "O tipo de apoio “Outros” não pode ser excluído.",
    };
  }

  const { error } = await supabase
    .from("support_types")
    .delete()
    .eq("id", trimmedId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateSupportTypePaths();
  return { success: true };
}
