import { createClient } from "@/lib/supabase/server";
import { formatarNumero } from "@/lib/utils";
import {
  Building2,
  Package,
  Store,
  Target,
  MapPin,
  FileSignature,
} from "lucide-react";

export const metadata = { title: "Painel" };

async function contar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tabela: string
) {
  const { count } = await supabase
    .from(tabela)
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function PainelPage() {
  const supabase = await createClient();

  const [empresas, produtos, parceiros, municipios, oportunidades, contratos] =
    await Promise.all([
      contar(supabase, "empresas_portfolio"),
      contar(supabase, "produtos"),
      contar(supabase, "parceiros_rede"),
      contar(supabase, "municipios"),
      contar(supabase, "oportunidades"),
      contar(supabase, "contratos"),
    ]);

  const cartoes = [
    { rotulo: "Empresas do Portfólio", valor: empresas, icone: Building2, href: "/portfolio" },
    { rotulo: "Produtos", valor: produtos, icone: Package, href: "/produtos" },
    { rotulo: "Parceiros da Rede", valor: parceiros, icone: Store, href: "/rede" },
    { rotulo: "Municípios na base", valor: municipios, icone: MapPin, href: "/municipios" },
    { rotulo: "Oportunidades", valor: oportunidades, icone: Target, href: "/oportunidades" },
    { rotulo: "Contratos", valor: contratos, icone: FileSignature, href: "/contratos" },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
      <p className="mt-1 text-sm text-tinta-suave">
        Visão geral da operação comercial.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartoes.map(({ rotulo, valor, icone: Icone, href }) => (
          <a
            key={rotulo}
            href={href}
            className="rounded-lg border border-linha bg-cartao p-5 shadow-cartao hover:border-marca-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-tinta-suave">{rotulo}</p>
              <Icone size={18} className="text-marca-600" strokeWidth={1.8} />
            </div>
            <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
              {formatarNumero(valor)}
            </p>
          </a>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-linha bg-cartao p-5 shadow-cartao">
        <h2 className="font-display font-semibold">Primeiros passos</h2>
        <ol className="mt-3 space-y-2 text-sm text-tinta-suave list-decimal list-inside">
          <li>Cadastre as empresas do Portfólio e seus produtos.</li>
          <li>Cadastre os parceiros da Rede e autorize os produtos que cada um pode vender.</li>
          <li>Cada revenda escolhe suas 10 cidades preferenciais em “Minha área”.</li>
          <li>As oportunidades passam a ser registradas no funil — com as travas de território e preço ativas.</li>
        </ol>
      </div>
    </div>
  );
}
