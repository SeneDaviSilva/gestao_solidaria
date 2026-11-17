"use client";

import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getOrganizationHeaderRows,
  type OrganizationExcelSettings,
} from "@/utils/excel";

export function ExportExcelButton({
  data,
  fileName,
  sheetName,
  columns,
  orgSettings,
}: {
  data: Record<string, unknown>[];
  fileName: string;
  sheetName: string;
  columns?: string[];
  orgSettings?: OrganizationExcelSettings;
}) {
  function exportToExcel() {
    const headers = columns ?? Object.keys(data[0] ?? {});
    const rows = getOrganizationHeaderRows(orgSettings);
    if (headers.length > 0) {
      rows.push(headers);
      for (const record of data) {
        rows.push(
          headers.map((header) => {
            const value = record[header];
            return typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
              ? value
              : value == null
                ? ""
                : String(value);
          }),
        );
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = headers.map((header, columnIndex) => {
      const maxContentLength = rows.reduce(
        (max, row) =>
          Math.max(max, String(row[columnIndex] ?? "").length),
        header.length,
      );
      return { wch: Math.min(40, Math.max(maxContentLength, 12)) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  return (
    <Button onClick={exportToExcel} type="button" variant="outline">
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Extrair para Planilha
    </Button>
  );
}
