import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { BuscaGlobal } from "@/components/busca-global";
import { MenuUsuario } from "@/components/menu-usuario";
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
          <div className="md:hidden font-display font-semibold">CRM DOISGE</div>
          <BuscaGlobal />
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
