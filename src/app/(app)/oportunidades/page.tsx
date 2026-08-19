import { createClient } from "@/lib/supabase/server";
import {
  FunilCliente,
  type OportunidadeLinha,
} from "@/components/oportunidades/funil-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export const metadata = { title: "Funil de vendas" };

export default async function OportunidadesPage() {
  const supabase = await createClient();

  const [{ data: oportunidades }, { data: produtos }, { data: parceiros }] =
    await Promise.all([
      supabase
        .from("oportunidades")
        .select(
          "id, codigo, nome_oportunidade, produto_id, parceiro_rede_id, municipio_id, origem, etapa_comercial, status, valor_tabela, valor_venda, probabilidade, previsao_fechamento, dor_identificada, proximo_passo, data_proximo_passo, observacoes, produtos ( nome_produto ), parceiros_rede ( razao_social, nome_fantasia ), municipios ( id, nome, uf )"
        )
        .order("updated_at", { ascending: false }),
      supabase.from("produtos").select("id, nome_produto").order("nome_produto"),
      supabase.from("parceiros_rede").select("id, razao_social, nome_fantasia").order("razao_social"),
    ]);

  return (
    <div className="max-w-7xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Funil de vendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as oportunidades em listagem com abas por fase. Clique numa linha para atualizar.
        </p>
      </div>

      <FunilCliente
        oportunidades={(oportunidades ?? []) as unknown as OportunidadeLinha[]}
        produtos={(produtos ?? []).map((p) => ({ id: p.id, rotulo: p.nome_produto })) as Opcao[]}
        parceiros={(parceiros ?? []).map((p) => ({
          id: p.id,
          rotulo: p.nome_fantasia || p.razao_social,
        })) as Opcao[]}
      />
    </div>
  );
}
