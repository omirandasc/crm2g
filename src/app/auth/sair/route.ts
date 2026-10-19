import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MOTIVOS = new Set(["inativo"]);

/** Encerra a sessão e volta ao login com o motivo (ex.: acesso inativo). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const motivo = request.nextUrl.searchParams.get("motivo") ?? "";
  const destino = MOTIVOS.has(motivo) ? `/login?motivo=${motivo}` : "/login";
  return NextResponse.redirect(`${request.nextUrl.origin}${destino}`);
}
