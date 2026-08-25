import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatarNumero, formatarMoeda } from "@/lib/utils";
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
  AgendaProximosPassos,
  type PassoAgenda,
} from "@/components/painel/agenda-proximos-passos";
import { ehRede, ehPortfolio } from "@/lib/dominio";
import {
  Building2,
  Package,
  Store,
  Target,
  MapPin,
  FileSignature,
  ArrowRight,
  Plus,
  Map,
  Percent,
  TrendingUp,
  Trophy,
} from "lucide-react";

export const metadata = { title: "Painel" };

type Cliente = Awaited<ReturnType<typeof createClient>>;

async function contar(supabase: Cliente, tabela: string, filtro?: (q: any) => any) {
  let consulta = supabase.from(tabela).select("*", { count: "exact", head: true });
  if (filtro) consulta = filtro(consulta);
  const { count } = await consulta;
  return count ?? 0;
}

export default async function PainelPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("perfil, nome, parceiro_rede_id, empresa_portfolio_id")
    .eq("id", user!.id)
    .single();

  const rede = ehRede(perfil?.perfil);
  const portfolio = ehPortfolio(perfil?.perfil);

  // Agenda: próximos passos das oportunidades visíveis (RLS filtra por perfil)
  const { data: passos } = await supabase
    .from("oportunidades")
    .select("id, codigo, nome_oportunidade, proximo_passo, data_proximo_passo")
    .not("proximo_passo", "is", null)
    .in("status", ["aberta", "em_andamento"])
    .order("data_proximo_passo", { ascending: true, nullsFirst: false })
    .limit(6);

  // Valor do funil em aberto e negócios ganhos (RLS filtra por perfil)
  const { data: valores } = await supabase
    .from("oportunidades")
    .select("valor_venda, status");
  const funilAberto = (valores ?? [])
    .filter((o) => ["aberta", "em_andamento"].includes(o.status))
    .reduce((acc, o) => acc + (o.valor_venda ?? 0), 0);
  const ganhas = (valores ?? []).filter((o) => o.status === "ganha").length;

  let indicadores: { rotulo: string; valor: string; icone: React.ElementType; href: string }[];

  if (rede) {
    const [oportunidades, prefAtivas, exclusivas, contratos] = await Promise.all([
      contar(supabase, "oportunidades"),
      contar(supabase, "areas_preferenciais", (q) => q.in("status", ["aprovada", "ativa"])),
      contar(supabase, "areas_exclusivas"),
      contar(supabase, "contratos"),
    ]);
    indicadores = [
      { rotulo: "Minhas oportunidades", valor: formatarNumero(oportunidades), icone: Target, href: "/oportunidades" },
      { rotulo: "Funil em aberto", valor: formatarMoeda(funilAberto), icone: TrendingUp, href: "/oportunidades" },
      { rotulo: "Cidades preferenciais", valor: `${prefAtivas}/10`, icone: Map, href: "/minha-area" },
      { rotulo: "Cidades exclusivas", valor: formatarNumero(exclusivas), icone: Trophy, href: "/minha-area" },
      { rotulo: "Contratos", valor: formatarNumero(contratos), icone: FileSignature, href: "/contratos" },
      { rotulo: "Negócios ganhos", valor: formatarNumero(ganhas), icone: Trophy, href: "/oportunidades" },
    ];
  } else if (portfolio) {
    const [produtos, oportunidades, contratos, entregas] = await Promise.all([
      contar(supabase, "produtos"),
      contar(supabase, "oportunidades"),
      contar(supabase, "contratos"),
      contar(supabase, "entregas"),
    ]);
    indicadores = [
      { rotulo: "Meus produtos", valor: formatarNumero(produtos), icone: Package, href: "/produtos" },
      { rotulo: "Oportunidades dos produtos", valor: formatarNumero(oportunidades), icone: Target, href: "/oportunidades" },
      { rotulo: "Funil em aberto", valor: formatarMoeda(funilAberto), icone: TrendingUp, href: "/oportunidades" },
      { rotulo: "Contratos", valor: formatarNumero(contratos), icone: FileSignature, href: "/contratos" },
      { rotulo: "Entregas", valor: formatarNumero(entregas), icone: Package, href: "/entregas" },
      { rotulo: "Negócios ganhos", valor: formatarNumero(ganhas), icone: Trophy, href: "/oportunidades" },
    ];
  } else {
    const [empresas, produtos, parceiros, municipios, oportunidades, contratos] =
      await Promise.all([
        contar(supabase, "empresas_portfolio"),
        contar(supabase, "produtos"),
        contar(supabase, "parceiros_rede"),
        contar(supabase, "municipios"),
        contar(supabase, "oportunidades"),
        contar(supabase, "contratos"),
      ]);
    indicadores = [
      { rotulo: "Funil em aberto", valor: formatarMoeda(funilAberto), icone: TrendingUp, href: "/oportunidades" },
      { rotulo: "Oportunidades", valor: formatarNumero(oportunidades), icone: Target, href: "/oportunidades" },
      { rotulo: "Contratos", valor: formatarNumero(contratos), icone: FileSignature, href: "/contratos" },
      { rotulo: "GovTechs", valor: formatarNumero(empresas), icone: Building2, href: "/portfolio" },
      { rotulo: "Produtos", valor: formatarNumero(produtos), icone: Package, href: "/produtos" },
      { rotulo: "Canais", valor: formatarNumero(parceiros), icone: Store, href: "/rede" },
    ];
    void municipios;
  }

  const primeiroNome = perfil?.nome?.split(" ")[0] ?? "";

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {primeiroNome ? `Olá, ${primeiroNome}` : "Painel"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rede
              ? "Suas cidades, seu funil e seus resultados."
              : portfolio
                ? "O desempenho dos seus produtos no ecossistema."
                : "Visão geral da operação comercial B2G."}
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
            <Card className="transition-colors group-hover:border-marca-600/40">
              <CardHeader>
                <CardDescription className="flex items-center justify-between">
                  {rotulo}
                  <Icone className="size-4 text-marca-600" strokeWidth={1.8} />
                </CardDescription>
                <CardTitle className="font-display text-3xl tabular-nums">
                  {valor}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AgendaProximosPassos passos={(passos ?? []) as PassoAgenda[]} />

        {rede || portfolio ? (
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
                  Reservada para prospecção — cada Canal mantém até 20 cidades (a Governança pode ajustar).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <SeloTerritorio status="exclusiva" className="mt-0.5 shrink-0" />
                <p className="text-muted-foreground">
                  Contrato assinado: a cidade passa a ser exclusiva da revenda e
                  abre uma vaga na preferencial.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Primeiros passos</CardTitle>
              <CardDescription>
                O caminho para colocar a operação de pé, na ordem certa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  { texto: "Cadastrar as GovTechs e seus produtos", href: "/portfolio" },
                  { texto: "Cadastrar os canais e autorizar produtos", href: "/rede" },
                  { texto: "Aprovar as cidades preferenciais das revendas", href: "/territorios" },
                  { texto: "Acompanhar oportunidades, contratos e comissões", href: "/oportunidades" },
                ].map(({ texto, href }, i) => (
                  <li key={texto}>
                    <Link href={href} className="flex items-center gap-3 text-sm group">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground text-xs font-semibold">
                        {i + 1}
                      </span>
                      {texto}
                      <ArrowRight className="ml-auto size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
