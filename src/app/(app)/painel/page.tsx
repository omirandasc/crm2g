import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatarNumero } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeloTerritorio } from "@/components/selo-territorio";
import {
  Building2,
  Package,
  Store,
  Target,
  MapPin,
  FileSignature,
  ArrowRight,
  Plus,
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

  const indicadores = [
    { rotulo: "Empresas do Portfólio", valor: empresas, icone: Building2, href: "/portfolio" },
    { rotulo: "Produtos", valor: produtos, icone: Package, href: "/produtos" },
    { rotulo: "Parceiros da Rede", valor: parceiros, icone: Store, href: "/rede" },
    { rotulo: "Oportunidades", valor: oportunidades, icone: Target, href: "/oportunidades" },
    { rotulo: "Contratos", valor: contratos, icone: FileSignature, href: "/contratos" },
    { rotulo: "Municípios na base", valor: municipios, icone: MapPin, href: "/municipios" },
  ];

  const passos = [
    { feito: empresas > 0, texto: "Cadastrar as empresas do Portfólio e seus produtos", href: "/portfolio" },
    { feito: parceiros > 0, texto: "Cadastrar os parceiros da Rede e autorizar produtos", href: "/rede" },
    { feito: false, texto: "Cada revenda escolhe suas 10 cidades em “Minha área”", href: "/territorios" },
    { feito: oportunidades > 0, texto: "Registrar oportunidades no funil, com as travas ativas", href: "/oportunidades" },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral da operação comercial B2G.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/oportunidades" />}>
          <Plus className="size-4" />
          Nova oportunidade
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {indicadores.map(({ rotulo, valor, icone: Icone, href }) => (
          <Link key={rotulo} href={href} className="group">
            <Card className="transition-colors group-hover:border-marca-200">
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  {rotulo}
                  <Icone className="size-4 text-marca-600" strokeWidth={1.8} />
                </CardDescription>
                <CardTitle className="font-display text-3xl tabular-nums">
                  {formatarNumero(valor)}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Primeiros passos</CardTitle>
            <CardDescription>
              O caminho para colocar a operação de pé, na ordem certa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {passos.map(({ feito, texto, href }, i) => (
                <li key={texto}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 text-sm group"
                  >
                    <span
                      className={
                        feito
                          ? "grid size-6 shrink-0 place-items-center rounded-full bg-sucesso-fundo text-sucesso text-xs font-semibold"
                          : "grid size-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground text-xs font-semibold"
                      }
                    >
                      {feito ? "✓" : i + 1}
                    </span>
                    <span className={feito ? "text-muted-foreground line-through" : ""}>
                      {texto}
                    </span>
                    <ArrowRight className="ml-auto size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">Como funciona o território</CardTitle>
            <CardDescription>
              A linguagem de status que você verá em todo o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <SeloTerritorio status="livre" className="mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                Cidade disponível: qualquer revenda pode solicitá-la.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <SeloTerritorio status="preferencial" className="mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                Reservada a uma revenda para prospecção — cada uma mantém sempre 10 cidades.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <SeloTerritorio status="exclusiva" className="mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                Contrato assinado: a cidade passa a ser exclusiva da revenda e abre uma vaga na preferencial.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
