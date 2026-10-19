"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { solicitarRecuperacao } from "@/lib/acoes/senha";
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

export default function EsqueciSenhaPage() {
  const [estado, acao, pendente] = useActionState<ResultadoAcao, FormData>(solicitarRecuperacao, {});

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Logotipo />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Esqueci minha senha</CardTitle>
            <CardDescription>
              Informe o e-mail cadastrado. Você recebe um link para criar uma senha nova.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {estado.ok ? (
              <div className="space-y-3 text-sm">
                <p className="flex items-start gap-2 rounded-lg bg-sucesso-fundo px-3 py-2.5 text-sucesso">
                  <MailCheck className="mt-0.5 size-4 shrink-0" />
                  Se o e-mail estiver cadastrado, enviamos o link. Ele vale por 1 hora — confira
                  também a caixa de spam.
                </p>
                <p className="text-muted-foreground">
                  Não chegou? Confira se digitou o mesmo e-mail do cadastro ou fale com a DoisGe
                  (Governança).
                </p>
              </div>
            ) : (
              <form action={acao} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com.br" />
                </div>
                {estado.erro && (
                  <p role="alert" className="rounded-lg bg-erro-fundo text-erro text-sm px-3 py-2.5">
                    {estado.erro}
                  </p>
                )}
                <Button type="submit" size="lg" disabled={pendente} className="w-full">
                  {pendente ? "Enviando…" : "Enviar link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs">
          <Link href="/login" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" />
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
