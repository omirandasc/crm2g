"use client";

import { useActionState } from "react";
import { redefinirSenha } from "@/lib/acoes/senha";
import type { ResultadoAcao } from "@/lib/acoes/cadastros";
import { Logotipo } from "@/app/login/formulario-login";
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

export function FormularioRedefinir({ email }: { email: string }) {
  const [estado, acao, pendente] = useActionState<ResultadoAcao, FormData>(redefinirSenha, {});

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Logotipo />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Criar nova senha</CardTitle>
            <CardDescription>Para a conta {email}. Mínimo de 8 caracteres.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={acao} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nova_senha">Nova senha</Label>
                <Input id="nova_senha" name="nova_senha" type="password" autoComplete="new-password" required minLength={8} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmar_senha">Confirmar a nova senha</Label>
                <Input id="confirmar_senha" name="confirmar_senha" type="password" autoComplete="new-password" required minLength={8} />
              </div>
              {estado.erro && (
                <p role="alert" className="rounded-lg bg-erro-fundo text-erro text-sm px-3 py-2.5">
                  {estado.erro}
                </p>
              )}
              <Button type="submit" size="lg" disabled={pendente} className="w-full">
                {pendente ? "Salvando…" : "Salvar e entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
