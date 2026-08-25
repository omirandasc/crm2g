import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { BuscaGlobal } from "@/components/busca-global";
import { MenuUsuario } from "@/components/menu-usuario";
import { AlternarTema } from "@/components/alternar-tema";
import { PERFIS, type PerfilAcesso } from "@/lib/dominio";
import { Toaster } from "@/components/ui/sonner";

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
        <header className="h-14 shrink-0 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between gap-3 px-4 lg:px-6 sticky top-0 z-40">
          <div className="md:hidden flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal-claro.png" alt="CRM DOISGE" className="h-5 w-auto dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal-escuro.png" alt="CRM DOISGE" className="hidden h-5 w-auto dark:block" />
          </div>
          <BuscaGlobal />
          <div className="flex items-center gap-1">
            <AlternarTema />
          </div>
          <MenuUsuario
            nome={perfil.nome}
            email={perfil.email}
            perfilRotulo={PERFIS[perfil.perfil as PerfilAcesso] ?? perfil.perfil}
          />
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
