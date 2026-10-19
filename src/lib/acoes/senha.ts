"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ResultadoAcao } from "@/lib/acoes/cadastros";

const MINIMO = 8;

function validarNova(nova: string, confirmar: string): string | null {
  if (nova.length < MINIMO) return `A nova senha precisa de pelo menos ${MINIMO} caracteres.`;
  if (nova !== confirmar) return "A confirmação não confere com a nova senha.";
  return null;
}

// Endereço público do CRM, para montar o link que vai no e-mail.
async function origemDoSite() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "crm.doisge.tec.br";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// ── Usuário logado troca a própria senha (menu do canto) ───────
export async function alterarMinhaSenha(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const atual = String(formData.get("senha_atual") ?? "");
  const nova = String(formData.get("nova_senha") ?? "");
  const confirmar = String(formData.get("confirmar_senha") ?? "");

  if (!atual) return { erro: "Informe a senha atual.", momento: Date.now() };
  const invalida = validarNova(nova, confirmar);
  if (invalida) return { erro: invalida, momento: Date.now() };
  if (nova === atual) return { erro: "A nova senha precisa ser diferente da atual.", momento: Date.now() };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { erro: "Sessão expirada. Entre novamente.", momento: Date.now() };

  // Confirma a senha atual antes de trocar — evita troca por quem achou a
  // sessão aberta num computador alheio.
  const { error: erroAtual } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: atual,
  });
  if (erroAtual) return { erro: "A senha atual está incorreta.", momento: Date.now() };

  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) return { erro: traduzirErroSenha(error.message), momento: Date.now() };

  return { ok: true, momento: Date.now() };
}

// ── "Esqueci minha senha": envia o link por e-mail ──────────────
export async function solicitarRecuperacao(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { erro: "Informe o e-mail cadastrado.", momento: Date.now() };

  const supabase = await createClient();
  const origem = await origemDoSite();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/confirm?next=/redefinir-senha`,
  });

  // Resposta igual para e-mail existente ou não: ninguém descobre quais
  // e-mails estão cadastrados. Só o limite de envios vira mensagem.
  if (error && /rate limit|too many/i.test(error.message)) {
    return { erro: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.", momento: Date.now() };
  }
  if (error) console.error("[recuperacao de senha]", error.message);

  return { ok: true, momento: Date.now() };
}

// ── Define a nova senha a partir do link do e-mail ──────────────
export async function redefinirSenha(
  _prev: ResultadoAcao,
  formData: FormData
): Promise<ResultadoAcao> {
  const nova = String(formData.get("nova_senha") ?? "");
  const confirmar = String(formData.get("confirmar_senha") ?? "");
  const invalida = validarNova(nova, confirmar);
  if (invalida) return { erro: invalida, momento: Date.now() };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "O link expirou ou já foi usado. Peça um novo em “Esqueci minha senha”.", momento: Date.now() };

  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) return { erro: traduzirErroSenha(error.message), momento: Date.now() };

  redirect("/painel");
}

function traduzirErroSenha(mensagem: string) {
  if (/different from the old password/i.test(mensagem)) return "A nova senha precisa ser diferente da atual.";
  if (/weak|pwned|leaked|compromised/i.test(mensagem)) {
    return "Essa senha apareceu em vazamentos conhecidos. Escolha outra, mais difícil de adivinhar.";
  }
  if (/at least/i.test(mensagem)) return `A senha precisa de pelo menos ${MINIMO} caracteres.`;
  return `Não foi possível alterar a senha (${mensagem}).`;
}
