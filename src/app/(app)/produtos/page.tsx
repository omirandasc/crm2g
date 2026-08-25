import { createClient } from "@/lib/supabase/server";
import {
  ProdutosCliente,
  type ProdutoLinha,
  type EmpresaOpcao,
} from "@/components/produtos/produtos-cliente";

export const metadata = { title: "Produtos" };

export default async function ProdutosPage() {
  const supabase = await createClient();

  const [{ data: produtos }, { data: empresas }] = await Promise.all([
    supabase
      .from("produtos")
      .select(
        "id, empresa_portfolio_id, nome_produto, descricao_curta, segmento, vertical, tipo_produto, recorrente, modelo_contratacao_publica_indicado, prazo_contrato_padrao_meses, status, empresas_portfolio ( razao_social, nome_fantasia )"
      )
      .order("nome_produto"),
    supabase
      .from("empresas_portfolio")
      .select("id, razao_social, nome_fantasia")
      .order("razao_social"),
  ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogo de soluções das GovTechs. Clique numa linha para editar.
        </p>
      </div>

      <ProdutosCliente
        produtos={(produtos ?? []) as unknown as ProdutoLinha[]}
        empresas={(empresas ?? []) as EmpresaOpcao[]}
      />
    </div>
  );
}
