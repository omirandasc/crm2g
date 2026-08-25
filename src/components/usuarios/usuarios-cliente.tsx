"use client";

import * as React from "react";
import { Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  CampoSelecao,
  SecaoFormulario,
} from "@/components/cadastros/campos";
import { PERFIS } from "@/lib/dominio";
import { criarUsuario, editarUsuario } from "@/lib/acoes/usuarios";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";

const STATUS_USUARIO: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  suspenso: "Suspenso",
};

export type UsuarioLinha = {
  id: string;
  nome: string | null;
  email: string | null;
  perfil: string;
  status: string;
  empresa_portfolio_id: string | null;
  parceiro_rede_id: string | null;
  empresas_portfolio: { nome_fantasia: string | null; razao_social: string } | null;
  parceiros_rede: { nome_fantasia: string | null; razao_social: string } | null;
};

function iniciais(nome?: string | null) {
  if (!nome) return "?";
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase();
}

export function UsuariosCliente({
  usuarios,
  empresas,
  parceiros,
}: {
  usuarios: UsuarioLinha[];
  empresas: Opcao[];
  parceiros: Opcao[];
}) {
  const [novoAberto, setNovoAberto] = React.useState(false);
  const [editando, setEditando] = React.useState<UsuarioLinha | null>(null);

  const CamposVinculo = ({ usuario }: { usuario?: UsuarioLinha | null }) => (
    <>
      <CampoSelecao
        rotulo="GovTech (se perfil GovTech)"
        nome="empresa_portfolio_id"
        opcoes={Object.fromEntries(empresas.map((e) => [e.id, e.rotulo]))}
        valorInicial={usuario?.empresa_portfolio_id}
        permitirVazio
      />
      <CampoSelecao
        rotulo="Canal (se perfil Canal)"
        nome="parceiro_rede_id"
        opcoes={Object.fromEntries(parceiros.map((p) => [p.id, p.rotulo]))}
        valorInicial={usuario?.parceiro_rede_id}
        permitirVazio
      />
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setNovoAberto(true)}>
          <Plus className="size-4" />
          Novo usuário
        </Button>
      </div>

      {usuarios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <UsersRound className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
          <p className="mt-3 font-medium">Nenhum usuário</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead className="hidden sm:table-cell">Perfil</TableHead>
                <TableHead className="hidden md:table-cell">Vínculo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => setEditando(u)}>
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-marca-50 text-marca-700 text-xs font-semibold">
                          {iniciais(u.nome)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        <span className="block font-medium">{u.nome}</span>
                        <span className="block text-xs text-muted-foreground">{u.email}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {PERFIS[u.perfil as keyof typeof PERFIS] ?? u.perfil}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {u.empresas_portfolio?.nome_fantasia ||
                      u.empresas_portfolio?.razao_social ||
                      u.parceiros_rede?.nome_fantasia ||
                      u.parceiros_rede?.razao_social ||
                      "—"}
                  </TableCell>
                  <TableCell>
                    <Pilula tom={u.status === "ativo" ? "sucesso" : u.status === "suspenso" ? "erro" : "neutro"}>
                      {STATUS_USUARIO[u.status] ?? u.status}
                    </Pilula>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PainelFormulario
        aberto={novoAberto}
        aoFechar={() => setNovoAberto(false)}
        titulo="Novo usuário"
        descricao="Crie o acesso e informe a senha inicial à pessoa — ela pode trocá-la depois."
        acao={criarUsuario}
      >
        <SecaoFormulario titulo="Identificação" />
        <CampoTexto rotulo="Nome" nome="nome" obrigatorio />
        <CampoTexto rotulo="E-mail" nome="email" tipo="email" obrigatorio />
        <CampoTexto rotulo="Senha inicial" nome="senha" obrigatorio placeholder="Mínimo de 8 caracteres" />
        <SecaoFormulario titulo="Acesso" />
        <CampoSelecao rotulo="Perfil" nome="perfil" obrigatorio opcoes={PERFIS} valorInicial="usuario_rede" />
        <CamposVinculo />
      </PainelFormulario>

      <PainelFormulario
        key={editando?.id ?? "nenhum"}
        aberto={!!editando}
        aoFechar={() => setEditando(null)}
        titulo={editando?.nome ?? "Editar usuário"}
        descricao={editando?.email ?? undefined}
        acao={editarUsuario}
        idRegistro={editando?.id}
      >
        <CampoTexto rotulo="Nome" nome="nome" obrigatorio valorInicial={editando?.nome} />
        <div className="grid grid-cols-2 gap-3">
          <CampoSelecao rotulo="Perfil" nome="perfil" obrigatorio opcoes={PERFIS} valorInicial={editando?.perfil} />
          <CampoSelecao rotulo="Status" nome="status" obrigatorio opcoes={STATUS_USUARIO} valorInicial={editando?.status} />
        </div>
        <CamposVinculo usuario={editando} />
        <SecaoFormulario titulo="Redefinir senha (opcional)" />
        <CampoTexto rotulo="Nova senha" nome="nova_senha" placeholder="Deixe em branco para manter" />
      </PainelFormulario>
    </div>
  );
}
