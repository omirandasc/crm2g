import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularioRedefinir } from "./formulario-redefinir";

export const metadata = { title: "Nova senha" };

export default async function RedefinirSenhaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Só chega aqui quem veio pelo link do e-mail (ou já está logado).
  if (!user) redirect("/login?aviso=link_invalido");

  return <FormularioRedefinir email={user.email ?? ""} />;
}
