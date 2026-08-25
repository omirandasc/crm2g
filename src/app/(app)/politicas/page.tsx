import { createClient } from "@/lib/supabase/server";
import {
  PoliticasCliente,
  type PoliticaLinha,
} from "@/components/politicas/politicas-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import { ehDoisge } from "@/lib/dominio";

export const metadata = { title: "Políticas comerciais" };

export default async function PoliticasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: politicas }, { data: produtos }, { data: empresas }, { data: parceiros }] =
    await Promise.all([
      supabase.from("profiles").select("perfil").eq("id", user!.id).single(),
      supabase
        .from("politicas_comerciais")
        .select(
          "id, nome_politica, tipo_politica, produto_id, empresa_portfolio_id, parceiro_rede_id, descricao, data_inicio, data_fim, status, produtos ( nome_produto ), empresas_portfolio ( razao_social, nome_fantasia ), parceiros_rede ( razao_social, nome_fantasia )"
        )
        .order("created_at", { ascending: false }),
      supabase.from("produtos").select("id, nome_produto").order("nome_produto"),
      supabase
        .from("empresas_portfolio")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social"),
      supabase
        .from("parceiros_rede")
        .select("id, razao_social, nome_fantasia")
        .order("razao_social"),
    ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Políticas comerciais</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As regras do jogo: preço, comissão, território e proteção comercial,
          registradas e visíveis para quem participa.
        </p>
      </div>

      <PoliticasCliente
        politicas={(politicas ?? []) as unknown as PoliticaLinha[]}
        produtos={(produtos ?? []).map((p) => ({ id: p.id, rotulo: p.nome_produto })) as Opcao[]}
        empresas={(empresas ?? []).map((e) => ({
          id: e.id,
          rotulo: e.nome_fantasia || e.razao_social,
        })) as Opcao[]}
        parceiros={(parceiros ?? []).map((p) => ({
          id: p.id,
          rotulo: p.nome_fantasia || p.razao_social,
        })) as Opcao[]}
        podeEditar={ehDoisge(perfil?.perfil)}
      />
    </div>
  );
}
