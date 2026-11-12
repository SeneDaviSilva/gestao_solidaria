"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Não foi possível sair do sistema.");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium rounded-md text-zinc-600 hover:bg-red-50 hover:text-red-600 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sair do sistema
    </button>
  );
}
