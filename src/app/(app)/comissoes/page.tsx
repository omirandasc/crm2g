import { createClient } from "@/lib/supabase/server";
import {
  ComissoesCliente,
  type RegraLinha,
  type ComissaoLinha,
} from "@/components/comissoes/comissoes-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export const metadata = { title: "Comissões" };

export default async function ComissoesPage() {
  const supabase = await createClient();

  const [
    { data: regras },
    { data: comissoes },
    { data: produtos },
    { data: parceiros },
    { data: contratos },
  ] = await Promise.all([
    supabase
      .from("regras_comissao")
      .select(
        "id, produto_id, parceiro_rede_id, tipo_comissao, beneficiario, base_calculo, percentual, valor_fixo, condicao_pagamento, status, observacoes, produtos ( nome_produto ), parceiros_rede ( razao_social, nome_fantasia )"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("comissoes")
      .select(
        "id, beneficiario, valor_base, percentual, valor_comissao, status, visivel_parceiro, data_prevista_pagamento, data_pagamento, observacoes, contratos ( numero_contrato, municipios ( nome, uf ) ), parceiros_rede ( razao_social, nome_fantasia )"
      )
      .order("created_at", { ascending: false }),
    supabase.from("produtos").select("id, nome_produto").order("nome_produto"),
    supabase.from("parceiros_rede").select("id, razao_social, nome_fantasia").order("razao_social"),
    supabase
      .from("contratos")
      .select("id, numero_contrato, municipios ( nome )")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comissões</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Regras aprovadas pela Governança e comissões calculadas por contrato.
        </p>
      </div>

      <ComissoesCliente
        regras={(regras ?? []) as unknown as RegraLinha[]}
        comissoes={(comissoes ?? []) as unknown as ComissaoLinha[]}
        produtos={(produtos ?? []).map((p) => ({ id: p.id, rotulo: p.nome_produto })) as Opcao[]}
        parceiros={(parceiros ?? []).map((p) => ({
          id: p.id,
          rotulo: p.nome_fantasia || p.razao_social,
        })) as Opcao[]}
        contratos={(contratos ?? []).map((c) => {
          const municipio = (c as unknown as { municipios: { nome: string } | null }).municipios;
          return {
            id: c.id,
            rotulo: `${c.numero_contrato || "Sem número"}${municipio ? " · " + municipio.nome : ""}`,
          };
        }) as Opcao[]}
      />
    </div>
  );
}
