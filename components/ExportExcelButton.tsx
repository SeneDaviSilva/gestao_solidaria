"use client";

import * as XLSX from "xlsx";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportExcelButton({
  data,
  fileName,
  sheetName,
}: {
  data: Record<string, unknown>[];
  fileName: string;
  sheetName: string;
}) {
  function exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const headers = Object.keys(data[0] ?? {});
    worksheet["!cols"] = headers.map((header) => {
      const maxContentLength = data.reduce(
        (max, row) => Math.max(max, String(row[header] ?? "").length),
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
