"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      setErrorMessage("Informe seu e-mail e sua senha.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const message = "E-mail ou senha inválidos. Confira seus dados e tente novamente.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível entrar. Tente novamente.";
      setErrorMessage(message);
      toast.error("Não foi possível entrar.", { description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Gestão Solidária</CardTitle>
          <p className="text-sm text-zinc-500">
            Entre com seu e-mail e senha para continuar.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                autoComplete="email"
                className="border-zinc-200"
                id="email"
                name="email"
                required
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                autoComplete="current-password"
                className="border-zinc-200"
                id="password"
                name="password"
                required
                type="password"
              />
            </div>
            {errorMessage && (
              <p aria-live="polite" className="text-sm text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
            <Button
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
              disabled={loading}
              type="submit"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
