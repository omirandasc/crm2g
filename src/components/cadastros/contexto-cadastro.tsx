"use client";

import * as React from "react";
import { CampoTexto } from "@/components/cadastros/campos";

type Valores = Record<string, string>;

type Contexto = {
  valores: Valores;
  definir: (campo: string, valor: string) => void;
  /** Preenche vários campos; por padrão respeita o que já foi digitado. */
  preencher: (dados: Valores, opcoes?: { sobrescrever?: boolean }) => void;
};

const Ctx = React.createContext<Contexto | null>(null);

/**
 * Compartilha os valores do formulário entre as seções, para que a consulta
 * do CNPJ possa preencher identificação e endereço de uma vez.
 */
export function ProvedorCadastro({
  iniciais,
  children,
}: {
  iniciais?: Record<string, string | null | undefined> | null;
  children: React.ReactNode;
}) {
  const [valores, setValores] = React.useState<Valores>(() => {
    const base: Valores = {};
    for (const [chave, valor] of Object.entries(iniciais ?? {})) {
      if (typeof valor === "string") base[chave] = valor;
    }
    return base;
  });

  const definir = React.useCallback(
    (campo: string, valor: string) => setValores((atual) => ({ ...atual, [campo]: valor })),
    []
  );

  const preencher = React.useCallback(
    (dados: Valores, opcoes?: { sobrescrever?: boolean }) =>
      setValores((atual) => {
        const novo = { ...atual };
        for (const [campo, valor] of Object.entries(dados)) {
          if (!valor) continue;
          const vazio = !novo[campo] || novo[campo].trim() === "";
          if (opcoes?.sobrescrever || vazio) novo[campo] = valor;
        }
        return novo;
      }),
    []
  );

  return <Ctx.Provider value={{ valores, definir, preencher }}>{children}</Ctx.Provider>;
}

export function useCadastro() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useCadastro precisa estar dentro de ProvedorCadastro");
  return ctx;
}

export function useCampo(nome: string) {
  const { valores, definir } = useCadastro();
  return [valores[nome] ?? "", (valor: string) => definir(nome, valor)] as const;
}

/** CampoTexto ligado ao contexto pelo atributo `nome`. */
export function CampoTextoCadastro(
  props: Omit<React.ComponentProps<typeof CampoTexto>, "valor" | "aoMudar" | "valorInicial"> & {
    /** Transforma o texto digitado (ex.: máscara). */
    transformar?: (valor: string) => string;
  }
) {
  const { transformar, ...resto } = props;
  const [valor, definir] = useCampo(props.nome);
  return (
    <CampoTexto
      {...resto}
      valor={valor}
      aoMudar={(v) => definir(transformar ? transformar(v) : v)}
    />
  );
}
