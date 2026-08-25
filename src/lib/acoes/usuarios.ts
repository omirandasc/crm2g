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

async function chamarFuncaoAdmin(corpo: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { erro: "Sessão expirada. Entre novamente." };

  const resposta = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-usuarios`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify(corpo),
    }
  );
  return (await resposta.json()) as { ok?: boolean; erro?: string };
}

const esquemaNovoUsuario = z.object({
  nome: obrigatorio("Informe o nome."),
  email: obrigatorio("Informe o e-mail."),
  senha: z.string().min(8, "A senha precisa de pelo menos 8 caracteres."),
  perfil: obrigatorio("Escolha o perfil."),
  empresa_portfolio_id: texto,
  parceiro_rede_id: texto,
});

export async function criarUsuario(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaNovoUsuario.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  if (dados.data.perfil.includes("portfolio") && !dados.data.empresa_portfolio_id) {
    return { erro: "Usuário GovTech precisa estar vinculado a uma empresa.", momento: Date.now() };
  }
  if (dados.data.perfil.includes("rede") && !dados.data.parceiro_rede_id) {
    return { erro: "Usuário do Canal precisa estar vinculado a um parceiro.", momento: Date.now() };
  }

  const r = await chamarFuncaoAdmin({ acao: "criar", ...dados.data });
  if (!r.ok) return { erro: r.erro ?? "Não foi possível criar o usuário.", momento: Date.now() };

  revalidatePath("/usuarios");
  return { ok: true, momento: Date.now() };
}

const esquemaEditarUsuario = z.object({
  id: obrigatorio("Usuário inválido."),
  nome: obrigatorio("Informe o nome."),
  perfil: obrigatorio("Escolha o perfil."),
  status: obrigatorio("Escolha o status."),
  empresa_portfolio_id: texto,
  parceiro_rede_id: texto,
  nova_senha: texto,
});

export async function editarUsuario(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const dados = esquemaEditarUsuario.safeParse(Object.fromEntries(formData));
  if (!dados.success) {
    return { erro: dados.error.issues[0].message, momento: Date.now() };
  }

  const { id, nova_senha, ...campos } = dados.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      ...campos,
      empresa_portfolio_id: campos.empresa_portfolio_id || null,
      parceiro_rede_id: campos.parceiro_rede_id || null,
    })
    .eq("id", id);

  if (error) return { erro: error.message, momento: Date.now() };

  if (nova_senha) {
    if (nova_senha.length < 8) {
      return { erro: "A nova senha precisa de pelo menos 8 caracteres.", momento: Date.now() };
    }
    const r = await chamarFuncaoAdmin({ acao: "redefinir_senha", usuario_id: id, senha: nova_senha });
    if (!r.ok) return { erro: r.erro ?? "Perfil salvo, mas a senha não foi alterada.", momento: Date.now() };
  }

  revalidatePath("/usuarios");
  return { ok: true, momento: Date.now() };
}
