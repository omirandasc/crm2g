"use client";

import * as React from "react";
import { Plus, Search, Store, Pencil } from "lucide-react";
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
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import {
  CampoTexto,
  CampoTextoLongo,
  CampoSelecao,
  CampoUF,
  SecaoFormulario,
} from "@/components/cadastros/campos";
import {
  STATUS_PARCEIRO,
  TOM_STATUS_PARCEIRO,
  TIPOS_PARCEIRO,
} from "@/lib/dominio";
import { salvarParceiro } from "@/lib/acoes/cadastros";

export type ParceiroLinha = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  tipo_parceiro: string;
  status: string;
  cidade: string | null;
  uf: string | null;
  uf_credenciamento: string | null;
  responsavel_principal: string | null;
  email_responsavel: string | null;
  telefone_responsavel: string | null;
  consultor_responsavel: string | null;
  observacoes: string | null;
};

function FormParceiro({ parceiro }: { parceiro?: ParceiroLinha | null }) {
  return (
    <>
      <SecaoFormulario titulo="Identificação" />
      <CampoTexto rotulo="Razão social" nome="razao_social" obrigatorio valorInicial={parceiro?.razao_social} />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Nome fantasia" nome="nome_fantasia" valorInicial={parceiro?.nome_fantasia} />
        <CampoTexto rotulo="CNPJ" nome="cnpj" valorInicial={parceiro?.cnpj} placeholder="00.000.000/0000-00" />
      </div>

      <SecaoFormulario titulo="Perfil comercial" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Tipo de parceiro" nome="tipo_parceiro" obrigatorio opcoes={TIPOS_PARCEIRO} valorInicial={parceiro?.tipo_parceiro ?? "revendedor_parceiro"} />
        <CampoSelecao rotulo="Status" nome="status" obrigatorio opcoes={STATUS_PARCEIRO} valorInicial={parceiro?.status ?? "prospectado"} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <CampoTexto rotulo="Cidade" nome="cidade" valorInicial={parceiro?.cidade} />
        <CampoUF nome="uf" valorInicial={parceiro?.uf} />
        <CampoUF rotulo="UF de credenciamento" nome="uf_credenciamento" valorInicial={parceiro?.uf_credenciamento} />
      </div>

      <SecaoFormulario titulo="Contatos" />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Responsável principal" nome="responsavel_principal" valorInicial={parceiro?.responsavel_principal} />
        <CampoTexto rotulo="Consultor DOISGE responsável" nome="consultor_responsavel" valorInicial={parceiro?.consultor_responsavel} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="E-mail" nome="email_responsavel" tipo="email" valorInicial={parceiro?.email_responsavel} />
        <CampoTexto rotulo="Telefone" nome="telefone_responsavel" valorInicial={parceiro?.telefone_responsavel} />
      </div>

      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={parceiro?.observacoes} />
    </>
  );
}

export function RedeCliente({ parceiros }: { parceiros: ParceiroLinha[] }) {
  const [busca, setBusca] = React.useState("");
  const [novoAberto, setNovoAberto] = React.useState(false);
  const [editando, setEditando] = React.useState<ParceiroLinha | null>(null);

  const filtrados = parceiros.filter((p) => {
    const termo = busca.toLowerCase();
    return (
      p.razao_social.toLowerCase().includes(termo) ||
      (p.nome_fantasia ?? "").toLowerCase().includes(termo) ||
      (p.cnpj ?? "").includes(termo)
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
        <Button onClick={() => setNovoAberto(true)}>
          <Plus className="size-4" />
          Novo parceiro
        </Button>
      </div>

      {parceiros.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Store className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhum parceiro na Rede ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre as revendas e canais que vão vender os produtos nos municípios.
          </p>
          <Button className="mt-4" onClick={() => setNovoAberto(true)}>
            <Plus className="size-4" />
            Cadastrar primeiro parceiro
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parceiro</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">UF credenciada</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditando(p)}>
                  <TableCell>
                    <span className="font-medium">{p.nome_fantasia || p.razao_social}</span>
                    {p.cidade && (
                      <span className="block text-xs text-muted-foreground">
                        {p.cidade}/{p.uf ?? ""}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {TIPOS_PARCEIRO[p.tipo_parceiro] ?? p.tipo_parceiro}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {p.uf_credenciamento ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {p.responsavel_principal ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Pilula tom={TOM_STATUS_PARCEIRO[p.status] ?? "neutro"}>
                      {STATUS_PARCEIRO[p.status] ?? p.status}
                    </Pilula>
                  </TableCell>
                  <TableCell>
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum parceiro encontrado com essa busca.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <PainelFormulario
        aberto={novoAberto}
        aoFechar={() => setNovoAberto(false)}
        titulo="Novo parceiro da Rede"
        descricao="Revenda, canal ou representante que vende aos municípios."
        acao={salvarParceiro}
      >
        <FormParceiro />
      </PainelFormulario>

      <PainelFormulario
        key={editando?.id ?? "nenhum"}
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo={editando?.nome_fantasia || editando?.razao_social || "Editar parceiro"}
        descricao="Edite os dados e salve."
        acao={salvarParceiro}
        idRegistro={editando?.id}
      >
        <FormParceiro parceiro={editando} />
      </PainelFormulario>
    </div>
  );
}
