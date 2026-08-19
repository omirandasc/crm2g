import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MinhaAreaCliente,
  type MinhaAreaPreferencial,
  type MinhaAreaExclusiva,
} from "@/components/minha-area/minha-area-cliente";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import { Map } from "lucide-react";

export const metadata = { title: "Minha área" };

export default async function MinhaAreaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("parceiro_rede_id")
    .eq("id", user!.id)
    .single();

  if (!perfil?.parceiro_rede_id) {
    return (
      <div className="max-w-2xl space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">Minha área</h1>
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Map className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Visão exclusiva da Rede</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta tela mostra as cidades preferenciais e exclusivas do parceiro
            logado. Como Governança, use{" "}
            <Link href="/territorios" className="font-medium text-marca-700 underline">
              Territórios
            </Link>{" "}
            para ver todas as áreas.
          </p>
        </div>
      </div>
    );
  }

  const parceiroId = perfil.parceiro_rede_id;

  const [
    { data: preferenciais },
    { data: exclusivas },
    { data: autorizacoes },
  ] = await Promise.all([
    supabase
      .from("areas_preferenciais")
      .select("id, status, data_solicitacao, produtos ( nome_produto ), municipios ( nome, uf )")
      .eq("parceiro_rede_id", parceiroId)
      .order("data_solicitacao", { ascending: false }),
    supabase
      .from("areas_exclusivas")
      .select("id, status, data_inicio, produtos ( nome_produto ), municipios ( nome, uf )")
      .eq("parceiro_rede_id", parceiroId)
      .order("data_inicio", { ascending: false }),
    supabase
      .from("autorizacoes_parceiro_produto")
      .select("produto_id, qtd_max_municipios_preferenciais, status, produtos ( nome_produto )")
      .eq("parceiro_rede_id", parceiroId)
      .eq("status", "ativa"),
  ]);

  const limite = Math.max(
    10,
    ...(autorizacoes ?? []).map((a) => a.qtd_max_municipios_preferenciais ?? 10)
  );

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minha área</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suas cidades preferenciais (prospecção) e exclusivas (contratos fechados).
        </p>
      </div>

      <MinhaAreaCliente
        parceiroId={parceiroId}
        limite={limite}
        preferenciais={(preferenciais ?? []) as unknown as MinhaAreaPreferencial[]}
        exclusivas={(exclusivas ?? []) as unknown as MinhaAreaExclusiva[]}
        produtosAutorizados={(autorizacoes ?? []).map((a) => {
          const produto = (a as unknown as { produtos: { nome_produto: string } | null }).produtos;
          return { id: a.produto_id, rotulo: produto?.nome_produto ?? "Produto" };
        }) as Opcao[]}
      />
    </div>
  );
}
