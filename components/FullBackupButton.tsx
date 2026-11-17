"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getFullBackupData } from "@/services/settings";
import { getOrganizationHeaderRows } from "@/utils/excel";

function setColumnWidths(
  worksheet: XLSX.WorkSheet,
  headers: string[],
  records: (string | number | boolean)[][],
) {
  worksheet["!cols"] = headers.map((header, columnIndex) => {
    const maxLength = records.reduce(
      (max, row) =>
        Math.max(max, String(row[columnIndex] ?? "").length),
      header.length,
    );
    return { wch: Math.min(40, Math.max(maxLength, 12)) };
  });
}

export function FullBackupButton() {
  const [loading, setLoading] = useState(false);

  async function downloadBackup() {
    setLoading(true);
    try {
      const { beneficiaries, attendances, orgSettings } =
        await getFullBackupData();
      const beneficiaryHeaders = [
        "Nome",
        "Contato (WhatsApp)",
        "Categoria",
        "Data de Cadastro",
        "Registrado por",
      ];
      const attendanceHeaders = [
        "Assistido",
        "Tipo de Apoio",
        "Observações",
        "Data",
        "Registrado por",
      ];
      const beneficiaryRows = beneficiaries.map((person) => [
        person.name,
        person.contact ?? "",
        person.category ?? "",
        new Date(person.created_at).toLocaleDateString("pt-BR"),
        person.created_by_name || "Sistema",
      ]);
      const attendanceRows = attendances.map((record) => [
        record.beneficiaries?.name ?? "",
        record.type,
        record.description ?? "",
        new Date(record.date).toLocaleDateString("pt-BR"),
        record.created_by_name || "Sistema",
      ]);
      const beneficiarySheetRows = [
        ...getOrganizationHeaderRows(orgSettings),
        beneficiaryHeaders,
        ...beneficiaryRows,
      ];
      const attendanceSheetRows = [
        ...getOrganizationHeaderRows(orgSettings),
        attendanceHeaders,
        ...attendanceRows,
      ];
      const beneficiarySheet = XLSX.utils.aoa_to_sheet([
        ...beneficiarySheetRows,
      ]);
      const attendanceSheet = XLSX.utils.aoa_to_sheet([
        ...attendanceSheetRows,
      ]);
      setColumnWidths(
        beneficiarySheet,
        beneficiaryHeaders,
        beneficiarySheetRows,
      );
      setColumnWidths(
        attendanceSheet,
        attendanceHeaders,
        attendanceSheetRows,
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, beneficiarySheet, "Assistidos");
      XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Atendimentos");
      XLSX.writeFile(
        workbook,
        `backup-gestao-solidaria-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success("Backup geral baixado com sucesso.");
    } catch (error) {
      toast.error("Não foi possível gerar o backup.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      disabled={loading}
      onClick={downloadBackup}
      type="button"
      variant="outline"
    >
      {loading ? (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="mr-2 h-4 w-4" />
      )}
      {loading ? "Gerando backup..." : "Baixar Backup Completo (.xlsx)"}
    </Button>
  );
}
