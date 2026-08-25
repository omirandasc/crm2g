import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FichaEntidade } from "@/components/cadastros/ficha-entidade";
import type { EmpresaLinha } from "@/components/portfolio/portfolio-cliente";
import type { SocioLinha, CertidaoLinha } from "@/components/cadastros/socios-certidoes";
import { Pilula } from "@/components/selo-territorio";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { STATUS_EMPRESA, TOM_STATUS_EMPRESA } from "@/lib/dominio";

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

  const [{ data: socios }, { data: certidoes }] = await Promise.all([
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
      />
    </div>
  );
}
