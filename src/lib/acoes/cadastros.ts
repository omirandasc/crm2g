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
  ufs_credenciamento: z.preprocess(
    (v) =>
      String(v ?? "")
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((s) => /^[A-Z]{2}$/.test(s)),
    z.array(z.string())
  ),
  limite_cidades_preferenciais: z.preprocess(
    (v) => (v === "" || v == null ? 30 : Number(v)),
    z.number().int().min(1, "O limite da carteira deve ser pelo menos 1.")
  ),
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
  const campos = {
    ...resto,
    // legado: primeira UF mantida na coluna antiga para compatibilidade
    uf_credenciamento: resto.ufs_credenciamento[0] ?? null,
    dados_bancarios: { banco, agencia, conta, chave_pix },
  };
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

// ── Excluir GovTech (só DoisGe; bloqueada quando há vínculos) ────
export async function excluirEmpresa(empresaId: string): Promise<ResultadoAcao> {
  const supabase = await createClient();

  const { count: produtos } = await supabase
    .from("produtos")
    .select("id", { count: "exact", head: true })
    .eq("empresa_portfolio_id", empresaId);

  if ((produtos ?? 0) > 0) {
    return {
      erro: `Esta GovTech tem ${produtos} produto(s) cadastrado(s). Exclua os produtos primeiro ou marque a empresa como Encerrada para preservar o histórico.`,
      momento: Date.now(),
    };
  }

  const { data: excluidas, error } = await supabase
    .from("empresas_portfolio")
    .delete()
    .eq("id", empresaId)
    .select("id");

  if (error) {
    if (error.code === "23503") {
      return {
        erro: "Esta GovTech tem vínculos no sistema (políticas, usuários, contratos ou oportunidades). Marque a empresa como Encerrada para preservar o histórico.",
        momento: Date.now(),
      };
    }
    return { erro: error.message, momento: Date.now() };
  }

  if (!excluidas || excluidas.length === 0) {
    return { erro: "Apenas a DoisGe (Governança) pode excluir uma GovTech.", momento: Date.now() };
  }

  // Registros polimórficos (sem FK) só são limpos após a exclusão dar certo
  await supabase.from("socios").delete().eq("entidade", "empresa_portfolio").eq("entidade_id", empresaId);
  await supabase.from("certidoes").delete().eq("entidade", "empresa_portfolio").eq("entidade_id", empresaId);

  revalidatePath("/portfolio");
  revalidatePath("/painel");
  return { ok: true, momento: Date.now() };
}
