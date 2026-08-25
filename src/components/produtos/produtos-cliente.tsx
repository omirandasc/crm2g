"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Package, Pencil, RefreshCcw } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Pilula } from "@/components/selo-territorio";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import {
  CampoTexto,
  CampoTextoLongo,
  CampoSelecao,
  SecaoFormulario,
} from "@/components/cadastros/campos";
import {
  STATUS_PRODUTO,
  TOM_STATUS_PRODUTO,
  TIPOS_PRODUTO,
  TIPOS_COMPRA_PUBLICA,
} from "@/lib/dominio";
import { salvarProduto } from "@/lib/acoes/cadastros";

export type ProdutoLinha = {
  id: string;
  empresa_portfolio_id: string;
  nome_produto: string;
  descricao_curta: string | null;
  segmento: string | null;
  vertical: string | null;
  tipo_produto: string;
  recorrente: boolean;
  modelo_contratacao_publica_indicado: string | null;
  prazo_contrato_padrao_meses: number | null;
  status: string;
  empresas_portfolio: { razao_social: string; nome_fantasia: string | null } | null;
};

export type EmpresaOpcao = { id: string; razao_social: string; nome_fantasia: string | null };

export function FormProduto({
  produto,
  empresas,
}: {
  produto?: ProdutoLinha | null;
  empresas: EmpresaOpcao[];
}) {
  const opcoesEmpresa = Object.fromEntries(
    empresas.map((e) => [e.id, e.nome_fantasia || e.razao_social])
  );
  return (
    <>
      <SecaoFormulario titulo="Produto" />
      <CampoSelecao
        rotulo="Empresa dona do produto"
        nome="empresa_portfolio_id"
        obrigatorio
        opcoes={opcoesEmpresa}
        valorInicial={produto?.empresa_portfolio_id}
      />
      <CampoTexto rotulo="Nome do produto" nome="nome_produto" obrigatorio valorInicial={produto?.nome_produto} placeholder="Ex.: Sentinela" />
      <CampoTextoLongo rotulo="Descrição curta" nome="descricao_curta" valorInicial={produto?.descricao_curta} placeholder="O que o produto faz, em uma ou duas frases." />

      <SecaoFormulario titulo="Classificação" />
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao rotulo="Tipo" nome="tipo_produto" obrigatorio opcoes={TIPOS_PRODUTO} valorInicial={produto?.tipo_produto ?? "saas"} />
        <CampoSelecao rotulo="Status" nome="status" obrigatorio opcoes={STATUS_PRODUTO} valorInicial={produto?.status ?? "rascunho"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Segmento" nome="segmento" valorInicial={produto?.segmento} placeholder="Ex.: Defesa Civil" />
        <CampoTexto rotulo="Vertical" nome="vertical" valorInicial={produto?.vertical} placeholder="Ex.: Segurança" />
      </div>

      <SecaoFormulario titulo="Modelo comercial" />
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
        <Checkbox
          id="recorrente"
          name="recorrente"
          defaultChecked={produto?.recorrente ?? true}
        />
        <Label htmlFor="recorrente" className="font-normal">
          Receita recorrente (mensalidade)
        </Label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoSelecao
          rotulo="Contratação pública indicada"
          nome="modelo_contratacao_publica_indicado"
          opcoes={TIPOS_COMPRA_PUBLICA}
          valorInicial={produto?.modelo_contratacao_publica_indicado}
          permitirVazio
        />
        <CampoTexto
          rotulo="Prazo padrão (meses)"
          nome="prazo_contrato_padrao_meses"
          tipo="number"
          valorInicial={produto?.prazo_contrato_padrao_meses?.toString()}
          placeholder="12"
        />
      </div>
    </>
  );
}

export function ProdutosCliente({
  produtos,
  empresas,
}: {
  produtos: ProdutoLinha[];
  empresas: EmpresaOpcao[];
}) {
  const [busca, setBusca] = React.useState("");
  const [novoAberto, setNovoAberto] = React.useState(false);
  const router = useRouter();

  const semEmpresas = empresas.length === 0;

  const filtrados = produtos.filter((p) =>
    p.nome_produto.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto…"
            className="pl-8"
          />
        </div>
        <Button onClick={() => setNovoAberto(true)} disabled={semEmpresas}>
          <Plus className="size-4" />
          Novo produto
        </Button>
      </div>

      {semEmpresas && (
        <p className="rounded-lg bg-alerta-fundo text-alerta text-sm px-3 py-2.5">
          Antes de cadastrar produtos, cadastre a empresa dona em{" "}
          <a href="/portfolio" className="font-medium underline">Portfólio</a>.
        </p>
      )}

      {produtos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhum produto cadastrado ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O produto é o que os Canais vendem — com preços, materiais e autorizações.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">Empresa</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Recorrente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => router.push(`/produtos/${p.id}`)}>
                  <TableCell>
                    <span className="font-medium">{p.nome_produto}</span>
                    {p.descricao_curta && (
                      <span className="block max-w-72 truncate text-xs text-muted-foreground">
                        {p.descricao_curta}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {p.empresas_portfolio?.nome_fantasia || p.empresas_portfolio?.razao_social || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {TIPOS_PRODUTO[p.tipo_produto] ?? p.tipo_produto}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {p.recorrente ? (
                      <span className="inline-flex items-center gap-1 text-xs text-marca-700">
                        <RefreshCcw className="size-3" /> Mensal
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Único</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Pilula tom={TOM_STATUS_PRODUTO[p.status] ?? "neutro"}>
                      {STATUS_PRODUTO[p.status] ?? p.status}
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
                    Nenhum produto encontrado com essa busca.
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
        titulo="Novo produto"
        descricao="Solução que será vendida pelos Canais aos municípios."
        acao={salvarProduto}
      >
        <FormProduto empresas={empresas} />
      </PainelFormulario>

    </div>
  );
}
