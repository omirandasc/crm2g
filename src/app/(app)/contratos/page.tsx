import { createClient } from "@/lib/supabase/server";
import {
  ContratosCliente,
  type ContratoLinha,
} from "@/components/contratos/contratos-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export const metadata = { title: "Contratos" };

export default async function ContratosPage() {
  const supabase = await createClient();

  const [{ data: contratos }, { data: oportunidades }] = await Promise.all([
    supabase
      .from("contratos")
      .select(
        "id, numero_contrato, oportunidade_id, tipo_compra_publica, data_assinatura, inicio_vigencia, fim_vigencia, prazo_meses, valor_mensal, valor_total, recorrente, status_contrato, observacoes, produtos ( nome_produto ), parceiros_rede ( razao_social, nome_fantasia ), municipios ( nome, uf )"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("oportunidades")
      .select("id, codigo, nome_oportunidade")
      .order("codigo", { ascending: false }),
  ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Contratos fechados com os municípios. Clique numa linha para ver vigência e parcelas.
        </p>
      </div>

      <ContratosCliente
        contratos={(contratos ?? []) as unknown as ContratoLinha[]}
        oportunidades={(oportunidades ?? []).map((o) => ({
          id: o.id,
          rotulo: `#${o.codigo} · ${o.nome_oportunidade}`,
        })) as Opcao[]}
      />
    </div>
  );
}
