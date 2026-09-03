"use client";

import * as React from "react";
import { Check, MapPin } from "lucide-react";
import { CampoTexto, CampoUF, SecaoFormulario } from "@/components/cadastros/campos";
import { CampoTextoCadastro, useCadastro, useCampo } from "@/components/cadastros/contexto-cadastro";
import { apenasDigitos } from "@/lib/documentos";

type RespostaViaCEP = {
  erro?: boolean | string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

/**
 * Endereço com preenchimento automático pelo CEP (ViaCEP). Ao completar 8
 * dígitos, busca e preenche rua, bairro, cidade e UF — tudo segue editável
 * à mão, e a falha na consulta nunca bloqueia o cadastro.
 */
export function BlocoEndereco() {
  const { preencher } = useCadastro();
  const [cep, definirCep] = useCampo("cep");
  const [uf] = useCampo("uf");
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
      preencher(
        {
          logradouro: dados.logradouro ?? "",
          bairro: dados.bairro ?? "",
          cidade: dados.localidade ?? "",
          uf: dados.uf ?? "",
        },
        { sobrescrever: true }
      );
      setEstado("ok");
    } catch {
      setEstado("aviso");
      setAviso("Não foi possível consultar o CEP agora — preencha à mão.");
    }
  };

  const aoDigitarCep = (valor: string) => {
    const digitos = apenasDigitos(valor).slice(0, 8);
    definirCep(digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos);
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
        <CampoTextoCadastro
          rotulo="Rua / logradouro"
          nome="logradouro"
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
        <CampoTextoCadastro rotulo="Número" nome="numero" />
        <CampoTextoCadastro
          rotulo="Complemento"
          nome="complemento"
          placeholder="Sala, andar, bloco…"
        />
      </div>
      <div className="grid grid-cols-[1fr_1fr_90px] gap-3">
        <CampoTextoCadastro rotulo="Bairro" nome="bairro" />
        <CampoTextoCadastro rotulo="Cidade" nome="cidade" />
        {/* key remonta o seletor quando CEP ou CNPJ trazem a UF */}
        <CampoUF key={uf || "sem-uf"} nome="uf" valorInicial={uf} />
      </div>
    </>
  );
}
