import { createClient } from "@/lib/supabase/server";
import {
  AprovacoesCliente,
  type SolicitacaoLinha,
} from "@/components/aprovacoes/aprovacoes-cliente";

export const metadata = { title: "Aprovações" };

export default async function AprovacoesPage() {
  const supabase = await createClient();

  const { data: solicitacoes } = await supabase
    .from("solicitacoes_aprovacao")
    .select(
      "id, tipo_solicitacao, descricao, status, data_solicitacao, data_decisao, motivo_decisao, profiles!solicitacoes_solicitante_fkey ( nome )"
    )
    .order("data_solicitacao", { ascending: false });

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aprovações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicitações que dependem de decisão da Governança DOISGE.
        </p>
      </div>

      <AprovacoesCliente
        solicitacoes={(solicitacoes ?? []) as unknown as SolicitacaoLinha[]}
      />
    </div>
  );
}
