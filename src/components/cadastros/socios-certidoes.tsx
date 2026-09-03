"use client";

import * as React from "react";
import { Plus, Trash2, FileText, UserRound, DownloadCloud, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { CampoArquivo, BotaoBaixar } from "@/components/cadastros/campo-arquivo";
import { CampoTexto } from "@/components/cadastros/campos";
import {
  salvarSocio,
  removerSocio,
  salvarCertidao,
  removerCertidao,
  importarSociosDaReceita,
} from "@/lib/acoes/complementos";
import { apenasDigitos, mascararCPF, validarCPF } from "@/lib/documentos";
import { formatarData } from "@/lib/utils";

export type SocioLinha = {
  id: string;
  nome: string;
  cpf: string | null;
  percentual: number | null;
  email: string | null;
  telefone: string | null;
};

export type CertidaoLinha = {
  id: string;
  nome: string;
  data_validade: string | null;
  arquivo_url: string | null;
};

/** CPF com máscara e conferência dos dígitos verificadores (cálculo local). */
function CampoCPF() {
  const [cpf, setCpf] = React.useState("");
  const invalido = apenasDigitos(cpf).length === 11 && !validarCPF(cpf);
  return (
    <div className="space-y-1">
      <CampoTexto
        rotulo="CPF"
        nome="cpf"
        valor={cpf}
        aoMudar={(v) => setCpf(mascararCPF(v))}
        inputMode="numeric"
        placeholder="000.000.000-00"
      />
      {invalido && (
        <p className="flex items-center gap-1 text-xs text-erro">
          <AlertTriangle className="size-3" />
          CPF inválido — confira os números.
        </p>
      )}
    </div>
  );
}

export function BlocoSocios({
  entidade,
  entidadeId,
  cnpj,
  socios,
}: {
  entidade: "empresa_portfolio" | "parceiro_rede";
  entidadeId: string;
  cnpj?: string | null;
  socios: SocioLinha[];
}) {
  const [aberto, setAberto] = React.useState(false);
  const [removendo, startRemocao] = React.useTransition();
  const [importando, startImportacao] = React.useTransition();

  const importarDaReceita = () =>
    startImportacao(async () => {
      const r = await importarSociosDaReceita(entidade, entidadeId, cnpj ?? null);
      if (!r.ok) {
        toast.error(r.erro ?? "Não foi possível importar.");
        return;
      }
      if ((r.importados ?? 0) === 0) {
        toast.info("Nenhum sócio novo — o quadro já está igual ao da Receita.");
      } else {
        toast.success(
          `${r.importados} sócio(s) importado(s) da Receita Federal.` +
            ((r.repetidos ?? 0) > 0 ? ` ${r.repetidos} já estava(m) cadastrado(s).` : "")
        );
      }
    });

  const somaPercentual = socios.reduce((acc, s) => acc + (s.percentual ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Quadro societário{somaPercentual > 0 && ` — ${somaPercentual}% cadastrado`}.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={importando || !cnpj}
            onClick={importarDaReceita}
            title={
              cnpj
                ? "Busca o quadro societário na base pública da Receita Federal"
                : "Cadastre o CNPJ na aba Dados para habilitar"
            }
          >
            <DownloadCloud className="size-4" />
            {importando ? "Importando…" : "Importar da Receita"}
          </Button>
          <Button onClick={() => setAberto(true)}>
            <Plus className="size-4" />
            Novo sócio
          </Button>
        </div>
      </div>

      {socios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <UserRound className="mx-auto mb-2 size-6 text-marca-600" strokeWidth={1.6} />
          Nenhum sócio cadastrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">CPF</TableHead>
                <TableHead className="text-right">Participação</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {socios.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell font-mono text-xs">{s.cpf ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {s.percentual != null ? `${s.percentual}%` : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {s.email ?? s.telefone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      title="Remover sócio"
                      disabled={removendo}
                      onClick={() =>
                        startRemocao(async () => {
                          const r = await removerSocio(s.id, entidade, entidadeId);
                          if (r.ok) toast.success("Sócio removido.");
                          else toast.error(r.erro ?? "Não foi possível remover.");
                        })
                      }
                      className="text-muted-foreground hover:text-erro"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PainelFormulario
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Novo sócio"
        acao={salvarSocio}
      >
        <input type="hidden" name="entidade" value={entidade} />
        <input type="hidden" name="entidade_id" value={entidadeId} />
        <CampoTexto rotulo="Nome" nome="nome" obrigatorio />
        <div className="grid grid-cols-2 gap-3">
          <CampoCPF />
          <CampoTexto rotulo="Participação (%)" nome="percentual" tipo="number" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CampoTexto rotulo="E-mail" nome="email" tipo="email" />
          <CampoTexto rotulo="Telefone" nome="telefone" />
        </div>
      </PainelFormulario>
    </div>
  );
}

export function BlocoCertidoes({
  entidade,
  entidadeId,
  certidoes,
}: {
  entidade: "empresa_portfolio" | "parceiro_rede";
  entidadeId: string;
  certidoes: CertidaoLinha[];
}) {
  const [aberto, setAberto] = React.useState(false);
  const [removendo, startRemocao] = React.useTransition();

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Certidões de conformidade (negativas, regularidade fiscal, FGTS…).
        </p>
        <Button onClick={() => setAberto(true)}>
          <Plus className="size-4" />
          Nova certidão
        </Button>
      </div>

      {certidoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          <FileText className="mx-auto mb-2 size-6 text-marca-600" strokeWidth={1.6} />
          Nenhuma certidão anexada.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {certidoes.map((c) => {
            const vencida = c.data_validade != null && c.data_validade < hoje;
            return (
              <Card key={c.id}>
                <CardContent className="space-y-2">
                  <p className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="size-4 shrink-0 text-marca-600" />
                      {c.nome}
                    </span>
                    <button
                      type="button"
                      title="Remover certidão"
                      disabled={removendo}
                      onClick={() =>
                        startRemocao(async () => {
                          const r = await removerCertidao(c.id, entidade, entidadeId);
                          if (r.ok) toast.success("Certidão removida.");
                          else toast.error(r.erro ?? "Não foi possível remover.");
                        })
                      }
                      className="text-muted-foreground hover:text-erro"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </p>
                  <div className="flex items-center justify-between">
                    <Pilula tom={vencida ? "erro" : c.data_validade ? "sucesso" : "neutro"}>
                      {c.data_validade
                        ? vencida
                          ? `Vencida em ${formatarData(c.data_validade)}`
                          : `Válida até ${formatarData(c.data_validade)}`
                        : "Sem validade"}
                    </Pilula>
                    {c.arquivo_url && <BotaoBaixar caminho={c.arquivo_url} />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <PainelFormulario
        aberto={aberto}
        aoFechar={() => setAberto(false)}
        titulo="Nova certidão"
        acao={salvarCertidao}
      >
        <input type="hidden" name="entidade" value={entidade} />
        <input type="hidden" name="entidade_id" value={entidadeId} />
        <CampoTexto rotulo="Nome da certidão" nome="nome" obrigatorio placeholder="Ex.: Certidão Negativa Federal" />
        <CampoTexto rotulo="Válida até" nome="data_validade" tipo="date" />
        <CampoArquivo nome="arquivo_url" balde="certidoes" pasta={entidadeId} obrigatorio />
      </PainelFormulario>
    </div>
  );
}
