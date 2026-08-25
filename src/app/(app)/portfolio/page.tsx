import { createClient } from "@/lib/supabase/server";
import { PortfolioCliente, type EmpresaLinha } from "@/components/portfolio/portfolio-cliente";

export const metadata = { title: "GovTechs" };

export default async function PortfolioPage() {
  const supabase = await createClient();

  const { data: empresas } = await supabase
    .from("empresas_portfolio")
    .select(
      "id, razao_social, nome_fantasia, cnpj, cidade, uf, segmento, site, status, responsavel_principal, email_responsavel, telefone_responsavel, observacoes"
    )
    .order("razao_social");

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GovTechs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Empresas donas dos produtos vendidos pelo ecossistema. Clique numa linha para abrir a ficha completa.
        </p>
      </div>

      <PortfolioCliente empresas={(empresas ?? []) as EmpresaLinha[]} />
    </div>
  );
}
