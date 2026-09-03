"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Building2, Pencil, ArrowUp, ArrowDown, ChevronsUpDown, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  SecaoFormulario,
} from "@/components/cadastros/campos";
import { BlocoEndereco } from "@/components/cadastros/bloco-endereco";
import { STATUS_EMPRESA, TOM_STATUS_EMPRESA } from "@/lib/dominio";
import { salvarEmpresa } from "@/lib/acoes/cadastros";

export type EmpresaLinha = {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  segmento: string | null;
  site: string | null;
  email_institucional: string | null;
  status: string;
  responsavel_principal: string | null;
  email_responsavel: string | null;
  telefone_responsavel: string | null;
  observacoes: string | null;
  dados_bancarios: { banco?: string | null; agencia?: string | null; conta?: string | null; chave_pix?: string | null } | null;
};

export function FormEmpresa({ empresa }: { empresa?: EmpresaLinha | null }) {
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
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Site" nome="site" valorInicial={empresa?.site} placeholder="https://…" />
        <CampoTexto
          rotulo="E-mail institucional"
          nome="email_institucional"
          tipo="email"
          valorInicial={empresa?.email_institucional}
          placeholder="contato@empresa.com.br"
        />
      </div>

      <BlocoEndereco dados={empresa} />

      <SecaoFormulario titulo="Responsável principal" />
      <CampoTexto rotulo="Nome" nome="responsavel_principal" valorInicial={empresa?.responsavel_principal} />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="E-mail" nome="email_responsavel" tipo="email" valorInicial={empresa?.email_responsavel} />
        <CampoTexto rotulo="Telefone" nome="telefone_responsavel" valorInicial={empresa?.telefone_responsavel} />
      </div>


      <SecaoFormulario titulo="Dados bancários" />
      <div className="grid grid-cols-3 gap-3">
        <CampoTexto rotulo="Banco" nome="banco" valorInicial={empresa?.dados_bancarios?.banco} />
        <CampoTexto rotulo="Agência" nome="agencia" valorInicial={empresa?.dados_bancarios?.agencia} />
        <CampoTexto rotulo="Conta" nome="conta" valorInicial={empresa?.dados_bancarios?.conta} />
      </div>
      <CampoTexto rotulo="Chave Pix" nome="chave_pix" valorInicial={empresa?.dados_bancarios?.chave_pix} />
      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={empresa?.observacoes} />
    </>
  );
}

type ColunaOrdenavel = "empresa" | "cnpj" | "cidade" | "segmento" | "status";

// Ordem do funil: da prospecção ao contrato, com suspensas/encerradas no fim
const ORDEM_STATUS = [
  "prospectada",
  "em_negociacao",
  "contrato_em_elaboracao",
  "ativa",
  "suspensa",
  "encerrada",
];

// Vazios sempre por último, independente da direção
function compararTexto(a: string | null | undefined, b: string | null | undefined) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function compararPorColuna(a: EmpresaLinha, b: EmpresaLinha, coluna: ColunaOrdenavel) {
  switch (coluna) {
    case "empresa":
      return compararTexto(a.nome_fantasia || a.razao_social, b.nome_fantasia || b.razao_social);
    case "cnpj": {
      const na = (a.cnpj ?? "").replace(/\D/g, "");
      const nb = (b.cnpj ?? "").replace(/\D/g, "");
      if (!na && !nb) return 0;
      if (!na) return 1;
      if (!nb) return -1;
      return na.localeCompare(nb, undefined, { numeric: true });
    }
    case "cidade":
      // ordem estadual: UF primeiro, cidade como desempate
      return compararTexto(a.uf, b.uf) || compararTexto(a.cidade, b.cidade);
    case "segmento":
      return compararTexto(a.segmento, b.segmento);
    case "status": {
      const ia = ORDEM_STATUS.indexOf(a.status);
      const ib = ORDEM_STATUS.indexOf(b.status);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }
  }
}

export function PortfolioCliente({ empresas }: { empresas: EmpresaLinha[] }) {
  const [busca, setBusca] = React.useState("");
  const [filtroStatus, setFiltroStatus] = React.useState("todos");
  const [ordem, setOrdem] = React.useState<{ coluna: ColunaOrdenavel; desc: boolean } | null>(null);
  const [novaAberta, setNovaAberta] = React.useState(false);
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

  const filtradas = empresas.filter((e) => {
    if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;
    const termo = busca.toLowerCase();
    return (
      e.razao_social.toLowerCase().includes(termo) ||
      (e.nome_fantasia ?? "").toLowerCase().includes(termo) ||
      (e.cnpj ?? "").includes(termo)
    );
  });

  const exibidas = ordem
    ? [...filtradas].sort(
        (a, b) => compararPorColuna(a, b, ordem.coluna) * (ordem.desc ? -1 : 1)
      )
    : filtradas;

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
          items={{ todos: "Todos os status", ...STATUS_EMPRESA }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_EMPRESA).map(([valor, rotulo]) => (
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
                <CabecalhoOrdenavel coluna="empresa" rotulo="Empresa" />
                <CabecalhoOrdenavel coluna="cnpj" rotulo="CNPJ" className="hidden md:table-cell" />
                <CabecalhoOrdenavel coluna="cidade" rotulo="Cidade/UF" className="hidden sm:table-cell" />
                <CabecalhoOrdenavel coluna="segmento" rotulo="Segmento" className="hidden lg:table-cell" />
                <CabecalhoOrdenavel coluna="status" rotulo="Status" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {exibidas.map((e) => (
                <TableRow
                  key={e.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/portfolio/${e.id}`)}
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
              {exibidas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma empresa encontrada com essa busca ou filtro.
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
        titulo="Nova GovTech"
        descricao="Empresa dona de produto que será vendido pela Rede."
        acao={salvarEmpresa}
      >
        <FormEmpresa />
      </PainelFormulario>

    </div>
  );
}
