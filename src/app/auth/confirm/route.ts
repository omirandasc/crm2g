import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino do link que vai no e-mail de recuperação de senha.
 * Aceita os dois formatos que o Supabase pode mandar — `code` (fluxo PKCE,
 * modelo padrão de e-mail) e `token_hash` + `type` (modelo personalizado) —
 * cria a sessão e segue para a tela de nova senha.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");
  const proximo = searchParams.get("next") ?? "/redefinir-senha";
  // só caminhos internos, nunca um site de fora
  const destino = proximo.startsWith("/") && !proximo.startsWith("//") ? proximo : "/redefinir-senha";

  const supabase = await createClient();
  let falhou = true;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    falhou = !!error;
  } else if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo as "recovery" | "email" | "magiclink" | "invite",
      token_hash: tokenHash,
    });
    falhou = !!error;
  }

  if (falhou) {
    return NextResponse.redirect(`${origin}/login?aviso=link_invalido`);
  }
  return NextResponse.redirect(`${origin}${destino}`);
}
