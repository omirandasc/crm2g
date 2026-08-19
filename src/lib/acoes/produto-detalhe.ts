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

const inteiro = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().int().nullable()
);

// ── Preço do produto ─────────────────────────────────────────────
const esquemaPreco = z.object({
  id: texto,
  produto_id: obrigatorio("Produto inválido."),
  tipo_preco: obrigatorio("Escolha o tipo de preço."),
  valor: numero,
  faixa_inicial: inteiro,
  faixa_final: inteiro,
  preco_minimo_permitido: numero,
  desconto_maximo: numero,
  data_inicio_vigencia: texto,
  data_fim_vigencia: texto,
  observacoes: texto,
});

export async function salvarPreco(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaPreco.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = id
    ? await supabase.from("precos_produto").update(campos).eq("id", id)
    : await supabase.from("precos_produto").insert(campos);

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(`/produtos/${campos.produto_id}`);
  return { ok: true, momento: Date.now() };
}

export async function removerPreco(precoId: string, produtoId: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const { error } = await supabase.from("precos_produto").delete().eq("id", precoId);
  if (error) return { erro: error.message, momento: Date.now() };
  revalidatePath(`/produtos/${produtoId}`);
  return { ok: true, momento: Date.now() };
}

// ── Material do produto ──────────────────────────────────────────
const esquemaMaterial = z.object({
  produto_id: obrigatorio("Produto inválido."),
  nome_material: obrigatorio("Dê um nome ao material."),
  tipo_material: obrigatorio("Escolha o tipo."),
  nivel_visibilidade: obrigatorio("Escolha a visibilidade."),
  descricao: texto,
  arquivo_url: obrigatorio("Envie o arquivo."),
});

export async function salvarMaterial(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaMaterial.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("materiais_produto").insert({
    ...dados.data,
    uploaded_por: user?.id ?? null,
  });

  if (error) return { erro: error.message, momento: Date.now() };

  revalidatePath(`/produtos/${dados.data.produto_id}`);
  return { ok: true, momento: Date.now() };
}

export async function removerMaterial(materialId: string, produtoId: string): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const { error } = await supabase.from("materiais_produto").delete().eq("id", materialId);
  if (error) return { erro: error.message, momento: Date.now() };
  revalidatePath(`/produtos/${produtoId}`);
  return { ok: true, momento: Date.now() };
}
