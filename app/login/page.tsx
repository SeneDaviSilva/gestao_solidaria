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
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const fullName = typeof name === "string" ? name.trim() : "";

    if (typeof email !== "string" || typeof password !== "string") {
      setErrorMessage("Informe seu e-mail e sua senha.");
      setLoading(false);
      return;
    }

    if (isSignUp && !fullName) {
      setErrorMessage("Informe seu nome completo.");
      setLoading(false);
      return;
    }

    if (isSignUp && password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) {
          const message =
            "Não foi possível criar a conta. Verifique o e-mail e se a senha tem pelo menos 6 caracteres.";
          setErrorMessage(message);
          toast.error(message);
          return;
        }

        if (data.session) {
          toast.success("Conta criada com sucesso!");
          router.push("/");
          router.refresh();
          return;
        }

        if (data.user) {
          toast.success(
            "Conta criada. Verifique seu e-mail para confirmar o cadastro.",
          );
          setIsSignUp(false);
          return;
        }

        const message = "Não foi possível confirmar a criação da conta.";
        setErrorMessage(message);
        toast.error(message);
        return;
      }

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
      const message = isSignUp
        ? "Não foi possível criar a conta. Tente novamente."
        : error instanceof Error
          ? error.message
          : "Não foi possível entrar. Tente novamente.";
      setErrorMessage(message);
      toast.error(
        isSignUp ? "Não foi possível criar a conta." : "Não foi possível entrar.",
        { description: message },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-xl">
            {isSignUp ? "Criar nova conta" : "Entrar no sistema"}
          </CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isSignUp
              ? "Preencha seus dados para criar uma conta."
              : "Gestão Solidária"}
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  autoComplete="name"
                  className="border-zinc-200 dark:border-zinc-700"
                  id="name"
                  name="name"
                  required
                  type="text"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                autoComplete="email"
                className="border-zinc-200 dark:border-zinc-700"
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
                className="border-zinc-200 dark:border-zinc-700"
                id="password"
                name="password"
                minLength={isSignUp ? 6 : undefined}
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
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              disabled={loading}
              type="submit"
            >
              {loading
                ? isSignUp
                  ? "Criando conta..."
                  : "Entrando..."
                : isSignUp
                  ? "Criar conta"
                  : "Entrar"}
            </Button>
            <Button
              className="w-full"
              disabled={loading}
              onClick={() => {
                setIsSignUp((current) => !current);
                setErrorMessage(null);
              }}
              type="button"
              variant="link"
            >
              {isSignUp
                ? "Já possui uma conta? Entrar"
                : "Não tem uma conta? Cadastre-se"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
