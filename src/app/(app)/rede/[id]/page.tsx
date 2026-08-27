import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FichaEntidade } from "@/components/cadastros/ficha-entidade";
import type { ParceiroLinha } from "@/components/rede/rede-cliente";
import type { SocioLinha, CertidaoLinha } from "@/components/cadastros/socios-certidoes";
import { Pilula } from "@/components/selo-territorio";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { STATUS_PARCEIRO, TOM_STATUS_PARCEIRO, TIPOS_PARCEIRO } from "@/lib/dominio";

export const metadata = { title: "Canal" };

export default async function CanalDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: parceiro } = await supabase
    .from("parceiros_rede")
    .select("*")
    .eq("id", id)
    .single();

  if (!parceiro) notFound();

  const [
    { data: socios },
    { data: certidoes },
    { data: autorizacoes },
    { data: preferenciais },
    { data: exclusivas },
  ] = await Promise.all([
    supabase
      .from("socios")
      .select("id, nome, cpf, percentual, email, telefone")
      .eq("entidade", "parceiro_rede")
      .eq("entidade_id", id)
      .order("percentual", { ascending: false }),
    supabase
      .from("certidoes")
      .select("id, nome, data_validade, arquivo_url")
      .eq("entidade", "parceiro_rede")
      .eq("entidade_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("autorizacoes_parceiro_produto")
      .select("produto_id, produtos ( nome_produto )")
      .eq("parceiro_rede_id", id)
      .eq("status", "ativa"),
    supabase
      .from("areas_preferenciais")
      .select("id, status, data_inicio, produtos ( nome_produto ), municipios ( nome, uf )")
      .eq("parceiro_rede_id", id)
      .in("status", ["solicitada", "em_analise", "aprovada", "ativa"])
      .order("data_inicio", { ascending: false }),
    supabase
      .from("areas_exclusivas")
      .select("id, data_inicio, produtos ( nome_produto ), municipios ( nome, uf )")
      .eq("parceiro_rede_id", id)
      .eq("status", "ativa")
      .order("data_inicio", { ascending: false }),
  ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/rede" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {parceiro.nome_fantasia || parceiro.razao_social}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Canal · {TIPOS_PARCEIRO[parceiro.tipo_parceiro] ?? parceiro.tipo_parceiro}
            {(parceiro.ufs_credenciamento?.length
              ? ` · credenciado em ${parceiro.ufs_credenciamento.join(", ")}`
              : parceiro.uf_credenciamento
                ? ` · credenciado em ${parceiro.uf_credenciamento}`
                : "")}
          </p>
        </div>
        <Pilula tom={TOM_STATUS_PARCEIRO[parceiro.status] ?? "neutro"}>
          {STATUS_PARCEIRO[parceiro.status] ?? parceiro.status}
        </Pilula>
      </div>

      <FichaEntidade
        entidade="parceiro_rede"
        parceiro={parceiro as unknown as ParceiroLinha}
        socios={(socios ?? []) as SocioLinha[]}
        certidoes={(certidoes ?? []) as CertidaoLinha[]}
        territorio={{
          limite: (parceiro as { limite_cidades_preferenciais?: number }).limite_cidades_preferenciais ?? 30,
          ufs: (parceiro as { ufs_credenciamento?: string[] }).ufs_credenciamento ?? [],
          produtos: (autorizacoes ?? []).map((a) => ({
            id: a.produto_id,
            rotulo:
              (a.produtos as unknown as { nome_produto: string } | null)?.nome_produto ??
              "Produto",
          })),
          preferenciais: (preferenciais ?? []) as unknown as import("@/components/rede/territorio-canal").AreaLinha[],
          exclusivas: (exclusivas ?? []) as unknown as import("@/components/rede/territorio-canal").ExclusivaLinha[],
        }}
      />
    </div>
  );
}
