"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AttendanceDetailsCellProps = {
  description?: string | null;
  beneficiaryName: string;
  type: string;
  date: string;
  createdByName?: string | null;
};

export function AttendanceDetailsCell({
  description,
  beneficiaryName,
  type,
  date,
  createdByName,
}: AttendanceDetailsCellProps) {
  const [open, setOpen] = useState(false);
  const text = description?.trim();

  if (!text) {
    return <span className="text-zinc-500 dark:text-zinc-400">—</span>;
  }

  const newlineCount = (text.match(/\n/g) ?? []).length;
  const showDetailsButton = text.length > 90 || newlineCount > 2;

  return (
    <div className="space-y-2">
      <p className="whitespace-pre-wrap break-words text-sm text-zinc-600 dark:text-zinc-300 min-w-[200px] max-w-md">
        {text}
      </p>
      {showDetailsButton && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button
                className="h-auto px-2 py-1 text-xs text-zinc-600 dark:text-zinc-300"
                variant="ghost"
              >
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                Ver detalhes
              </Button>
            }
          />
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Atendimento</DialogTitle>
            </DialogHeader>
            <dl className="grid gap-4 text-sm">
              <div className="grid grid-cols-[130px_1fr] gap-3">
                <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                  Assistido
                </dt>
                <dd>{beneficiaryName}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-3">
                <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                  Tipo de Apoio
                </dt>
                <dd>{type}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-3">
                <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                  Data
                </dt>
                <dd>{new Date(date).toLocaleDateString("pt-BR")}</dd>
              </div>
              <div className="grid grid-cols-[130px_1fr] gap-3">
                <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                  Responsável pelo registro
                </dt>
                <dd>{createdByName?.trim() || "Sistema"}</dd>
              </div>
              <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <dt className="font-medium text-zinc-500 dark:text-zinc-400">
                  Observações
                </dt>
                <dd className="whitespace-pre-wrap break-words">{text}</dd>
              </div>
            </dl>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
