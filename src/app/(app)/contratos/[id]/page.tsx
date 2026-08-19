import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ContratoDetalheCliente,
  type ParcelaLinha,
} from "@/components/contratos/contrato-detalhe-cliente";
import {
  TOM_STATUS_CONTRATO,
  type ContratoLinha,
} from "@/components/contratos/contratos-cliente";
import { Pilula } from "@/components/selo-territorio";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { STATUS_CONTRATO } from "@/lib/dominio";
import { formatarMoeda } from "@/lib/utils";

export const metadata = { title: "Contrato" };

export default async function ContratoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contrato } = await supabase
    .from("contratos")
    .select(
      "*, produtos ( nome_produto ), parceiros_rede ( razao_social, nome_fantasia ), municipios ( nome, uf )"
    )
    .eq("id", id)
    .single();

  if (!contrato) notFound();

  const { data: parcelas } = await supabase
    .from("parcelas_contrato")
    .select(
      "id, competencia, data_prevista_faturamento, data_faturamento, data_recebimento, valor_bruto, valor_liquido, status, nota_fiscal"
    )
    .eq("contrato_id", id)
    .order("competencia");

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/contratos" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            Contrato {contrato.numero_contrato || "sem número"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {contrato.produtos?.nome_produto} · {contrato.municipios?.nome}/{contrato.municipios?.uf} ·{" "}
            {contrato.parceiros_rede?.nome_fantasia || contrato.parceiros_rede?.razao_social || "DOISGE"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-semibold tabular-nums">
            {formatarMoeda(contrato.valor_mensal)}<span className="text-xs text-muted-foreground">/mês</span>
          </span>
          <Pilula tom={TOM_STATUS_CONTRATO[contrato.status_contrato] ?? "neutro"}>
            {STATUS_CONTRATO[contrato.status_contrato] ?? contrato.status_contrato}
          </Pilula>
        </div>
      </div>

      <ContratoDetalheCliente
        contrato={contrato as unknown as ContratoLinha}
        parcelas={(parcelas ?? []) as ParcelaLinha[]}
      />
    </div>
  );
}
