import { createClient } from "@/lib/supabase/server";
import {
  TerritoriosCliente,
  type AreaPreferencialLinha,
  type AreaExclusivaLinha,
} from "@/components/territorios/territorios-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export const metadata = { title: "Territórios" };

export default async function TerritoriosPage() {
  const supabase = await createClient();

  const [
    { data: preferenciais },
    { data: exclusivas },
    { data: parceiros },
    { data: produtos },
  ] = await Promise.all([
    supabase
      .from("areas_preferenciais")
      .select(
        "id, status, data_solicitacao, data_aprovacao, justificativa, ultima_movimentacao_comercial, parceiros_rede ( razao_social, nome_fantasia ), produtos ( nome_produto ), municipios ( nome, uf, populacao )"
      )
      .order("data_solicitacao", { ascending: false }),
    supabase
      .from("areas_exclusivas")
      .select(
        "id, status, data_inicio, parceiros_rede ( razao_social, nome_fantasia ), produtos ( nome_produto ), municipios ( nome, uf )"
      )
      .order("data_inicio", { ascending: false }),
    supabase.from("parceiros_rede").select("id, razao_social, nome_fantasia").order("razao_social"),
    supabase.from("produtos").select("id, nome_produto").order("nome_produto"),
  ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Territórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Áreas preferenciais (carteira de 30 cidades sem contrato por Canal) e exclusivas (contrato assinado).
        </p>
      </div>

      <TerritoriosCliente
        preferenciais={(preferenciais ?? []) as unknown as AreaPreferencialLinha[]}
        exclusivas={(exclusivas ?? []) as unknown as AreaExclusivaLinha[]}
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
