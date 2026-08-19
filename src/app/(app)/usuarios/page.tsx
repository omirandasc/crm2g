import { createClient } from "@/lib/supabase/server";
import {
  UsuariosCliente,
  type UsuarioLinha,
} from "@/components/usuarios/usuarios-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export const metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  const supabase = await createClient();

  const [{ data: usuarios }, { data: empresas }, { data: parceiros }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, nome, email, perfil, status, empresa_portfolio_id, parceiro_rede_id, empresas_portfolio ( nome_fantasia, razao_social ), parceiros_rede ( nome_fantasia, razao_social )"
        )
        .order("nome"),
      supabase.from("empresas_portfolio").select("id, razao_social, nome_fantasia").order("razao_social"),
      supabase.from("parceiros_rede").select("id, razao_social, nome_fantasia").order("razao_social"),
    ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acessos ao CRM por perfil: Governança, Portfólio e Rede.
        </p>
      </div>

      <UsuariosCliente
        usuarios={(usuarios ?? []) as unknown as UsuarioLinha[]}
        empresas={(empresas ?? []).map((e) => ({
          id: e.id,
          rotulo: e.nome_fantasia || e.razao_social,
        })) as Opcao[]}
        parceiros={(parceiros ?? []).map((p) => ({
          id: p.id,
          rotulo: p.nome_fantasia || p.razao_social,
        })) as Opcao[]}
      />
    </div>
  );
}
