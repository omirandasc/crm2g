"use client";

import * as React from "react";
import Link from "next/link";
import { MapPin, Users, Landmark, Globe, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SeloTerritorio } from "@/components/selo-territorio";
import { formatarNumero } from "@/lib/utils";
import { PORTES_MUNICIPIO } from "@/lib/dominio";

export type MunicipioLinha = {
  id: string;
  codigo_ibge: string;
  nome: string;
  uf: string;
  populacao: number | null;
  porte: string | null;
  regiao: string | null;
  microrregiao: string | null;
};

export type TerritorioMunicipio = {
  status: "livre" | "preferencial" | "exclusiva";
  itens: { tipo: string; produto: string; canal: string }[];
};

export type OrdenacaoMunicipios = {
  coluna: string;
  desc: boolean;
  parametros: Record<string, string>;
};

export function TabelaMunicipios({
  linhas,
  territorios,
  ordenacao,
}: {
  linhas: MunicipioLinha[];
  territorios: Record<string, TerritorioMunicipio>;
  ordenacao: OrdenacaoMunicipios;
}) {
  const [selecionado, setSelecionado] = React.useState<MunicipioLinha | null>(null);
  const territorioDe = (id: string): TerritorioMunicipio =>
    territorios[id] ?? { status: "livre", itens: [] };

  // Ordenação no servidor: o cabeçalho é um link que troca ordenar/dir na URL
  const CabecalhoOrdenavel = ({
    coluna,
    rotulo,
    className,
  }: {
    coluna: string;
    rotulo: string;
    className?: string;
  }) => {
    const ativa = ordenacao.coluna === coluna;
    const p = new URLSearchParams(ordenacao.parametros);
    if (coluna === "nome") p.delete("ordenar");
    else p.set("ordenar", coluna);
    if (ativa && !ordenacao.desc) p.set("dir", "desc");
    else p.delete("dir");
    p.delete("pagina");
    const query = p.toString();
    return (
      <TableHead className={className}>
        <Link
          href={query ? `/municipios?${query}` : "/municipios"}
          className="inline-flex items-center gap-1 hover:text-foreground"
          title={`Ordenar por ${rotulo.toLowerCase()}`}
        >
          {rotulo}
          {ativa ? (
            ordenacao.desc ? (
              <ArrowDown className="size-3.5 text-marca-600" />
            ) : (
              <ArrowUp className="size-3.5 text-marca-600" />
            )
          ) : (
            <ChevronsUpDown className="size-3 opacity-40" />
          )}
        </Link>
      </TableHead>
    );
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
        <Table>
          <TableHeader>
            <TableRow>
              <CabecalhoOrdenavel coluna="nome" rotulo="Município" />
              <CabecalhoOrdenavel coluna="uf" rotulo="UF" className="w-16" />
              <CabecalhoOrdenavel coluna="regiao" rotulo="Região" className="hidden md:table-cell" />
              <CabecalhoOrdenavel coluna="populacao" rotulo="População" className="text-right" />
              <TableHead className="hidden sm:table-cell">Porte</TableHead>
              <TableHead className="hidden lg:table-cell">Território</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((m) => (
              <TableRow
                key={m.id}
                onClick={() => setSelecionado(m)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{m.nome}</TableCell>
                <TableCell>{m.uf}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {m.regiao}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatarNumero(m.populacao)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary" className="font-normal">
                    {PORTES_MUNICIPIO[m.porte ?? ""] ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <SeloTerritorio status={territorioDe(m.id).status} />
                </TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-muted-foreground">
                  Nenhum município encontrado com esses filtros. Limpe a busca e tente de novo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selecionado} onOpenChange={(aberto) => !aberto && setSelecionado(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selecionado && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display flex items-center gap-2">
                  <MapPin className="size-4 text-marca-600" />
                  {selecionado.nome} · {selecionado.uf}
                </SheetTitle>
                <SheetDescription>
                  Código IBGE{" "}
                  <span className="font-mono">{selecionado.codigo_ibge}</span>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <SeloTerritorio status={territorioDe(selecionado.id).status} />
                    {territorioDe(selecionado.id).itens.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        Nenhuma área preferencial ou exclusiva ativa neste município.
                      </span>
                    )}
                  </div>
                  {territorioDe(selecionado.id).itens.map((item, i) => (
                    <p key={i} className="text-sm">
                      <span className="font-medium">
                        {item.tipo === "exclusiva" ? "Exclusiva" : "Preferencial"}
                      </span>{" "}
                      · {item.produto} ·{" "}
                      <span className="text-muted-foreground">{item.canal}</span>
                    </p>
                  ))}
                </div>

                <Separator />

                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5" /> População
                    </dt>
                    <dd className="mt-0.5 font-mono font-medium tabular-nums">
                      {formatarNumero(selecionado.populacao)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Porte</dt>
                    <dd className="mt-0.5 font-medium">
                      {PORTES_MUNICIPIO[selecionado.porte ?? ""] ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Globe className="size-3.5" /> Região
                    </dt>
                    <dd className="mt-0.5 font-medium">{selecionado.regiao ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Microrregião</dt>
                    <dd className="mt-0.5 font-medium">{selecionado.microrregiao ?? "—"}</dd>
                  </div>
                </dl>

                <Separator />

                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <Landmark className="size-4 text-marca-600" />
                    Órgãos públicos e contatos
                  </p>
                  <p className="mt-1">
                    O cadastro de prefeitura, secretarias e contatos deste município
                    será feito aqui na próxima fase.
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
