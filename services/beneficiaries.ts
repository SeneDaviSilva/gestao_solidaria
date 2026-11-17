"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  createBeneficiary as createBeneficiaryRecord,
  type Beneficiary,
} from "@/utils/supabase/beneficiaries";

type BeneficiaryInput = Pick<Beneficiary, "name" | "contact" | "category">;

export async function createBeneficiary(data: BeneficiaryInput) {
  const contact =
    typeof data.contact === "string"
      ? data.contact.replace(/\D/g, "").slice(0, 11)
      : "";

  return createBeneficiaryRecord({
    ...data,
    contact: contact || null,
  });
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
