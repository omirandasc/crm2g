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

type ErroBanco = { code?: string; message: string; details?: string | null; hint?: string | null };

/**
 * Traduz o erro do banco para uma frase clara e mantém uma pista técnica na
 * tela. "Não foi possível salvar. Tente novamente." escondia a causa real —
 * com o código à vista, um print do usuário já diz o que aconteceu.
 */
function erroAoSalvar(erro: ErroBanco, oQue: string): ResultadoAcao {
  console.error(`[salvar ${oQue}]`, erro.code, erro.message, erro.details, erro.hint);

  const frases: Record<string, string> = {
    "23505": `Já existe ${oQue} cadastrado com esse CNPJ.`,
    "23502": "Faltou preencher um campo obrigatório.",
    "23503": "Há um vínculo inválido no formulário (registro relacionado não existe).",
    "23514": "Os dados não passaram numa regra do banco — confira os campos marcados com *.",
    "22001": "Algum campo ficou maior que o limite permitido (por exemplo, UF com mais de 2 letras).",
    "42501": "Seu perfil não tem permissão para salvar este cadastro.",
    PGRST204: "O sistema está numa versão anterior à do banco de dados. Avise o suporte: falta publicar a atualização.",
  };

  const frase = frases[erro.code ?? ""] ?? "Não foi possível salvar.";
  return {
    erro: `${frase} (código ${erro.code ?? "?"}: ${erro.message})`,
    momento: Date.now(),
  };
}

// ── GovTech ─────────────────────────────────────────
const esquemaEmpresa = z.object({
  id: texto,
  razao_social: obrigatorio("Informe a razão social da empresa."),
  nome_fantasia: texto,
  cnpj: texto,
  cep: texto,
  logradouro: texto,
  numero: texto,
  complemento: texto,
  bairro: texto,
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

  if (error) return erroAoSalvar(error, "uma GovTech");

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

  if (error) return erroAoSalvar(error, "um produto");

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
  tipos_parceiro: z.preprocess(
    (v) =>
      String(v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => ["canal_comercial", "revendedor_distribuidor", "parceiro_servico"].includes(s)),
    z.array(z.string()).min(1, "Marque ao menos um tipo de parceiro.")
  ),
  status: obrigatorio("Escolha um status."),
  cep: texto,
  logradouro: texto,
  numero: texto,
  complemento: texto,
  bairro: texto,
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
    // legado: primeira UF e primeiro tipo espelhados nas colunas antigas
    uf_credenciamento: resto.ufs_credenciamento[0] ?? null,
    tipo_parceiro: resto.tipos_parceiro[0],
    dados_bancarios: { banco, agencia, conta, chave_pix },
  };
  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("parceiros_rede").update(campos).eq("id", id)
    : await supabase.from("parceiros_rede").insert(campos);

  if (error) return erroAoSalvar(error, "um canal");

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
