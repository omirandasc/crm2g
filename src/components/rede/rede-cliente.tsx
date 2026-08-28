"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Store, Pencil, ArrowUp, ArrowDown, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CampoUFsMultiplas,
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
  ufs_credenciamento: string[] | null;
  limite_cidades_preferenciais: number | null;
  responsavel_principal: string | null;
  email_responsavel: string | null;
  telefone_responsavel: string | null;
  consultor_responsavel: string | null;
  observacoes: string | null;
  dados_bancarios: { banco?: string | null; agencia?: string | null; conta?: string | null; chave_pix?: string | null } | null;
};

export function FormParceiro({ parceiro }: { parceiro?: ParceiroLinha | null }) {
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
      </div>
      <CampoUFsMultiplas
        nome="ufs_credenciamento"
        valorInicial={
          parceiro?.ufs_credenciamento?.length
            ? parceiro.ufs_credenciamento
            : parceiro?.uf_credenciamento
              ? [parceiro.uf_credenciamento]
              : []
        }
      />
      <CampoTexto
        rotulo="Carteira de cidades preferenciais (limite sem contrato fechado)"
        nome="limite_cidades_preferenciais"
        tipo="number"
        valorInicial={(parceiro?.limite_cidades_preferenciais ?? 30).toString()}
      />

      <SecaoFormulario titulo="Contatos" />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Responsável principal" nome="responsavel_principal" valorInicial={parceiro?.responsavel_principal} />
        <CampoTexto rotulo="Consultor DOISGE responsável" nome="consultor_responsavel" valorInicial={parceiro?.consultor_responsavel} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="E-mail" nome="email_responsavel" tipo="email" valorInicial={parceiro?.email_responsavel} />
        <CampoTexto rotulo="Telefone" nome="telefone_responsavel" valorInicial={parceiro?.telefone_responsavel} />
      </div>


      <SecaoFormulario titulo="Dados bancários" />
      <div className="grid grid-cols-3 gap-3">
        <CampoTexto rotulo="Banco" nome="banco" valorInicial={parceiro?.dados_bancarios?.banco} />
        <CampoTexto rotulo="Agência" nome="agencia" valorInicial={parceiro?.dados_bancarios?.agencia} />
        <CampoTexto rotulo="Conta" nome="conta" valorInicial={parceiro?.dados_bancarios?.conta} />
      </div>
      <CampoTexto rotulo="Chave Pix" nome="chave_pix" valorInicial={parceiro?.dados_bancarios?.chave_pix} />
      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={parceiro?.observacoes} />
    </>
  );
}

type ColunaOrdenavel = "parceiro" | "tipo" | "uf" | "responsavel" | "status";

// Ordem do funil de credenciamento, com inativos/encerrados no fim
const ORDEM_STATUS_PARCEIRO = [
  "prospectado",
  "em_qualificacao",
  "contrato_em_elaboracao",
  "ativo",
  "suspenso",
  "inativo",
  "descredenciado",
  "encerrado",
];

function compararTexto(a: string | null | undefined, b: string | null | undefined) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function ufsDe(p: ParceiroLinha) {
  return p.ufs_credenciamento?.length
    ? p.ufs_credenciamento.join(", ")
    : p.uf_credenciamento ?? null;
}

function compararPorColuna(a: ParceiroLinha, b: ParceiroLinha, coluna: ColunaOrdenavel) {
  switch (coluna) {
    case "parceiro":
      return compararTexto(a.nome_fantasia || a.razao_social, b.nome_fantasia || b.razao_social);
    case "tipo":
      return compararTexto(
        TIPOS_PARCEIRO[a.tipo_parceiro] ?? a.tipo_parceiro,
        TIPOS_PARCEIRO[b.tipo_parceiro] ?? b.tipo_parceiro
      );
    case "uf":
      return compararTexto(ufsDe(a), ufsDe(b));
    case "responsavel":
      return compararTexto(a.responsavel_principal, b.responsavel_principal);
    case "status": {
      const ia = ORDEM_STATUS_PARCEIRO.indexOf(a.status);
      const ib = ORDEM_STATUS_PARCEIRO.indexOf(b.status);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
  }
}

export function RedeCliente({ parceiros }: { parceiros: ParceiroLinha[] }) {
  const [busca, setBusca] = React.useState("");
  const [filtroStatus, setFiltroStatus] = React.useState("todos");
  const [ordem, setOrdem] = React.useState<{ coluna: ColunaOrdenavel; desc: boolean } | null>(null);
  const [novoAberto, setNovoAberto] = React.useState(false);
  const router = useRouter();

  const ordenarPor = (coluna: ColunaOrdenavel) =>
    setOrdem((atual) =>
      atual?.coluna === coluna ? { coluna, desc: !atual.desc } : { coluna, desc: false }
    );

  const CabecalhoOrdenavel = ({
    coluna,
    rotulo,
    className,
  }: {
    coluna: ColunaOrdenavel;
    rotulo: string;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => ordenarPor(coluna)}
        className="inline-flex items-center gap-1 hover:text-foreground"
        title={`Ordenar por ${rotulo.toLowerCase()}`}
      >
        {rotulo}
        {ordem?.coluna === coluna ? (
          ordem.desc ? (
            <ArrowDown className="size-3.5 text-marca-600" />
          ) : (
            <ArrowUp className="size-3.5 text-marca-600" />
          )
        ) : (
          <ChevronsUpDown className="size-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );

  const filtrados = parceiros.filter((p) => {
    if (filtroStatus !== "todos" && p.status !== filtroStatus) return false;
    const termo = busca.toLowerCase();
    return (
      p.razao_social.toLowerCase().includes(termo) ||
      (p.nome_fantasia ?? "").toLowerCase().includes(termo) ||
      (p.cnpj ?? "").includes(termo)
    );
  });

  const exibidos = ordem
    ? [...filtrados].sort(
        (a, b) => compararPorColuna(a, b, ordem.coluna) * (ordem.desc ? -1 : 1)
      )
    : filtrados;

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
        <Select
          value={filtroStatus}
          onValueChange={(v) => setFiltroStatus((v as string) ?? "todos")}
          items={{ todos: "Todos os status", ...STATUS_PARCEIRO }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_PARCEIRO).map(([valor, rotulo]) => (
              <SelectItem key={valor} value={valor}>
                {rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtroStatus !== "todos" && (
          <Button variant="ghost" size="sm" onClick={() => setFiltroStatus("todos")}>
            <X className="size-3.5" />
            Limpar filtro
          </Button>
        )}
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
                <CabecalhoOrdenavel coluna="parceiro" rotulo="Parceiro" />
                <CabecalhoOrdenavel coluna="tipo" rotulo="Tipo" className="hidden md:table-cell" />
                <CabecalhoOrdenavel coluna="uf" rotulo="UF credenciada" className="hidden sm:table-cell" />
                <CabecalhoOrdenavel coluna="responsavel" rotulo="Responsável" className="hidden lg:table-cell" />
                <CabecalhoOrdenavel coluna="status" rotulo="Status" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {exibidos.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/rede/${p.id}`)}>
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
                    {p.ufs_credenciamento?.length
                      ? p.ufs_credenciamento.join(", ")
                      : p.uf_credenciamento ?? "—"}
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
              {exibidos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum parceiro encontrado com essa busca ou filtro.
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
        titulo="Novo canal"
        descricao="Revenda, canal ou representante que vende aos municípios."
        acao={salvarParceiro}
      >
        <FormParceiro />
      </PainelFormulario>

    </div>
  );
}
