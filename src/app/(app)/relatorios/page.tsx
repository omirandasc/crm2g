import { createClient } from "@/lib/supabase/server";
import {
  RelatoriosCliente,
  type OportunidadeRelatorio,
} from "@/components/relatorios/relatorios-cliente";

export const metadata = { title: "Relatórios" };

export default async function RelatoriosPage() {
  const supabase = await createClient();

  const { data: oportunidades } = await supabase
    .from("oportunidades")
    .select(
      "id, etapa_comercial, valor_venda, produtos ( nome_produto, tipo_produto, empresas_portfolio ( razao_social, nome_fantasia ) ), parceiros_rede ( razao_social, nome_fantasia ), municipios ( nome, uf, regiao )"
    );

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          O funil em números, por fase, produto, GovTech, Canal e região.
        </p>
      </div>

      <RelatoriosCliente
        oportunidades={(oportunidades ?? []) as unknown as OportunidadeRelatorio[]}
      />
    </div>
  );
}
