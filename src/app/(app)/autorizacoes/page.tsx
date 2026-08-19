import { createClient } from "@/lib/supabase/server";
import {
  AutorizacoesCliente,
  type AutorizacaoLinha,
  type Opcao,
} from "@/components/autorizacoes/autorizacoes-cliente";

export const metadata = { title: "Autorizações" };

export default async function AutorizacoesPage() {
  const supabase = await createClient();

  const [{ data: autorizacoes }, { data: parceiros }, { data: produtos }] =
    await Promise.all([
      supabase
        .from("autorizacoes_parceiro_produto")
        .select(
          "id, parceiro_rede_id, produto_id, status, preco_compra_autorizado, preco_venda_sugerido, preco_minimo_permitido, comissao_doisge, comissao_parceiro, qtd_max_municipios_preferenciais, prazo_protecao_oportunidade_dias, observacoes, parceiros_rede ( razao_social, nome_fantasia ), produtos ( nome_produto )"
        )
        .order("created_at", { ascending: false }),
      supabase.from("parceiros_rede").select("id, razao_social, nome_fantasia").order("razao_social"),
      supabase.from("produtos").select("id, nome_produto").order("nome_produto"),
    ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Autorizações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem pode vender o quê — com preços, comissões e limite de cidades. Clique numa linha para editar.
        </p>
      </div>

      <AutorizacoesCliente
        autorizacoes={(autorizacoes ?? []) as unknown as AutorizacaoLinha[]}
        parceiros={(parceiros ?? []).map((p) => ({
          id: p.id,
          rotulo: p.nome_fantasia || p.razao_social,
        })) as Opcao[]}
        produtos={(produtos ?? []).map((p) => ({
          id: p.id,
          rotulo: p.nome_produto,
        })) as Opcao[]}
      />
    </div>
  );
}
