"use client";

import * as React from "react";
import { History, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pilula } from "@/components/selo-territorio";

const ENTIDADES_AUDITADAS: Record<string, string> = {
  precos_produto: "Preço de produto",
  autorizacoes_parceiro_produto: "Autorização Canal × produto",
  areas_preferenciais: "Área preferencial",
  areas_exclusivas: "Área exclusiva",
  contratos: "Contrato",
  regras_comissao: "Regra de comissão",
  comissoes: "Comissão",
  oportunidades: "Oportunidade",
  politicas_comerciais: "Política comercial",
};

export type RegistroAuditoria = {
  id: string;
  entidade: string;
  entidade_id: string;
  campo_alterado: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  data_alteracao: string;
  profiles: { nome: string | null } | null;
};

function formatarMomento(iso: string) {
  const d = new Date(iso);
  // Fuso fixo para o servidor e o navegador renderizarem o mesmo texto (hidratação)
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function encurtar(v: string | null) {
  if (v == null || v === "") return "—";
  return v.length > 60 ? `${v.slice(0, 57)}…` : v;
}

export function AuditoriaCliente({ registros }: { registros: RegistroAuditoria[] }) {
  const [entidade, setEntidade] = React.useState("todas");
  const [busca, setBusca] = React.useState("");

  const filtrados = registros.filter((r) => {
    if (entidade !== "todas" && r.entidade !== entidade) return false;
    if (busca.trim()) {
      const alvo = `${r.campo_alterado ?? ""} ${r.valor_anterior ?? ""} ${r.valor_novo ?? ""} ${
        r.profiles?.nome ?? ""
      }`.toLowerCase();
      if (!alvo.includes(busca.trim().toLowerCase())) return false;
    }
    return true;
  });

  const itensEntidade = {
    todas: "Todas as entidades",
    ...ENTIDADES_AUDITADAS,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por campo, valor ou responsável…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select value={entidade} onValueChange={(v) => setEntidade(v ?? "todas")} items={itensEntidade}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(itensEntidade).map(([valor, rotulo]) => (
              <SelectItem key={valor} value={valor}>
                {rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <History className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhuma alteração encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Toda mudança em preços, contratos, comissões, territórios e
            oportunidades fica registrada aqui automaticamente.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>O que mudou</TableHead>
                <TableHead className="hidden md:table-cell">De</TableHead>
                <TableHead className="hidden md:table-cell">Para</TableHead>
                <TableHead className="hidden sm:table-cell">Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatarMomento(r.data_alteracao)}
                  </TableCell>
                  <TableCell>
                    <Pilula tom="neutro">
                      {ENTIDADES_AUDITADAS[r.entidade] ?? r.entidade}
                    </Pilula>
                    <span className="ml-2 font-mono text-xs">{r.campo_alterado}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-52 truncate text-muted-foreground">
                    {encurtar(r.valor_anterior)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-52 truncate">
                    {encurtar(r.valor_novo)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {r.profiles?.nome ?? "Sistema"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Exibindo as {Math.min(filtrados.length, registros.length)} alterações mais
        recentes (máximo de 300).
      </p>
    </div>
  );
}
