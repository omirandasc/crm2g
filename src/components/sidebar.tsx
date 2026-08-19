"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ehDoisge, ehPortfolio, ehRede } from "@/lib/dominio";

type Item = { href: string; rotulo: string; icone: React.ElementType };

function itensPorPerfil(perfil: string): { grupo: string; itens: Item[] }[] {
  if (ehRede(perfil)) {
    return [
      {
        grupo: "Comercial",
        itens: [
          { href: "/painel", rotulo: "Painel", icone: LayoutDashboard },
          { href: "/oportunidades", rotulo: "Funil de vendas", icone: Target },
          { href: "/minha-area", rotulo: "Minha área", icone: Map },
          { href: "/produtos", rotulo: "Produtos autorizados", icone: Package },
        ],
      },
      {
        grupo: "Operação",
        itens: [
          { href: "/contratos", rotulo: "Contratos", icone: FileSignature },
          { href: "/entregas", rotulo: "Entregas", icone: Truck },
          { href: "/comissoes", rotulo: "Comissões", icone: Percent },
        ],
      },
    ];
  }
  if (ehPortfolio(perfil)) {
    return [
      {
        grupo: "Portfólio",
        itens: [
          { href: "/painel", rotulo: "Painel", icone: LayoutDashboard },
          { href: "/produtos", rotulo: "Meus produtos", icone: Package },
          { href: "/oportunidades", rotulo: "Funil dos produtos", icone: Target },
          { href: "/contratos", rotulo: "Contratos", icone: FileSignature },
          { href: "/entregas", rotulo: "Entregas", icone: Truck },
        ],
      },
    ];
  }
  // Governança DOISGE (e perfil consulta)
  return [
    {
      grupo: "Visão geral",
      itens: [{ href: "/painel", rotulo: "Painel", icone: LayoutDashboard }],
    },
    {
      grupo: "Cadastros",
      itens: [
        { href: "/portfolio", rotulo: "Portfólio", icone: Building2 },
        { href: "/produtos", rotulo: "Produtos", icone: Package },
        { href: "/rede", rotulo: "Rede", icone: Store },
        { href: "/municipios", rotulo: "Municípios", icone: MapPin },
      ],
    },
    {
      grupo: "Comercial",
      itens: [
        { href: "/oportunidades", rotulo: "Funil de vendas", icone: Target },
        { href: "/territorios", rotulo: "Territórios", icone: Map },
        { href: "/compras-publicas", rotulo: "Compras públicas", icone: Landmark },
        { href: "/contratos", rotulo: "Contratos", icone: FileSignature },
      ],
    },
    {
      grupo: "Governança",
      itens: [
        { href: "/comissoes", rotulo: "Comissões", icone: Percent },
        { href: "/entregas", rotulo: "Entregas", icone: Truck },
        { href: "/aprovacoes", rotulo: "Aprovações", icone: ShieldCheck },
      ],
    },
  ];
}

export function Sidebar({ perfil }: { perfil: string }) {
  const pathname = usePathname();
  const grupos = itensPorPerfil(perfil);

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-marca-950 text-white">
      <div className="flex items-center gap-2.5 px-5 h-16">
        <div className="h-8 w-8 rounded-md bg-marca-600 grid place-items-center font-display font-bold">
          2G
        </div>
        <span className="font-display font-semibold tracking-tight">CRM DOISGE</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-6">
        {grupos.map(({ grupo, itens }) => (
          <div key={grupo}>
            <p className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-marca-200/60">
              {grupo}
            </p>
            <ul className="space-y-0.5">
              {itens.map(({ href, rotulo, icone: Icone }) => {
                const ativo = pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        ativo
                          ? "bg-marca-600 text-white font-medium"
                          : "text-marca-100/80 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icone size={16} strokeWidth={1.8} />
                      {rotulo}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
