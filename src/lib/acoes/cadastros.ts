"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ResultadoAcao = {
  ok?: boolean;
  erro?: string;
  momento?: number;
};

const texto = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const obrigatorio = (msg: string) => z.string().trim().min(1, msg);

// ── GovTech ─────────────────────────────────────────
const esquemaEmpresa = z.object({
  id: texto,
  razao_social: obrigatorio("Informe a razão social da empresa."),
  nome_fantasia: texto,
  cnpj: texto,
  cidade: texto,
  uf: texto,
  segmento: texto,
  site: texto,
  email_institucional: texto,
  status: obrigatorio("Escolha um status."),
  responsavel_principal: texto,
  email_responsavel: texto,
  telefone_responsavel: texto,
  observacoes: texto,
  banco: texto,
  agencia: texto,
  conta: texto,
  chave_pix: texto,
});

export async function salvarEmpresa(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaEmpresa.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, banco, agencia, conta, chave_pix, ...resto } = dados.data;
  const campos = { ...resto, dados_bancarios: { banco, agencia, conta, chave_pix } };
  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("empresas_portfolio").update(campos).eq("id", id)
    : await supabase.from("empresas_portfolio").insert(campos);

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe uma empresa cadastrada com esse CNPJ.", momento: Date.now() };
    }
    return { erro: "Não foi possível salvar. Tente novamente.", momento: Date.now() };
  }

  revalidatePath("/portfolio");
  revalidatePath("/painel");
  return { ok: true, momento: Date.now() };
}

// ── Produto ──────────────────────────────────────────────────────
const esquemaProduto = z.object({
  id: texto,
  empresa_portfolio_id: obrigatorio("Escolha a empresa dona do produto."),
  nome_produto: obrigatorio("Informe o nome do produto."),
  descricao_curta: texto,
  segmento: texto,
  vertical: texto,
  tipo_produto: obrigatorio("Escolha o tipo do produto."),
  recorrente: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  modelo_contratacao_publica_indicado: texto,
  prazo_contrato_padrao_meses: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().positive().nullable()
  ),
  status: obrigatorio("Escolha um status."),
});

export async function salvarProduto(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaProduto.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("produtos").update(campos).eq("id", id)
    : await supabase.from("produtos").insert(campos);

  if (error) {
    return { erro: "Não foi possível salvar. Tente novamente.", momento: Date.now() };
  }

  revalidatePath("/produtos");
  revalidatePath("/painel");
  return { ok: true, momento: Date.now() };
}

// ── Canal ─────────────────────────────────────────────
const esquemaParceiro = z.object({
  id: texto,
  razao_social: obrigatorio("Informe a razão social do parceiro."),
  nome_fantasia: texto,
  cnpj: texto,
  tipo_parceiro: obrigatorio("Escolha o tipo de parceiro."),
  status: obrigatorio("Escolha um status."),
  cidade: texto,
  uf: texto,
  uf_credenciamento: texto,
  responsavel_principal: texto,
  email_responsavel: texto,
  telefone_responsavel: texto,
  consultor_responsavel: texto,
  observacoes: texto,
  banco: texto,
  agencia: texto,
  conta: texto,
  chave_pix: texto,
});

export async function salvarParceiro(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaParceiro.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, banco, agencia, conta, chave_pix, ...resto } = dados.data;
  const campos = { ...resto, dados_bancarios: { banco, agencia, conta, chave_pix } };
  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("parceiros_rede").update(campos).eq("id", id)
    : await supabase.from("parceiros_rede").insert(campos);

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um parceiro cadastrado com esse CNPJ.", momento: Date.now() };
    }
    return { erro: "Não foi possível salvar. Tente novamente.", momento: Date.now() };
  }

  revalidatePath("/rede");
  revalidatePath("/painel");
  return { ok: true, momento: Date.now() };
}
