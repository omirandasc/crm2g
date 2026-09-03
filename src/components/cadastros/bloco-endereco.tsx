"use client";

import * as React from "react";
import { Check, MapPin } from "lucide-react";
import { CampoTexto, CampoUF, SecaoFormulario } from "@/components/cadastros/campos";

export type EnderecoInicial = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
} | null;

type RespostaViaCEP = {
  erro?: boolean | string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

/**
 * Seção de endereço com preenchimento automático pelo CEP (ViaCEP).
 * Ao completar 8 dígitos, busca e preenche rua, bairro, cidade e UF —
 * tudo continua editável à mão, e a falha na consulta nunca bloqueia o cadastro.
 */
export function BlocoEndereco({ dados }: { dados?: EnderecoInicial }) {
  const [cep, setCep] = React.useState(dados?.cep ?? "");
  const [logradouro, setLogradouro] = React.useState(dados?.logradouro ?? "");
  const [bairro, setBairro] = React.useState(dados?.bairro ?? "");
  const [cidade, setCidade] = React.useState(dados?.cidade ?? "");
  const [uf, setUf] = React.useState(dados?.uf ?? "");
  const [estado, setEstado] = React.useState<"parado" | "buscando" | "ok" | "aviso">("parado");
  const [aviso, setAviso] = React.useState<string | null>(null);
  const ultimoBuscado = React.useRef("");

  const buscarCep = async (digitos: string) => {
    if (digitos === ultimoBuscado.current) return;
    ultimoBuscado.current = digitos;
    setEstado("buscando");
    setAviso(null);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      if (!resposta.ok) throw new Error("resposta inválida");
      const dados = (await resposta.json()) as RespostaViaCEP;
      if (dados.erro) {
        setEstado("aviso");
        setAviso("CEP não encontrado — preencha o endereço à mão.");
        return;
      }
      if (dados.logradouro) setLogradouro(dados.logradouro);
      if (dados.bairro) setBairro(dados.bairro);
      if (dados.localidade) setCidade(dados.localidade);
      if (dados.uf) setUf(dados.uf);
      setEstado("ok");
    } catch {
      setEstado("aviso");
      setAviso("Não foi possível consultar o CEP agora — preencha à mão.");
    }
  };

  const aoDigitarCep = (valor: string) => {
    const digitos = valor.replace(/\D/g, "").slice(0, 8);
    setCep(digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos);
    if (digitos.length === 8) void buscarCep(digitos);
    else {
      setEstado("parado");
      setAviso(null);
      ultimoBuscado.current = "";
    }
  };

  return (
    <>
      <SecaoFormulario titulo="Endereço" />
      <div className="grid grid-cols-[150px_1fr] gap-3">
        <CampoTexto
          rotulo="CEP"
          nome="cep"
          valor={cep}
          aoMudar={aoDigitarCep}
          inputMode="numeric"
          placeholder="00000-000"
          extra={
            estado === "buscando" ? (
              <span className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-marca-600 border-t-transparent" />
            ) : estado === "ok" ? (
              <Check className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-sucesso" />
            ) : null
          }
        />
        <CampoTexto
          rotulo="Rua / logradouro"
          nome="logradouro"
          valor={logradouro}
          aoMudar={setLogradouro}
          placeholder="Ex.: Av. Centenário"
        />
      </div>

      {aviso ? (
        <p className="text-xs text-alerta">{aviso}</p>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          Digite o CEP e o sistema completa rua, bairro, cidade e UF.
        </p>
      )}

      <div className="grid grid-cols-[110px_1fr] gap-3">
        <CampoTexto rotulo="Número" nome="numero" valorInicial={dados?.numero} />
        <CampoTexto
          rotulo="Complemento"
          nome="complemento"
          valorInicial={dados?.complemento}
          placeholder="Sala, andar, bloco…"
        />
      </div>
      <div className="grid grid-cols-[1fr_1fr_90px] gap-3">
        <CampoTexto rotulo="Bairro" nome="bairro" valor={bairro} aoMudar={setBairro} />
        <CampoTexto rotulo="Cidade" nome="cidade" valor={cidade} aoMudar={setCidade} />
        {/* key remonta o seletor quando o CEP traz a UF */}
        <CampoUF key={uf || "sem-uf"} nome="uf" valorInicial={uf} />
      </div>
    </>
  );
}
