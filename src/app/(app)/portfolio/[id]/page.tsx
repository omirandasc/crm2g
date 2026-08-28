import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FichaEntidade } from "@/components/cadastros/ficha-entidade";
import type { EmpresaLinha } from "@/components/portfolio/portfolio-cliente";
import type { SocioLinha, CertidaoLinha } from "@/components/cadastros/socios-certidoes";
import { Pilula } from "@/components/selo-territorio";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { STATUS_EMPRESA, TOM_STATUS_EMPRESA, ehDoisge } from "@/lib/dominio";

export const metadata = { title: "GovTech" };

export default async function GovTechDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: empresa } = await supabase
    .from("empresas_portfolio")
    .select("*")
    .eq("id", id)
    .single();

  if (!empresa) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: socios }, { data: certidoes }, { data: produtos }] =
    await Promise.all([
      supabase.from("profiles").select("perfil").eq("id", user!.id).single(),
      supabase
        .from("socios")
        .select("id, nome, cpf, percentual, email, telefone")
        .eq("entidade", "empresa_portfolio")
        .eq("entidade_id", id)
        .order("percentual", { ascending: false }),
      supabase
        .from("certidoes")
        .select("id, nome, data_validade, arquivo_url")
        .eq("entidade", "empresa_portfolio")
        .eq("entidade_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("produtos").select("id").eq("empresa_portfolio_id", id),
    ]);

  // Checklist de implantação: o sistema confere sozinho o que já existe
  const idsProdutos = (produtos ?? []).map((p) => p.id);
  const [politicas, precos, playbook, termoRef] = await Promise.all([
    supabase
      .from("politicas_comerciais")
      .select("id", { count: "exact", head: true })
      .eq("empresa_portfolio_id", id)
      .then((r) => r.count ?? 0),
    idsProdutos.length
      ? supabase
          .from("precos_produto")
          .select("id", { count: "exact", head: true })
          .in("produto_id", idsProdutos)
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
    idsProdutos.length
      ? supabase
          .from("materiais_produto")
          .select("id", { count: "exact", head: true })
          .in("produto_id", idsProdutos)
          .in("tipo_material", ["apresentacao_comercial", "manual"])
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
    idsProdutos.length
      ? supabase
          .from("materiais_produto")
          .select("id", { count: "exact", head: true })
          .in("produto_id", idsProdutos)
          .eq("tipo_material", "termo_referencia")
          .then((r) => r.count ?? 0)
      : Promise.resolve(0),
  ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/portfolio" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {empresa.nome_fantasia || empresa.razao_social}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            GovTech · {empresa.razao_social}
            {empresa.cnpj && ` · CNPJ ${empresa.cnpj}`}
          </p>
        </div>
        <Pilula tom={TOM_STATUS_EMPRESA[empresa.status] ?? "neutro"}>
          {STATUS_EMPRESA[empresa.status] ?? empresa.status}
        </Pilula>
      </div>

      <FichaEntidade
        entidade="empresa_portfolio"
        empresa={empresa as unknown as EmpresaLinha}
        socios={(socios ?? []) as SocioLinha[]}
        certidoes={(certidoes ?? []) as CertidaoLinha[]}
        negocio={
          ehDoisge(perfil?.perfil)
            ? {
                negocio: {
                  status: empresa.status,
                  modelo_negocio: empresa.modelo_negocio ?? null,
                  modulos: empresa.modulos ?? null,
                  proposta_trabalho: empresa.proposta_trabalho ?? null,
                  condicoes_financeiras: empresa.condicoes_financeiras ?? null,
                  modelo_distribuicao: empresa.modelo_distribuicao ?? null,
                  remuneracao_canal: empresa.remuneracao_canal ?? null,
                },
                checklist: { politicas, precos, playbook, termoReferencia: termoRef },
              }
            : null
        }
      />
    </div>
  );
}
