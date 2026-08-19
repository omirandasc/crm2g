import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ProdutoDetalheCliente,
  type PrecoLinha,
  type MaterialLinha,
} from "@/components/produtos/produto-detalhe-cliente";
import type { ProdutoLinha, EmpresaOpcao } from "@/components/produtos/produtos-cliente";
import { Pilula } from "@/components/selo-territorio";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { STATUS_PRODUTO, TOM_STATUS_PRODUTO } from "@/lib/dominio";

export const metadata = { title: "Produto" };

export default async function ProdutoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: produto } = await supabase
    .from("produtos")
    .select("*, empresas_portfolio ( razao_social, nome_fantasia )")
    .eq("id", id)
    .single();

  if (!produto) notFound();

  const [{ data: precos }, { data: materiais }, { data: empresas }] =
    await Promise.all([
      supabase
        .from("precos_produto")
        .select(
          "id, tipo_preco, valor, faixa_inicial, faixa_final, preco_minimo_permitido, desconto_maximo, data_inicio_vigencia, data_fim_vigencia, observacoes"
        )
        .eq("produto_id", id)
        .order("faixa_inicial", { ascending: true, nullsFirst: true }),
      supabase
        .from("materiais_produto")
        .select("id, nome_material, tipo_material, nivel_visibilidade, descricao, arquivo_url")
        .eq("produto_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("empresas_portfolio").select("id, razao_social, nome_fantasia").order("razao_social"),
    ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/produtos" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{produto.nome_produto}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {produto.empresas_portfolio?.nome_fantasia || produto.empresas_portfolio?.razao_social}
          </p>
        </div>
        <Pilula tom={TOM_STATUS_PRODUTO[produto.status] ?? "neutro"}>
          {STATUS_PRODUTO[produto.status] ?? produto.status}
        </Pilula>
      </div>

      <ProdutoDetalheCliente
        produto={produto as unknown as ProdutoLinha}
        precos={(precos ?? []) as PrecoLinha[]}
        materiais={(materiais ?? []) as MaterialLinha[]}
        empresas={(empresas ?? []) as EmpresaOpcao[]}
      />
    </div>
  );
}
