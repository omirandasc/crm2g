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

// ── Autorização Parceiro × Produto ───────────────────────────────
const esquemaAutorizacao = z.object({
  id: texto,
  parceiro_rede_id: obrigatorio("Escolha o parceiro."),
  produto_id: obrigatorio("Escolha o produto."),
  status: obrigatorio("Escolha um status."),
  preco_compra_autorizado: numero,
  preco_venda_sugerido: numero,
  preco_minimo_permitido: numero,
  comissao_doisge: numero,
  comissao_parceiro: numero,
  qtd_max_municipios_preferenciais: z.preprocess(
    (v) => (v === "" || v == null ? 20 : Number(v)),
    z.number().int().min(1, "O limite de municípios deve ser pelo menos 1.")
  ),
  prazo_protecao_oportunidade_dias: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().positive().nullable()
  ),
  observacoes: texto,
});

export async function salvarAutorizacao(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaAutorizacao.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  const supabase = await createClient();

  const registro =
    campos.status === "ativa" || campos.status === "aprovada"
      ? { ...campos, data_aprovacao: new Date().toISOString() }
      : campos;

  const { error } = id
    ? await supabase.from("autorizacoes_parceiro_produto").update(registro).eq("id", id)
    : await supabase.from("autorizacoes_parceiro_produto").insert(registro);

  if (error) {
    if (error.code === "23505") {
      return {
        erro: "Já existe uma autorização deste parceiro para este produto. Edite a existente.",
        momento: Date.now(),
      };
    }
    return { erro: "Não foi possível salvar. Tente novamente.", momento: Date.now() };
  }

  revalidatePath("/autorizacoes");
  return { ok: true, momento: Date.now() };
}

// ── Área Preferencial ────────────────────────────────────────────
const esquemaArea = z.object({
  id: texto,
  parceiro_rede_id: obrigatorio("Escolha o parceiro."),
  produto_id: obrigatorio("Escolha o produto."),
  municipio_id: obrigatorio("Escolha o município."),
  justificativa: texto,
});

export async function solicitarAreaPreferencial(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaArea.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id: _id, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = await supabase.from("areas_preferenciais").insert(campos);

  if (error) {
    if (error.code === "23505") {
      return {
        erro: "Este município já tem área preferencial ativa para este produto.",
        momento: Date.now(),
      };
    }
    if (error.code === "42501" || error.message.includes("row-level security")) {
      return {
        erro: "Sem permissão: só é possível solicitar cidades para produtos com autorização ativa.",
        momento: Date.now(),
      };
    }
    return { erro: error.message, momento: Date.now() };
  }

  revalidatePath("/territorios");
  return { ok: true, momento: Date.now() };
}

export async function decidirAreaPreferencial(
  areaId: string,
  decisao: "ativa" | "rejeitada" | "liberada" | "cancelada",
  motivo?: string
): Promise<ResultadoAcao> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const campos: Record<string, unknown> = { status: decisao };
  if (decisao === "ativa") {
    campos.data_aprovacao = new Date().toISOString();
    campos.aprovado_por = user?.id ?? null;
    campos.data_inicio = new Date().toISOString().slice(0, 10);
  }
  if (decisao === "rejeitada") campos.motivo_rejeicao = motivo ?? null;
  if (decisao === "cancelada") campos.motivo_cancelamento = motivo ?? null;

  const { error } = await supabase
    .from("areas_preferenciais")
    .update(campos)
    .eq("id", areaId);

  if (error) {
    return { erro: error.message, momento: Date.now() };
  }

  revalidatePath("/territorios");
  return { ok: true, momento: Date.now() };
}

// ── Oportunidade ─────────────────────────────────────────────────
const esquemaOportunidade = z.object({
  id: texto,
  nome_oportunidade: obrigatorio("Dê um nome para a oportunidade."),
  produto_id: obrigatorio("Escolha o produto."),
  parceiro_rede_id: texto,
  municipio_id: obrigatorio("Escolha o município."),
  origem: obrigatorio("Escolha a origem."),
  etapa_comercial: obrigatorio("Escolha a etapa."),
  valor_tabela: numero,
  valor_venda: numero,
  probabilidade: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().min(0).max(100).nullable()
  ),
  previsao_fechamento: texto,
  dor_identificada: texto,
  proximo_passo: texto,
  data_proximo_passo: texto,
  observacoes: texto,
});

export async function salvarOportunidade(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaOportunidade.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;

  // Trava de preço: venda não pode ficar abaixo da tabela
  if (
    campos.valor_venda != null &&
    campos.valor_tabela != null &&
    campos.valor_venda < campos.valor_tabela
  ) {
    return {
      erro: "O valor de venda está abaixo do valor de tabela. Ajuste o valor ou solicite exceção à Governança.",
      momento: Date.now(),
    };
  }

  // Status acompanha a etapa final
  const status =
    campos.etapa_comercial === "fechado_ganho"
      ? "ganha"
      : campos.etapa_comercial === "fechado_perdido"
        ? "perdida"
        : campos.etapa_comercial === "suspenso"
          ? "suspensa"
          : "em_andamento";

  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("oportunidades").update({ ...campos, status }).eq("id", id)
    : await supabase.from("oportunidades").insert({ ...campos, status });

  if (error) {
    if (error.code === "42501" || error.message.includes("row-level security")) {
      return {
        erro: "Sem permissão para registrar aqui: você só pode criar oportunidades de produtos autorizados e em cidades da sua área (preferencial ativa ou exclusiva). Solicite a cidade em Minha área.",
        momento: Date.now(),
      };
    }
    return { erro: error.message, momento: Date.now() };
  }

  revalidatePath("/oportunidades");
  revalidatePath("/painel");
  return { ok: true, momento: Date.now() };
}
