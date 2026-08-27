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

function rotaDaEntidade(entidade: string, id: string) {
  return entidade === "empresa_portfolio" ? `/portfolio/${id}` : `/rede/${id}`;
}

// ── Sócios (GovTech e Canal) ─────────────────────────────────────
const esquemaSocio = z.object({
  entidade: z.enum(["empresa_portfolio", "parceiro_rede"]),
  entidade_id: obrigatorio("Registro inválido."),
  nome: obrigatorio("Informe o nome do sócio."),
  cpf: texto,
  percentual: numero,
  email: texto,
  telefone: texto,
});

export async function salvarSocio(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaSocio.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("socios").insert(dados.data);
  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(rotaDaEntidade(dados.data.entidade, dados.data.entidade_id));
  return { ok: true, momento: Date.now() };
}

export async function removerSocio(
  socioId: string,
  entidade: string,
  entidadeId: string
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const { error } = await supabase.from("socios").delete().eq("id", socioId);
  if (error) return { erro: error.message, momento: Date.now() };
  revalidatePath(rotaDaEntidade(entidade, entidadeId));
  return { ok: true, momento: Date.now() };
}

// ── Certidões (GovTech e Canal) ──────────────────────────────────
const esquemaCertidao = z.object({
  entidade: z.enum(["empresa_portfolio", "parceiro_rede"]),
  entidade_id: obrigatorio("Registro inválido."),
  nome: obrigatorio("Dê um nome à certidão."),
  data_validade: texto,
  arquivo_url: obrigatorio("Envie o arquivo."),
});

export async function salvarCertidao(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaCertidao.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("certidoes").insert(dados.data);
  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(rotaDaEntidade(dados.data.entidade, dados.data.entidade_id));
  return { ok: true, momento: Date.now() };
}

export async function removerCertidao(
  certidaoId: string,
  entidade: string,
  entidadeId: string
): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const { error } = await supabase.from("certidoes").delete().eq("id", certidaoId);
  if (error) return { erro: error.message, momento: Date.now() };
  revalidatePath(rotaDaEntidade(entidade, entidadeId));
  return { ok: true, momento: Date.now() };
}

// ── Contato do órgão público ─────────────────────────────────────
const esquemaContato = z.object({
  orgao_publico_id: obrigatorio("Órgão inválido."),
  oportunidade_id: texto,
  nome: obrigatorio("Informe o nome do contato."),
  cargo: texto,
  perfil_decisao: texto,
  email: texto,
  telefone: texto,
  whatsapp: texto,
});

export async function salvarContatoPublico(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaContato.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { oportunidade_id, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = await supabase.from("contatos_publicos").insert(campos);
  if (error) return { erro: error.message, momento: Date.now() };

  if (oportunidade_id) revalidatePath(`/oportunidades/${oportunidade_id}`);
  return { ok: true, momento: Date.now() };
}

// ── Política comercial ───────────────────────────────────────────
const esquemaPolitica = z.object({
  id: texto,
  nome_politica: obrigatorio("Dê um nome à política."),
  tipo_politica: obrigatorio("Escolha o tipo."),
  produto_id: texto,
  empresa_portfolio_id: texto,
  parceiro_rede_id: texto,
  descricao: texto,
  data_inicio: texto,
  data_fim: texto,
  status: obrigatorio("Escolha o status."),
});

export async function salvarPolitica(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaPolitica.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const registro =
    campos.status === "ativa" ? { ...campos, aprovado_por: user?.id ?? null } : campos;

  const { error } = id
    ? await supabase.from("politicas_comerciais").update(registro).eq("id", id)
    : await supabase.from("politicas_comerciais").insert(registro);

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath("/politicas");
  return { ok: true, momento: Date.now() };
}

// ── Radar PNCP: palavras-chave monitoradas ───────────────────────
const esquemaPalavraChave = z.object({
  termo: obrigatorio("Digite a palavra-chave."),
  uf: texto,
});

export async function salvarPalavraChave(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaPalavraChave.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("palavras_chave_pncp").insert({
    termo: dados.data.termo.toLowerCase(),
    uf: dados.data.uf,
    criado_por: user?.id ?? null,
  });
  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath("/compras-publicas");
  return { ok: true, momento: Date.now() };
}

export async function removerPalavraChave(id: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const { error } = await supabase.from("palavras_chave_pncp").delete().eq("id", id);
  if (error) return { erro: error.message, momento: Date.now() };
  revalidatePath("/compras-publicas");
  return { ok: true, momento: Date.now() };
}
