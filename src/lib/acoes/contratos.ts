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

const esquemaContrato = z.object({
  id: texto,
  oportunidade_id: obrigatorio("Escolha a oportunidade de origem."),
  numero_contrato: texto,
  numero_processo: texto,
  tipo_compra_publica: texto,
  data_assinatura: texto,
  inicio_vigencia: texto,
  fim_vigencia: texto,
  prazo_meses: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().positive().nullable()
  ),
  valor_mensal: numero,
  valor_total: numero,
  recorrente: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  status_contrato: obrigatorio("Escolha o status."),
  observacoes: texto,
});

export async function salvarContrato(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaContrato.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("contratos").update(campos).eq("id", id);
    if (error) return { erro: error.message, momento: Date.now() };
    revalidatePath(`/contratos/${id}`);
  } else {
    // Herda produto, parceiro, município e empresa da oportunidade de origem
    const { data: oport, error: erroOport } = await supabase
      .from("oportunidades")
      .select("produto_id, empresa_portfolio_id, parceiro_rede_id, municipio_id, orgao_publico_id")
      .eq("id", campos.oportunidade_id)
      .single();

    if (erroOport || !oport) {
      return { erro: "Oportunidade de origem não encontrada.", momento: Date.now() };
    }

    const { error } = await supabase.from("contratos").insert({
      ...campos,
      produto_id: oport.produto_id,
      empresa_portfolio_id: oport.empresa_portfolio_id,
      parceiro_rede_id: oport.parceiro_rede_id,
      municipio_id: oport.municipio_id,
      orgao_publico_id: oport.orgao_publico_id,
    });
    if (error) return { erro: error.message, momento: Date.now() };
  }

  revalidatePath("/contratos");
  revalidatePath("/territorios");
  revalidatePath("/painel");
  return { ok: true, momento: Date.now() };
}

export async function gerarParcelas(contratoId: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fn_gerar_parcelas", {
    p_contrato_id: contratoId,
  });
  if (error) return { erro: error.message, momento: Date.now() };
  revalidatePath(`/contratos/${contratoId}`);
  return { ok: true, momento: Date.now(), erro: undefined, ...(data ? {} : {}) };
}

const esquemaParcela = z.object({
  id: obrigatorio("Parcela inválida."),
  contrato_id: obrigatorio("Contrato inválido."),
  status: obrigatorio("Escolha o status."),
  data_faturamento: texto,
  data_recebimento: texto,
  valor_bruto: numero,
  valor_liquido: numero,
  nota_fiscal: texto,
});

export async function atualizarParcela(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaParcela.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, contrato_id, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = await supabase.from("parcelas_contrato").update(campos).eq("id", id);
  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(`/contratos/${contrato_id}`);
  return { ok: true, momento: Date.now() };
}
