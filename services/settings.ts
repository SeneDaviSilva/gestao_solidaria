"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Attendance } from "@/utils/supabase/attendances";
import type { Beneficiary } from "@/utils/supabase/beneficiaries";

export type OrganizationSettings = {
  org_name: string;
  cnpj: string;
  city: string;
};

type BackupAttendance = Attendance & {
  beneficiaries?: { name: string } | null;
};

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_settings")
    .select("org_name, cnpj, city")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível carregar a identidade da ONG: ${error.message}`,
    );
  }

  return {
    org_name: data?.org_name ?? "",
    cnpj: data?.cnpj ?? "",
    city: data?.city ?? "",
  };
}

export async function updateOrganizationSettings(data: {
  org_name: string;
  cnpj: string;
  city: string;
}): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.from("organization_settings").upsert({
    id: 1,
    org_name: data.org_name.trim(),
    cnpj: data.cnpj.trim(),
    city: data.city.trim(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false };
  }

  revalidatePath("/settings");
  revalidatePath("/beneficiaries");
  revalidatePath("/attendances");
  return { success: true };
}

export async function getFullBackupData(): Promise<{
  beneficiaries: Beneficiary[];
  attendances: BackupAttendance[];
  orgSettings: OrganizationSettings;
}> {
  const supabase = await createClient();
  const [beneficiaryResult, attendanceResult, orgSettings] = await Promise.all([
    supabase
      .from("beneficiaries")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("attendances")
      .select("*, beneficiaries(name)")
      .order("date", { ascending: false }),
    getOrganizationSettings(),
  ]);

  if (beneficiaryResult.error) {
    throw new Error(
      `Não foi possível preparar o backup de assistidos: ${beneficiaryResult.error.message}`,
    );
  }
  if (attendanceResult.error) {
    throw new Error(
      `Não foi possível preparar o backup de atendimentos: ${attendanceResult.error.message}`,
    );
  }

  const attendances: BackupAttendance[] = (attendanceResult.data ?? []).map(
    (record) => {
      const beneficiary = Array.isArray(record.beneficiaries)
        ? record.beneficiaries[0]
        : record.beneficiaries;

      return {
        ...record,
        beneficiaries: beneficiary ? { name: beneficiary.name } : null,
      };
    },
  );

  return {
    beneficiaries: (beneficiaryResult.data ?? []) as Beneficiary[],
    attendances,
    orgSettings,
  };
}
