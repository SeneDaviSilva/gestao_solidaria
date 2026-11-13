"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAttendance } from "@/app/attendances/actions";

type BeneficiaryOption = { id: string; name: string };

export function AddAttendanceDialog({
  beneficiaries,
}: {
  beneficiaries: BeneficiaryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [beneficiaryId, setBeneficiaryId] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const description = formData.get("description");

    if (!beneficiaryId || !type) {
      toast.error("Selecione o assistido e o tipo de apoio.");
      return;
    }

    setLoading(true);

    try {
      const result = await createAttendance({
        beneficiary_id: beneficiaryId,
        type,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
      });

      if (!result.success) {
        toast.error("Falha ao registrar o atendimento.", {
          description: result.error,
        });
        return;
      }

      toast.success("Atendimento registrado", {
        description: "Entrega salva com sucesso.",
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Falha ao registrar o atendimento.", {
        description:
          error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setBeneficiaryId(null);
          setType(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="bg-zinc-900 text-white transition-colors hover:bg-zinc-800">
            <HeartHandshake className="mr-2 h-4 w-4" />
            Registrar Atendimento
          </Button>
        }
      />
      <DialogContent className="border-zinc-200 bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Atendimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="beneficiary_id">Assistido</Label>
            <Select
              id="beneficiary_id"
              name="beneficiary_id"
              required
              value={beneficiaryId}
              onValueChange={(value) =>
                setBeneficiaryId(typeof value === "string" ? value : null)
              }
            >
              <SelectTrigger className="w-full border-zinc-200">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {beneficiaries.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Apoio</Label>
            <Select
              id="type"
              name="type"
              required
              value={type}
              onValueChange={(value) =>
                setType(typeof value === "string" ? value : null)
              }
            >
              <SelectTrigger className="w-full border-zinc-200">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cesta Básica">Cesta Básica</SelectItem>
                <SelectItem value="Kits de Higiene">Kits de Higiene</SelectItem>
                <SelectItem value="Roupas/Cobertores">Roupas/Cobertores</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Observações adicionais (Opcional)</Label>
            <Input
              className="border-zinc-200"
              id="description"
              name="description"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button
              className="bg-zinc-900 text-white hover:bg-zinc-800"
              disabled={loading}
              type="submit"
            >
              {loading ? "Salvando..." : "Confirmar Entrega"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}