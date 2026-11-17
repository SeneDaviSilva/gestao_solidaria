"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type SupportType = {
  id: string;
  name: string;
};

export async function getSupportTypes(): Promise<SupportType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("support_types")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Não foi possível carregar os tipos de apoio: ${error.message}`);
  }

  return (data ?? []) as SupportType[];
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

  revalidatePath("/beneficiaries");
  revalidatePath("/attendances");
  return { success: true, data: data as SupportType };
}
