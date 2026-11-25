"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "recovery_link_invalid") {
      setMode("forgot");
      setErrorMessage(
        "O link de recuperação expirou ou já foi utilizado. Informe seu e-mail para gerar um novo link."
      );
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function formatAuthError(message: string) {
    const lower = message.toLowerCase();
    if (lower.includes("email not confirmed")) {
      return "E-mail ainda não confirmado. Verifique sua caixa de entrada ou peça ao administrador para liberar o acesso.";
    }
    if (lower.includes("invalid login credentials")) {
      return "E-mail ou senha inválidos. Confira seus dados e tente novamente.";
    }
    if (lower.includes("user already registered")) {
      return "Este e-mail já está cadastrado. Clique em 'Já possui uma conta? Entrar'.";
    }
    if (lower.includes("password should be at least")) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }
    if (lower.includes("rate limit")) {
      return "Muitas tentativas seguidas. Aguarde alguns instantes e tente novamente.";
    }
    return `Erro ao autenticar: ${message}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (mode === "forgot") {
        const recoveryClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              flowType: "implicit",
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          }
        );

        const { error } = await recoveryClient.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

        if (error) {
          setErrorMessage(formatAuthError(error.message));
          return;
        }

        setSuccessMessage(
          "Enviamos um link de recuperação para o seu e-mail. Verifique sua caixa de entrada e a pasta de spam."
        );
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) {
          setErrorMessage(formatAuthError(error.message));
          return;
        }

        if (data.session) {
          setSuccessMessage("Conta criada com sucesso! Entrando...");
          router.push("/");
          router.refresh();
        } else {
          setSuccessMessage(
            "Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar."
          );
          setMode("login");
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setErrorMessage(formatAuthError(error.message));
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Gestão Solidária
          </CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {mode === "signup" && "Crie sua conta de voluntário ou administrador"}
            {mode === "login" && "Entre com suas credenciais para acessar o painel"}
            {mode === "forgot" && "Informe seu e-mail para receber o link de redefinição"}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ex: Maria da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-zinc-200 dark:border-zinc-800"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-zinc-200 dark:border-zinc-800"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-zinc-200 dark:border-zinc-800"
                />
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-400">
                {successMessage}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading
                ? "Processando..."
                : mode === "signup"
                ? "Criar conta"
                : mode === "forgot"
                ? "Enviar link de recuperação"
                : "Entrar no sistema"}
            </Button>
          </form>

          <div className="mt-4 flex flex-col items-center space-y-2 text-center">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline-offset-4 hover:underline"
              >
                Voltar para o login
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline-offset-4 hover:underline"
                >
                  {mode === "signup"
                    ? "Já possui uma conta? Entrar"
                    : "Não tem uma conta? Cadastre-se"}
                </button>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline-offset-4 hover:underline"
                  >
                    Esqueci a senha
                  </button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}