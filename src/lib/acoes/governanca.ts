"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { BENEFICIARIOS_COMISSAO } from "@/lib/dominio";
import type { ResultadoAcao } from "@/lib/acoes/cadastros";

const texto = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const obrigatorio = (msg: string) => z.string().trim().min(1, msg);

const numero = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(String(v).replace(",", "."))),
  z.number().nullable()
);

// ── Regra de comissão ────────────────────────────────────────────
const esquemaRegra = z.object({
  id: texto,
  produto_id: texto,
  parceiro_rede_id: texto,
  tipo_comissao: obrigatorio("Escolha o tipo de comissão."),
  beneficiario: z.enum(["doisge", "canal", "govtech", "indicacao", "outro"], { message: "Escolha o beneficiário." }),
  base_calculo: obrigatorio("Escolha a base de cálculo."),
  percentual: numero,
  valor_fixo: numero,
  condicao_pagamento: texto,
  status: obrigatorio("Escolha o status."),
  observacoes: texto,
});

export async function salvarRegraComissao(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaRegra.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  if (campos.percentual == null && campos.valor_fixo == null) {
    return { erro: "Informe o percentual ou um valor fixo.", momento: Date.now() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const registro =
    campos.status === "ativa" ? { ...campos, aprovado_por: user?.id ?? null } : campos;

  const { error } = id
    ? await supabase.from("regras_comissao").update(registro).eq("id", id)
    : await supabase.from("regras_comissao").insert(registro);

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath("/comissoes");
  return { ok: true, momento: Date.now() };
}

// ── Cálculo de comissões de um contrato ──────────────────────────
export async function calcularComissoesContrato(contratoId: string): Promise<ResultadoAcao & { geradas?: number }> {
  const supabase = await createClient();

  const { data: contrato } = await supabase
    .from("contratos")
    .select("id, produto_id, empresa_portfolio_id, parceiro_rede_id, valor_total, valor_mensal, parceiros_rede ( razao_social, nome_fantasia ), empresas_portfolio ( razao_social, nome_fantasia )")
    .eq("id", contratoId)
    .single();

  if (!contrato) return { erro: "Contrato não encontrado.", momento: Date.now() };

  const { data: regras } = await supabase
    .from("regras_comissao")
    .select("*")
    .eq("status", "ativa")
    .or(`produto_id.eq.${contrato.produto_id},produto_id.is.null`);

  const aplicaveis = (regras ?? []).filter(
    (r) =>
      (r.produto_id === contrato.produto_id || r.produto_id == null) &&
      (r.parceiro_rede_id == null || r.parceiro_rede_id === contrato.parceiro_rede_id)
  );

  if (aplicaveis.length === 0) {
    return { erro: "Nenhuma regra de comissão ativa se aplica a este contrato.", momento: Date.now() };
  }

  // Somas de parcelas para bases de faturado/recebido
  const { data: parcelas } = await supabase
    .from("parcelas_contrato")
    .select("valor_liquido, valor_bruto, status")
    .eq("contrato_id", contratoId);

  const soma = (filtro: (s: string) => boolean) =>
    (parcelas ?? [])
      .filter((p) => filtro(p.status))
      .reduce((acc, p) => acc + (p.valor_liquido ?? p.valor_bruto ?? 0), 0);

  const bases: Record<string, number | null> = {
    valor_bruto_contratado: contrato.valor_total,
    valor_liquido_contratado: contrato.valor_total,
    mensalidade: contrato.valor_mensal,
    valor_faturado: soma((s) => s === "faturada" || s === "recebida"),
    valor_recebido: soma((s) => s === "recebida"),
    valor_implantacao: null,
    valor_fixo: 0,
    outro: null,
  };

  // Beneficiário legível: o tipo da regra + o nome de quem recebe neste contrato
  const nome = (e: unknown) => {
    const x = e as { razao_social?: string; nome_fantasia?: string | null } | null;
    return x?.nome_fantasia || x?.razao_social || null;
  };
  const nomeBeneficiario = (codigo: string) => {
    const rotulo = BENEFICIARIOS_COMISSAO[codigo] ?? codigo;
    if (codigo === "canal" && nome(contrato.parceiros_rede)) return `Canal — ${nome(contrato.parceiros_rede)}`;
    if (codigo === "govtech" && nome(contrato.empresas_portfolio)) return `GovTech — ${nome(contrato.empresas_portfolio)}`;
    return rotulo;
  };

  let geradas = 0;
  for (const regra of aplicaveis) {
    const base = bases[regra.base_calculo] ?? null;
    const valor =
      (base != null && regra.percentual != null ? (base * regra.percentual) / 100 : 0) +
      (regra.valor_fixo ?? 0);

    if (valor <= 0) continue;

    const { error } = await supabase.from("comissoes").insert({
      regra_comissao_id: regra.id,
      contrato_id: contrato.id,
      produto_id: contrato.produto_id,
      empresa_portfolio_id: contrato.empresa_portfolio_id,
      parceiro_rede_id: contrato.parceiro_rede_id,
      beneficiario: nomeBeneficiario(regra.beneficiario),
      valor_base: base,
      percentual: regra.percentual,
      valor_fixo: regra.valor_fixo,
      valor_comissao: Math.round(valor * 100) / 100,
      status: "calculada",
    });
    if (!error) geradas++;
  }

  if (geradas === 0) {
    return { erro: "Nenhuma comissão gerada — confira bases e valores do contrato.", momento: Date.now() };
  }

  revalidatePath("/comissoes");
  return { ok: true, momento: Date.now(), geradas };
}

const esquemaComissao = z.object({
  id: obrigatorio("Comissão inválida."),
  status: obrigatorio("Escolha o status."),
  data_prevista_pagamento: texto,
  data_pagamento: texto,
  visivel_parceiro: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  observacoes: texto,
});

export async function atualizarComissao(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaComissao.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = await supabase.from("comissoes").update(campos).eq("id", id);
  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath("/comissoes");
  return { ok: true, momento: Date.now() };
}

// ── Entrega ──────────────────────────────────────────────────────
const esquemaEntrega = z.object({
  id: texto,
  contrato_id: obrigatorio("Escolha o contrato."),
  tipo_responsavel: obrigatorio("Escolha o responsável."),
  responsavel_entrega: texto,
  status_entrega: obrigatorio("Escolha o status."),
  data_inicio: texto,
  data_prevista_conclusao: texto,
  data_conclusao: texto,
  pendencias: texto,
  observacoes: texto,
});

export async function salvarEntrega(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaEntrega.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("entregas").update(campos).eq("id", id);
    if (error) return { erro: error.message, momento: Date.now() };
  } else {
    const { data: contrato } = await supabase
      .from("contratos")
      .select("produto_id, empresa_portfolio_id, parceiro_rede_id, municipio_id, orgao_publico_id, oportunidade_id")
      .eq("id", campos.contrato_id)
      .single();

    const { error } = await supabase.from("entregas").insert({
      ...campos,
      produto_id: contrato?.produto_id,
      empresa_portfolio_id: contrato?.empresa_portfolio_id,
      parceiro_rede_id: contrato?.parceiro_rede_id,
      municipio_id: contrato?.municipio_id,
      orgao_publico_id: contrato?.orgao_publico_id,
      oportunidade_id: contrato?.oportunidade_id,
    });
    if (error) return { erro: error.message, momento: Date.now() };
  }

  revalidatePath("/entregas");
  return { ok: true, momento: Date.now() };
}

// ── Solicitação de aprovação ─────────────────────────────────────
const esquemaSolicitacao = z.object({
  tipo_solicitacao: obrigatorio("Escolha o tipo."),
  descricao: obrigatorio("Descreva a solicitação."),
});

export async function criarSolicitacao(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaSolicitacao.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada.", momento: Date.now() };

  const { data: perfil } = await supabase
    .from("profiles")
    .select("perfil")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("solicitacoes_aprovacao").insert({
    ...dados.data,
    solicitante: user.id,
    perfil_solicitante: perfil?.perfil ?? null,
  });

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath("/aprovacoes");
  return { ok: true, momento: Date.now() };
}

export async function decidirSolicitacao(
  solicitacaoId: string,
  decisao: "aprovada" | "rejeitada" | "devolvida_para_ajuste",
  motivo?: string
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("solicitacoes_aprovacao")
    .update({
      status: decisao,
      data_decisao: new Date().toISOString(),
      decidido_por: user?.id ?? null,
      motivo_decisao: motivo ?? null,
    })
    .eq("id", solicitacaoId);

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath("/aprovacoes");
  return { ok: true, momento: Date.now() };
}
