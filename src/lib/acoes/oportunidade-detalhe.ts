"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

// ── Atividade comercial ──────────────────────────────────────────
const esquemaAtividade = z.object({
  oportunidade_id: obrigatorio("Oportunidade inválida."),
  tipo_atividade: obrigatorio("Escolha o tipo de atividade."),
  descricao: obrigatorio("Descreva o que aconteceu."),
  data_atividade: texto,
  visibilidade: obrigatorio("Escolha a visibilidade."),
  proximo_passo: texto,
  data_proximo_passo: texto,
});

export async function registrarAtividade(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaAtividade.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { oportunidade_id, data_atividade, ...campos } = dados.data;

  const { error } = await supabase.from("atividades_comerciais").insert({
    ...campos,
    entidade: "oportunidade",
    entidade_id: oportunidade_id,
    oportunidade_id,
    data_atividade: data_atividade ? new Date(data_atividade + "T12:00:00").toISOString() : new Date().toISOString(),
    responsavel: user?.id ?? null,
  });

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(`/oportunidades/${oportunidade_id}`);
  return { ok: true, momento: Date.now() };
}

// ── Proposta ─────────────────────────────────────────────────────
const esquemaProposta = z.object({
  id: texto,
  oportunidade_id: obrigatorio("Oportunidade inválida."),
  numero_proposta: texto,
  valor: numero,
  validade: texto,
  modelo_contratacao: texto,
  status: obrigatorio("Escolha o status."),
  data_envio: texto,
  observacoes: texto,
});

export async function salvarProposta(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaProposta.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("propostas").update(campos).eq("id", id)
    : await supabase.from("propostas").insert(campos);

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(`/oportunidades/${campos.oportunidade_id}`);
  return { ok: true, momento: Date.now() };
}

// ── Processo de compra pública ───────────────────────────────────
const esquemaProcesso = z.object({
  oportunidade_id: obrigatorio("Oportunidade inválida."),
  tipo_compra_publica: texto,
  status_compra: obrigatorio("Escolha o status."),
  numero_processo_administrativo: texto,
  numero_edital: texto,
  portal_compra: texto,
  data_publicacao: texto,
  data_sessao: texto,
  data_homologacao: texto,
  responsavel_compras: texto,
  valor_estimado: numero,
  concorrentes_conhecidos: texto,
  riscos_identificados: texto,
  observacoes: texto,
});

export async function salvarProcessoCompra(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaProcesso.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const campos = dados.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("processos_compra_publica")
    .upsert(campos, { onConflict: "oportunidade_id" });

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(`/oportunidades/${campos.oportunidade_id}`);
  revalidatePath("/compras-publicas");
  return { ok: true, momento: Date.now() };
}

// ── Documento do processo (arquivo já enviado ao Storage) ────────
const esquemaDocumento = z.object({
  processo_compra_id: obrigatorio("Processo inválido."),
  oportunidade_id: obrigatorio("Oportunidade inválida."),
  tipo_documento: obrigatorio("Escolha o tipo do documento."),
  nome_documento: obrigatorio("Dê um nome ao documento."),
  arquivo_url: obrigatorio("Envie o arquivo."),
});

export async function registrarDocumentoCompra(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaDocumento.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { oportunidade_id, ...campos } = dados.data;

  const { error } = await supabase.from("documentos_compra_publica").insert({
    ...campos,
    uploaded_por: user?.id ?? null,
  });

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(`/oportunidades/${oportunidade_id}`);
  return { ok: true, momento: Date.now() };
}

// ── Órgão público (criação rápida) ───────────────────────────────
const esquemaOrgao = z.object({
  municipio_id: obrigatorio("Município inválido."),
  oportunidade_id: texto,
  nome_orgao: obrigatorio("Informe o nome do órgão."),
  tipo_orgao: obrigatorio("Escolha o tipo."),
  endereco: texto,
  secretaria: texto,
  responsavel: texto,
  email: texto,
  telefone: texto,
});

export async function criarOrgao(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaOrgao.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { oportunidade_id, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = await supabase.from("orgaos_publicos").insert(campos);
  if (error) return { erro: error.message, momento: Date.now() };

  if (oportunidade_id) revalidatePath(`/oportunidades/${oportunidade_id}`);
  return { ok: true, momento: Date.now() };
}

// ── Vincular órgão/faturado na oportunidade ──────────────────────
const esquemaVinculo = z.object({
  oportunidade_id: obrigatorio("Oportunidade inválida."),
  orgao_publico_id: texto,
  orgao_faturado_id: texto,
});

export async function vincularOrgaos(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaVinculo.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { oportunidade_id, orgao_publico_id, orgao_faturado_id } = dados.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("oportunidades")
    .update({
      orgao_publico_id: orgao_publico_id || null,
      orgao_faturado_id: orgao_faturado_id || null,
    })
    .eq("id", oportunidade_id);

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(`/oportunidades/${oportunidade_id}`);
  return { ok: true, momento: Date.now() };
}
