import { createClient } from "@/lib/supabase/server";
import {
  EntregasCliente,
  type EntregaLinha,
} from "@/components/entregas/entregas-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

export const metadata = { title: "Entregas" };

export default async function EntregasPage() {
  const supabase = await createClient();

  const [{ data: entregas }, { data: contratos }] = await Promise.all([
    supabase
      .from("entregas")
      .select(
        "id, contrato_id, tipo_responsavel, responsavel_entrega, status_entrega, data_inicio, data_prevista_conclusao, data_conclusao, pendencias, observacoes, produtos ( nome_produto ), municipios ( nome, uf ), contratos ( numero_contrato )"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("contratos")
      .select("id, numero_contrato, municipios ( nome )")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Entregas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Implantações, treinamentos e fornecimentos vinculados aos contratos.
        </p>
      </div>

      <EntregasCliente
        entregas={(entregas ?? []) as unknown as EntregaLinha[]}
        contratos={(contratos ?? []).map((c) => ({
          id: c.id,
          rotulo: `${c.numero_contrato || "Sem número"}${(c as unknown as { municipios?: { nome: string } | null }).municipios ? " · " + (c as unknown as { municipios: { nome: string } }).municipios.nome : ""}`,
        })) as Opcao[]}
      />
    </div>
  );
}
