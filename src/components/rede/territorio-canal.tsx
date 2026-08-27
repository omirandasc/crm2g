"use client";

import * as React from "react";
import { Map, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pilula } from "@/components/selo-territorio";
import { FormAcao } from "@/components/cadastros/form-acao";
import { CampoSelecao } from "@/components/cadastros/campos";
import { CampoMunicipio } from "@/components/cadastros/campo-municipio";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import { definirAreaPreferencial, removerAreaDaFicha } from "@/lib/acoes/comercial";
import { formatarData } from "@/lib/utils";
import type { TomPilula } from "@/lib/dominio";

const STATUS_AREA: Record<string, string> = {
  solicitada: "Solicitada pelo Canal",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  ativa: "Ativa",
};

const TOM_AREA: Record<string, TomPilula> = {
  solicitada: "alerta",
  em_analise: "info",
  aprovada: "sucesso",
  ativa: "sucesso",
};

export type AreaLinha = {
  id: string;
  status: string;
  data_inicio: string | null;
  produtos: { nome_produto: string } | null;
  municipios: { nome: string; uf: string } | null;
};

export type ExclusivaLinha = {
  id: string;
  data_inicio: string | null;
  produtos: { nome_produto: string } | null;
  municipios: { nome: string; uf: string } | null;
};

export function TerritorioCanal({
  parceiroId,
  limite,
  ufs,
  produtos,
  preferenciais,
  exclusivas,
}: {
  parceiroId: string;
  limite: number;
  ufs: string[];
  produtos: Opcao[];
  preferenciais: AreaLinha[];
  exclusivas: ExclusivaLinha[];
}) {
  const [removendo, startRemocao] = React.useTransition();

  const remover = (a: AreaLinha) =>
    startRemocao(async () => {
      const r = await removerAreaDaFicha(a.id, parceiroId);
      if (r.ok) toast.success(`${a.municipios?.nome ?? "Cidade"} removida do território.`);
      else toast.error(r.erro ?? "Não foi possível remover.");
    });

  const ativas = preferenciais.filter((a) => ["aprovada", "ativa"].includes(a.status)).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr] items-start">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar cidade preferencial</CardTitle>
          <CardDescription>
            A cidade entra direto como <strong>ativa</strong>. A carteira comporta{" "}
            <strong>{limite} cidades sem contrato fechado</strong> (todos os
            produtos somados) — o limite vale para todos e é ajustável no
            cadastro do Canal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Este Canal ainda não tem produto com autorização ativa. Crie a
              autorização primeiro, no menu Autorizações.
            </p>
          ) : (
            <FormAcao acao={definirAreaPreferencial} rotuloEnviar="Adicionar ao território" limparAposSalvar>
              <input type="hidden" name="parceiro_rede_id" value={parceiroId} />
              <div className="space-y-4">
                <CampoSelecao
                  rotulo="Produto"
                  nome="produto_id"
                  obrigatorio
                  opcoes={Object.fromEntries(produtos.map((p) => [p.id, p.rotulo]))}
                  valorInicial={produtos.length === 1 ? produtos[0].id : undefined}
                />
                <CampoMunicipio
                  nome="municipio_id"
                  obrigatorio
                  ufs={ufs}
                  rotulo={ufs.length > 0 ? `Município (${ufs.join(", ")})` : "Município"}
                />
              </div>
            </FormAcao>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Cidades preferenciais</CardTitle>
            <CardDescription>
              {ativas > 0
                ? `${ativas} de ${limite} vagas da carteira em uso.`
                : preferenciais.length > 0
                  ? "Nenhuma cidade ativa ainda — há solicitações do Canal aguardando decisão em Territórios."
                  : "Nenhuma cidade preferencial ainda — adicione ao lado."}
            </CardDescription>
          </CardHeader>
          {preferenciais.length > 0 && (
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Município</TableHead>
                      <TableHead className="hidden sm:table-cell">Produto</TableHead>
                      <TableHead className="hidden md:table-cell">Desde</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preferenciais.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          {a.municipios ? `${a.municipios.nome} · ${a.municipios.uf}` : "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {a.produtos?.nome_produto ?? "—"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {a.data_inicio ? formatarData(a.data_inicio) : "—"}
                        </TableCell>
                        <TableCell>
                          <Pilula tom={TOM_AREA[a.status] ?? "neutro"}>
                            {STATUS_AREA[a.status] ?? a.status}
                          </Pilula>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            title="Remover do território"
                            disabled={removendo}
                            onClick={() => remover(a)}
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
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="size-4 text-marca-600" />
              Cidades exclusivas
            </CardTitle>
            <CardDescription>
              Conquistadas por contrato assinado — não são editadas aqui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exclusivas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma ainda. Quando este Canal fechar contrato numa cidade
                preferencial, ela aparece aqui automaticamente.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {exclusivas.map((e) => (
                  <li key={e.id}>
                    <Pilula tom="sucesso">
                      {e.municipios ? `${e.municipios.nome} · ${e.municipios.uf}` : "—"}
                      {e.produtos && ` — ${e.produtos.nome_produto}`}
                    </Pilula>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
