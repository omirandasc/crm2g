"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, {});

  return (
    <main className="min-h-dvh grid lg:grid-cols-[1.1fr_1fr]">
      {/* Painel institucional */}
      <section className="hidden lg:flex flex-col justify-between bg-marca-950 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-marca-600 grid place-items-center font-display font-bold text-lg">
            2G
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">
            CRM DOISGE
          </span>
        </div>

        <div className="max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            A fonte oficial da operação comercial.
          </h1>
          <p className="mt-4 text-marca-200 leading-relaxed">
            Portfólio, Rede e Governança em um só lugar: produtos, territórios,
            oportunidades, compras públicas, contratos e comissões.
          </p>

          <div className="mt-10 flex gap-2 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">Livre</span>
            <span className="rounded-full px-3 py-1" style={{ background: "#faf1dd", color: "#9a6a10" }}>
              Preferencial
            </span>
            <span className="rounded-full px-3 py-1" style={{ background: "#e7eef8", color: "#2e5fa3" }}>
              Exclusiva
            </span>
          </div>
        </div>

        <p className="text-sm text-marca-200/70">
          Se não está no CRM da DOISGE, não existe para o ecossistema.
        </p>
      </section>

      {/* Formulário */}
      <section className="flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-marca-600 grid place-items-center font-display font-bold text-white">
              2G
            </div>
            <span className="font-display font-semibold text-lg">CRM DOISGE</span>
          </div>

          <h2 className="font-display text-2xl font-semibold tracking-tight">Entrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use o e-mail e a senha cadastrados pela DOISGE.
          </p>

          <form action={acao} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="voce@empresa.com.br"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
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

          <p className="mt-6 text-xs text-muted-foreground">
            Esqueceu a senha? Fale com a Governança DOISGE para redefinir o acesso.
          </p>
        </div>
      </section>
    </main>
  );
}
