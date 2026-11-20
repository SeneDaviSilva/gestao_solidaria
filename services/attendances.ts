"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type { Attendance } from "@/utils/supabase/attendances";
import { normalizeText } from "@/utils/normalizeText";
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
      "id, beneficiary_id, type, description, date, created_at, created_by_name, beneficiaries ( name )",
    )
    .is("deleted_at", null);

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

export async function createAttendancesBulk(
  items: {
    beneficiary_id: string;
    type: string;
    description?: string;
  }[],
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      success: false,
      count: 0,
      error: "Nenhum atendimento foi informado para importação.",
    };
  }

  const candidates = items.filter(
    (item) =>
      item &&
      typeof item.beneficiary_id === "string" &&
      item.beneficiary_id.trim().length > 0 &&
      typeof item.type === "string" &&
      item.type.trim().length > 0,
  );
  const beneficiaryIds = [
    ...new Set(candidates.map((item) => item.beneficiary_id.trim())),
  ];

  if (beneficiaryIds.length === 0) {
    return {
      success: false,
      count: 0,
      error: "Nenhuma linha contém um assistido e um tipo válidos.",
    };
  }

  const supabase = await createClient();
  const [beneficiaryResult, supportTypeResult] = await Promise.all([
    supabase
      .from("beneficiaries")
      .select("id")
      .in("id", beneficiaryIds)
      .is("deleted_at", null),
    supabase
      .from("support_types")
      .select("name")
      .is("deleted_at", null),
  ]);

  if (beneficiaryResult.error) {
    return {
      success: false,
      count: 0,
      error: `Não foi possível validar os assistidos: ${beneficiaryResult.error.message}`,
    };
  }
  if (supportTypeResult.error) {
    return {
      success: false,
      count: 0,
      error: `Não foi possível validar os tipos de apoio: ${supportTypeResult.error.message}`,
    };
  }

  const validBeneficiaryIds = new Set(
    (beneficiaryResult.data ?? []).map(({ id }) => id),
  );
  const supportTypeNames = (supportTypeResult.data ?? [])
    .map(({ name }) => name)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.trim().length > 0,
    );
  const supportTypesByName = new Map(
    supportTypeNames.map((name) => [normalizeText(name), name]),
  );
  const fallbackType = supportTypesByName.get("outros");
  const rows = candidates.flatMap((item) => {
    const beneficiaryId = item.beneficiary_id.trim();
    const type =
      supportTypesByName.get(normalizeText(item.type)) ?? fallbackType;

    if (!validBeneficiaryIds.has(beneficiaryId) || !type) {
      return [];
    }

    return [
      {
        beneficiary_id: beneficiaryId,
        type,
        description:
          typeof item.description === "string" && item.description.trim()
            ? item.description.trim()
            : null,
      },
    ];
  });

  if (rows.length === 0) {
    return {
      success: false,
      count: 0,
      error:
        'Nenhuma linha válida. Verifique os assistidos e cadastre "Outros" em Tipos de Apoio para usar o fallback.',
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const createdByName =
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const { error } = await supabase.from("attendances").insert(
    rows.map((row) => ({
      ...row,
      created_by_name: createdByName,
    })),
  );

  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  revalidatePath("/attendances");
  revalidatePath("/history");
  revalidatePath("/");
  revalidatePath("/trash");
  return { success: true, count: rows.length };
}

export async function deleteAttendance(
  id: string,
): Promise<{ success: boolean }> {
  if (!id.trim()) {
    return { success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("attendances")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return { success: false };
  }

  revalidatePath("/attendances");
  revalidatePath("/history");
  revalidatePath("/");
  revalidatePath("/trash");
  return { success: true };
}
