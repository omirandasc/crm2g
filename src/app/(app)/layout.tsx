import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { PERFIS, type PerfilAcesso } from "@/lib/dominio";
import { sair } from "@/app/login/actions";
import { LogOut } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nome, email, perfil, status")
    .eq("id", user.id)
    .single();

  if (!perfil || perfil.status !== "ativo") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar perfil={perfil.perfil} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-linha bg-cartao flex items-center justify-between px-6">
          <div className="md:hidden font-display font-semibold">CRM DOISGE</div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{perfil.nome}</p>
              <p className="text-xs text-tinta-fraca leading-tight">
                {PERFIS[perfil.perfil as PerfilAcesso] ?? perfil.perfil}
              </p>
            </div>
            <form action={sair}>
              <button
                type="submit"
                title="Sair"
                className="grid place-items-center h-9 w-9 rounded-md border border-linha hover:bg-papel text-tinta-suave transition-colors"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
