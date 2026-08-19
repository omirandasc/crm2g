"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
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
} from "lucide-react";

const DESTINOS = [
  { grupo: "Ir para", itens: [
    { href: "/painel", rotulo: "Painel", icone: LayoutDashboard },
    { href: "/oportunidades", rotulo: "Funil de vendas", icone: Target },
    { href: "/territorios", rotulo: "Territórios", icone: Map },
    { href: "/municipios", rotulo: "Municípios", icone: MapPin },
  ]},
  { grupo: "Cadastros", itens: [
    { href: "/portfolio", rotulo: "Empresas do Portfólio", icone: Building2 },
    { href: "/produtos", rotulo: "Produtos", icone: Package },
    { href: "/rede", rotulo: "Parceiros da Rede", icone: Store },
    { href: "/autorizacoes", rotulo: "Autorizações", icone: KeyRound },
  ]},
  { grupo: "Operação", itens: [
    { href: "/compras-publicas", rotulo: "Compras públicas", icone: Landmark },
    { href: "/contratos", rotulo: "Contratos", icone: FileSignature },
    { href: "/comissoes", rotulo: "Comissões", icone: Percent },
    { href: "/entregas", rotulo: "Entregas", icone: Truck },
    { href: "/aprovacoes", rotulo: "Aprovações", icone: ShieldCheck },
    { href: "/usuarios", rotulo: "Usuários", icone: UsersRound },
  ]},
];

export function BuscaGlobal() {
  const [aberta, setAberta] = React.useState(false);
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
        <CommandInput placeholder="Digite para onde quer ir…" />
        <CommandList>
          <CommandEmpty>Nada encontrado com esse termo.</CommandEmpty>
          {DESTINOS.map(({ grupo, itens }) => (
            <CommandGroup key={grupo} heading={grupo}>
              {itens.map(({ href, rotulo, icone: Icone }) => (
                <CommandItem
                  key={href}
                  onSelect={() => {
                    setAberta(false);
                    router.push(href);
                  }}
                >
                  <Icone className="size-4" />
                  {rotulo}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
