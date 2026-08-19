"use client";

import * as React from "react";
import { Plus, Search, Building2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pilula } from "@/components/selo-territorio";
import {
  PainelFormulario,
} from "@/components/cadastros/painel-formulario";
import {
  CampoTexto,
  CampoTextoLongo,
  CampoSelecao,
  CampoUF,
  SecaoFormulario,
} from "@/components/cadastros/campos";
import { STATUS_EMPRESA, TOM_STATUS_EMPRESA } from "@/lib/dominio";
import { salvarEmpresa } from "@/lib/acoes/cadastros";

export type EmpresaLinha = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  cidade: string | null;
  uf: string | null;
  segmento: string | null;
  site: string | null;
  status: string;
  responsavel_principal: string | null;
  email_responsavel: string | null;
  telefone_responsavel: string | null;
  observacoes: string | null;
};

function FormEmpresa({ empresa }: { empresa?: EmpresaLinha | null }) {
  return (
    <>
      <SecaoFormulario titulo="Identificação" />
      <CampoTexto rotulo="Razão social" nome="razao_social" obrigatorio valorInicial={empresa?.razao_social} placeholder="Ex.: Sentinela Tecnologia Ltda." />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Nome fantasia" nome="nome_fantasia" valorInicial={empresa?.nome_fantasia} />
        <CampoTexto rotulo="CNPJ" nome="cnpj" valorInicial={empresa?.cnpj} placeholder="00.000.000/0000-00" />
      </div>

      <SecaoFormulario titulo="Perfil" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Status" nome="status" obrigatorio opcoes={STATUS_EMPRESA} valorInicial={empresa?.status ?? "prospectada"} />
        <CampoTexto rotulo="Segmento" nome="segmento" valorInicial={empresa?.segmento} placeholder="Ex.: Defesa Civil" />
      </div>
      <div className="grid grid-cols-[1fr_100px] gap-3">
        <CampoTexto rotulo="Cidade" nome="cidade" valorInicial={empresa?.cidade} />
        <CampoUF nome="uf" valorInicial={empresa?.uf} />
      </div>
      <CampoTexto rotulo="Site" nome="site" valorInicial={empresa?.site} placeholder="https://…" />

      <SecaoFormulario titulo="Responsável principal" />
      <CampoTexto rotulo="Nome" nome="responsavel_principal" valorInicial={empresa?.responsavel_principal} />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="E-mail" nome="email_responsavel" tipo="email" valorInicial={empresa?.email_responsavel} />
        <CampoTexto rotulo="Telefone" nome="telefone_responsavel" valorInicial={empresa?.telefone_responsavel} />
      </div>

      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={empresa?.observacoes} />
    </>
  );
}

export function PortfolioCliente({ empresas }: { empresas: EmpresaLinha[] }) {
  const [busca, setBusca] = React.useState("");
  const [novaAberta, setNovaAberta] = React.useState(false);
  const [editando, setEditando] = React.useState<EmpresaLinha | null>(null);

  const filtradas = empresas.filter((e) => {
    const termo = busca.toLowerCase();
    return (
      e.razao_social.toLowerCase().includes(termo) ||
      (e.nome_fantasia ?? "").toLowerCase().includes(termo) ||
      (e.cnpj ?? "").includes(termo)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou CNPJ…"
            className="pl-8"
          />
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="size-4" />
          Nova empresa
        </Button>
      </div>

      {empresas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Building2 className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhuma empresa no Portfólio ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre a primeira empresa dona de produto — por exemplo, a fabricante do Sentinela.
          </p>
          <Button className="mt-4" onClick={() => setNovaAberta(true)}>
            <Plus className="size-4" />
            Cadastrar primeira empresa
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                <TableHead className="hidden sm:table-cell">Cidade/UF</TableHead>
                <TableHead className="hidden lg:table-cell">Segmento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((e) => (
                <TableRow
                  key={e.id}
                  className="cursor-pointer"
                  onClick={() => setEditando(e)}
                >
                  <TableCell>
                    <span className="font-medium">{e.nome_fantasia || e.razao_social}</span>
                    {e.nome_fantasia && (
                      <span className="block text-xs text-muted-foreground">{e.razao_social}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{e.cnpj ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {e.cidade ? `${e.cidade}/${e.uf ?? ""}` : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{e.segmento ?? "—"}</TableCell>
                  <TableCell>
                    <Pilula tom={TOM_STATUS_EMPRESA[e.status] ?? "neutro"}>
                      {STATUS_EMPRESA[e.status] ?? e.status}
                    </Pilula>
                  </TableCell>
                  <TableCell>
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma empresa encontrada com essa busca.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <PainelFormulario
        aberto={novaAberta}
        aoFechar={() => setNovaAberta(false)}
        titulo="Nova empresa do Portfólio"
        descricao="Empresa dona de produto que será vendido pela Rede."
        acao={salvarEmpresa}
      >
        <FormEmpresa />
      </PainelFormulario>

      <PainelFormulario
        key={editando?.id ?? "nenhuma"}
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo={editando?.nome_fantasia || editando?.razao_social || "Editar empresa"}
        descricao="Edite os dados e salve."
        acao={salvarEmpresa}
        idRegistro={editando?.id}
      >
        <FormEmpresa empresa={editando} />
      </PainelFormulario>
    </div>
  );
}
