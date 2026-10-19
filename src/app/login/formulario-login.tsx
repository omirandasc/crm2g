"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AVISOS: Record<string, { texto: string; tom: "alerta" | "erro" | "sucesso" }> = {
  inativo: {
    texto: "Seu acesso está inativo. Fale com a DoisGe (Governança) para reativar.",
    tom: "alerta",
  },
  link_invalido: {
    texto: "O link de recuperação expirou ou já foi usado. Peça um novo em “Esqueci minha senha”.",
    tom: "erro",
  },
};

const CLASSE_AVISO = {
  alerta: "bg-alerta-fundo text-alerta",
  erro: "bg-erro-fundo text-erro",
  sucesso: "bg-sucesso-fundo text-sucesso",
};

export function Logotipo() {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <Image src="/logo-horizontal-claro.png" alt="DOISGE" width={196} height={32} priority className="h-8 w-auto dark:hidden" />
      <Image src="/logo-horizontal-escuro.png" alt="DOISGE" width={196} height={32} priority className="hidden h-8 w-auto dark:block" />
      <div>
        <h1 className="sr-only">CRM DOISGE</h1>
        <p className="mt-1 text-sm text-muted-foreground">CRM · DoisGe · GovTech · Canal</p>
      </div>
    </div>
  );
}

export function FormularioLogin({ aviso }: { aviso?: string }) {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, {});
  const mensagem = aviso ? AVISOS[aviso] : undefined;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Logotipo />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Use o e-mail e a senha cadastrados pela DOISGE.</CardDescription>
          </CardHeader>
          <CardContent>
            {mensagem && (
              <p role="status" className={`mb-4 rounded-lg px-3 py-2.5 text-sm ${CLASSE_AVISO[mensagem.tom]}`}>
                {mensagem.texto}
              </p>
            )}
            <form action={acao} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com.br" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="senha">Senha</Label>
                  <Link href="/esqueci-senha" className="text-xs text-marca-700 hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
                <Input id="senha" name="senha" type="password" autoComplete="current-password" required placeholder="••••••••" />
              </div>

              {estado.erro && (
                <p role="alert" className="rounded-lg bg-erro-fundo text-erro text-sm px-3 py-2.5">
                  {estado.erro}
                </p>
              )}

              <Button type="submit" size="lg" disabled={pendente} className="w-full">
                {pendente ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ainda não tem acesso? O cadastro é feito pela DoisGe (Governança).
        </p>
      </div>
    </main>
  );
}
