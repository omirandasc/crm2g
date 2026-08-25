"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  Search,
  LayoutDashboard,
  Building2,
  Package,
  Store,
  Map,
  Target,
  Landmark,
  FileSignature,
  Percent,
  Truck,
  ShieldCheck,
  MapPin,
  KeyRound,
  UsersRound,
  ScrollText,
  History,
  BarChart3,
} from "lucide-react";

const DESTINOS = [
  { grupo: "Ir para", itens: [
    { href: "/painel", rotulo: "Painel", icone: LayoutDashboard },
    { href: "/oportunidades", rotulo: "Funil de vendas", icone: Target },
    { href: "/relatorios", rotulo: "Relatórios", icone: BarChart3 },
    { href: "/territorios", rotulo: "Territórios", icone: Map },
    { href: "/municipios", rotulo: "Municípios", icone: MapPin },
  ]},
  { grupo: "Cadastros", itens: [
    { href: "/portfolio", rotulo: "GovTechs", icone: Building2 },
    { href: "/produtos", rotulo: "Produtos", icone: Package },
    { href: "/rede", rotulo: "Canais", icone: Store },
    { href: "/autorizacoes", rotulo: "Autorizações", icone: KeyRound },
  ]},
  { grupo: "Operação", itens: [
    { href: "/compras-publicas", rotulo: "Compras públicas", icone: Landmark },
    { href: "/contratos", rotulo: "Contratos", icone: FileSignature },
    { href: "/comissoes", rotulo: "Comissões", icone: Percent },
    { href: "/entregas", rotulo: "Entregas", icone: Truck },
    { href: "/aprovacoes", rotulo: "Aprovações", icone: ShieldCheck },
    { href: "/politicas", rotulo: "Políticas", icone: ScrollText },
    { href: "/auditoria", rotulo: "Auditoria", icone: History },
    { href: "/usuarios", rotulo: "Usuários", icone: UsersRound },
  ]},
];

type Resultado = { chave: string; rotulo: string; detalhe: string; href: string; icone: React.ElementType };

export function BuscaGlobal() {
  const [aberta, setAberta] = React.useState(false);
  const [termo, setTermo] = React.useState("");
  const [resultados, setResultados] = React.useState<Resultado[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAberta((v) => !v);
      }
    };
    document.addEventListener("keydown", atalho);
    return () => document.removeEventListener("keydown", atalho);
  }, []);

  // Busca registros no banco enquanto digita (respeitando as permissões do usuário)
  React.useEffect(() => {
    if (!aberta || termo.trim().length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      const supabase = createClient();
      const como = `%${termo.trim()}%`;
      const [oportunidades, empresas, parceiros, municipios] = await Promise.all([
        supabase
          .from("oportunidades")
          .select("id, codigo, nome_oportunidade")
          .ilike("nome_oportunidade", como)
          .limit(4),
        supabase
          .from("empresas_portfolio")
          .select("id, razao_social, nome_fantasia")
          .or(`razao_social.ilike.${como},nome_fantasia.ilike.${como}`)
          .limit(3),
        supabase
          .from("parceiros_rede")
          .select("id, razao_social, nome_fantasia")
          .or(`razao_social.ilike.${como},nome_fantasia.ilike.${como}`)
          .limit(3),
        supabase
          .from("municipios")
          .select("id, nome, uf")
          .ilike("nome", `${termo.trim()}%`)
          .limit(3),
      ]);
      const lista: Resultado[] = [
        ...(oportunidades.data ?? []).map((o) => ({
          chave: `op-${o.id}`,
          rotulo: `#${o.codigo} ${o.nome_oportunidade}`,
          detalhe: "Oportunidade",
          href: `/oportunidades/${o.id}`,
          icone: Target,
        })),
        ...(empresas.data ?? []).map((e) => ({
          chave: `em-${e.id}`,
          rotulo: e.nome_fantasia || e.razao_social,
          detalhe: "GovTech",
          href: "/portfolio",
          icone: Building2,
        })),
        ...(parceiros.data ?? []).map((p) => ({
          chave: `pa-${p.id}`,
          rotulo: p.nome_fantasia || p.razao_social,
          detalhe: "Canal",
          href: "/rede",
          icone: Store,
        })),
        ...(municipios.data ?? []).map((m) => ({
          chave: `mu-${m.id}`,
          rotulo: `${m.nome} · ${m.uf}`,
          detalhe: "Município",
          href: `/municipios?q=${encodeURIComponent(m.nome)}`,
          icone: MapPin,
        })),
      ];
      setResultados(lista);
    }, 250);
    return () => clearTimeout(t);
  }, [termo, aberta]);

  const irPara = (href: string) => {
    setAberta(false);
    setTermo("");
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAberta(true)}
        className="w-56 justify-start gap-2 text-muted-foreground font-normal hidden sm:flex"
      >
        <Search className="size-4" />
        Buscar no CRM…
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setAberta(true)}
        className="sm:hidden"
        aria-label="Buscar"
      >
        <Search className="size-4" />
      </Button>

      <CommandDialog open={aberta} onOpenChange={setAberta}>
        <Command shouldFilter={false}>
          <Command_ termo={termo} setTermo={setTermo} resultados={resultados} irPara={irPara} />
        </Command>
      </CommandDialog>
    </>
  );
}

function Command_({
  termo,
  setTermo,
  resultados,
  irPara,
}: {
  termo: string;
  setTermo: (v: string) => void;
  resultados: Resultado[];
  irPara: (href: string) => void;
}) {
  return (
    <>
      <CommandInput
        placeholder="Busque oportunidades, empresas, cidades… ou navegue"
        value={termo}
        onValueChange={setTermo}
      />
      <CommandList>
        <CommandEmpty>Nada encontrado com esse termo.</CommandEmpty>

        {resultados.length > 0 && (
          <CommandGroup heading="Registros">
            {resultados.map((r) => (
              <CommandItem key={r.chave} value={r.chave} onSelect={() => irPara(r.href)}>
                <r.icone className="size-4" />
                <span className="min-w-0 flex-1 truncate">{r.rotulo}</span>
                <span className="text-xs text-muted-foreground">{r.detalhe}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {termo.trim().length < 2 &&
          DESTINOS.map(({ grupo, itens }) => (
            <CommandGroup key={grupo} heading={grupo}>
              {itens.map(({ href, rotulo, icone: Icone }) => (
                <CommandItem key={href} value={rotulo} onSelect={() => irPara(href)}>
                  <Icone className="size-4" />
                  {rotulo}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
      </CommandList>
    </>
  );
}
