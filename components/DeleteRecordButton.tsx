"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteRecordButton({
  id,
  onDelete,
  confirmMessage,
}: {
  id: string;
  onDelete: (id: string) => Promise<{ success: boolean }>;
  confirmMessage: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeleting(true);
    try {
      const result = await onDelete(id);
      if (!result.success) {
        toast.error("Não foi possível excluir o registro.");
        return;
      }

      toast.success("Registro excluído com sucesso");
      router.refresh();
    } catch (error) {
      toast.error("Não foi possível excluir o registro.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      aria-label="Excluir registro"
      className="text-zinc-500 hover:bg-red-50 hover:text-red-600"
      disabled={deleting}
      onClick={() => void handleDelete()}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
