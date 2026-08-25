import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetalheOportunidade } from "@/components/oportunidades/detalhe-cliente";
import type { OportunidadeLinha } from "@/components/oportunidades/funil-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import { Pilula } from "@/components/selo-territorio";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ETAPAS_COMERCIAIS, TOM_ETAPA } from "@/lib/dominio";
import { formatarMoeda } from "@/lib/utils";

export const metadata = { title: "Oportunidade" };

export default async function OportunidadeDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: oportunidade } = await supabase
    .from("oportunidades")
    .select(
      "*, produtos ( nome_produto ), parceiros_rede ( razao_social, nome_fantasia ), municipios ( id, nome, uf )"
    )
    .eq("id", id)
    .single();

  if (!oportunidade) notFound();

  const [
    { data: atividades },
    { data: propostas },
    { data: processo },
    { data: produtos },
    { data: parceiros },
    { data: orgaos },
  ] = await Promise.all([
    supabase
      .from("atividades_comerciais")
      .select("id, tipo_atividade, data_atividade, descricao, proximo_passo, data_proximo_passo, visibilidade")
      .eq("oportunidade_id", id)
      .order("data_atividade", { ascending: false }),
    supabase
      .from("propostas")
      .select("id, numero_proposta, valor, validade, modelo_contratacao, status, data_envio, observacoes")
      .eq("oportunidade_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("processos_compra_publica")
      .select("*")
      .eq("oportunidade_id", id)
      .maybeSingle(),
    supabase.from("produtos").select("id, nome_produto").order("nome_produto"),
    supabase.from("parceiros_rede").select("id, razao_social, nome_fantasia").order("razao_social"),
    supabase
      .from("orgaos_publicos")
      .select("id, nome_orgao, tipo_orgao")
      .eq("municipio_id", oportunidade.municipio_id)
      .order("nome_orgao"),
  ]);

  const { data: contatos } = oportunidade.orgao_publico_id
    ? await supabase
        .from("contatos_publicos")
        .select("id, nome, cargo, perfil_decisao, email, telefone, whatsapp")
        .eq("orgao_publico_id", oportunidade.orgao_publico_id)
        .order("nome")
    : { data: [] };

  const { data: documentos } = processo
    ? await supabase
        .from("documentos_compra_publica")
        .select("id, tipo_documento, nome_documento, arquivo_url, created_at")
        .eq("processo_compra_id", processo.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/oportunidades" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            <span className="font-mono text-lg text-muted-foreground">#{oportunidade.codigo}</span>{" "}
            {oportunidade.nome_oportunidade}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {oportunidade.produtos?.nome_produto} · {oportunidade.municipios?.nome}/{oportunidade.municipios?.uf} ·{" "}
            {oportunidade.parceiros_rede?.nome_fantasia || oportunidade.parceiros_rede?.razao_social || "DOISGE"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-semibold tabular-nums">
            {formatarMoeda(oportunidade.valor_venda)}
          </span>
          <Pilula tom={TOM_ETAPA[oportunidade.etapa_comercial] ?? "neutro"}>
            {ETAPAS_COMERCIAIS[oportunidade.etapa_comercial] ?? oportunidade.etapa_comercial}
          </Pilula>
        </div>
      </div>

      <DetalheOportunidade
        oportunidade={oportunidade as unknown as OportunidadeLinha & { orgao_publico_id: string | null; orgao_faturado_id: string | null }}
        atividades={atividades ?? []}
        propostas={propostas ?? []}
        processo={processo ?? null}
        documentos={documentos ?? []}
        orgaos={orgaos ?? []}
        contatos={contatos ?? []}
        produtos={(produtos ?? []).map((p) => ({ id: p.id, rotulo: p.nome_produto })) as Opcao[]}
        parceiros={(parceiros ?? []).map((p) => ({
          id: p.id,
          rotulo: p.nome_fantasia || p.razao_social,
        })) as Opcao[]}
      />
    </div>
  );
}
