"use server";

import { createBeneficiary as createBeneficiaryRecord } from "@/services/beneficiaries";
import type { Beneficiary } from "@/utils/supabase/beneficiaries";

type BeneficiaryInput = Pick<Beneficiary, "name" | "contact" | "category">;

export async function createBeneficiary(data: BeneficiaryInput) {
  return createBeneficiaryRecord(data);
}
