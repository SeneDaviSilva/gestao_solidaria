"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Beneficiary } from "@/utils/supabase/beneficiaries";

type BeneficiaryInput = Pick<Beneficiary, "name" | "contact" | "category">;

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
