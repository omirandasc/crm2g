import { createClient } from "@/lib/supabase/server";
import {
  AuditoriaCliente,
  type RegistroAuditoria,
} from "@/components/auditoria/auditoria-cliente";

export const metadata = { title: "Auditoria" };

export default async function AuditoriaPage() {
  const supabase = await createClient();

  const { data: registros } = await supabase
    .from("historico_alteracoes")
    .select(
      "id, entidade, entidade_id, campo_alterado, valor_anterior, valor_novo, data_alteracao, profiles!historico_usuario_fkey ( nome )"
    )
    .order("data_alteracao", { ascending: false })
    .limit(300);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rastro automático de tudo que mudou: quem alterou, quando e qual era o
          valor anterior.
        </p>
      </div>

      <AuditoriaCliente
        registros={(registros ?? []) as unknown as RegistroAuditoria[]}
      />
    </div>
  );
}
