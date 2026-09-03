"use client";

import * as React from "react";
import { Check, AlertTriangle, Building2 } from "lucide-react";
import { SecaoFormulario } from "@/components/cadastros/campos";
import { CampoTextoCadastro, useCadastro, useCampo } from "@/components/cadastros/contexto-cadastro";
import { apenasDigitos, mascararCNPJ, validarCNPJ } from "@/lib/documentos";

type RespostaCNPJ = {
  razao_social?: string;
  nome_fantasia?: string;
  descricao_situacao_cadastral?: string;
  descricao_tipo_de_logradouro?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  ddd_telefone_1?: string;
  email?: string;
};

const SITUACOES_BOAS = ["ATIVA"];

/**
 * Identificação com consulta automática do CNPJ na base pública da Receita
 * Federal (BrasilAPI). Preenche apenas os campos ainda vazios — o que já foi
 * digitado é preservado.
 */
export function BlocoIdentificacao({
  placeholderRazao,
}: {
  placeholderRazao?: string;
}) {
  const { preencher } = useCadastro();
  const [cnpj] = useCampo("cnpj");
  const [estado, setEstado] = React.useState<"parado" | "buscando" | "ok" | "erro">("parado");
  const [situacao, setSituacao] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const ultimoBuscado = React.useRef("");

  const digitos = apenasDigitos(cnpj);
  const invalido = digitos.length === 14 && !validarCNPJ(digitos);

  React.useEffect(() => {
    if (digitos.length !== 14 || !validarCNPJ(digitos)) {
      if (digitos.length < 14) {
        setEstado("parado");
        setSituacao(null);
        setAviso(null);
        ultimoBuscado.current = "";
      }
      return;
    }
    if (digitos === ultimoBuscado.current) return;
    ultimoBuscado.current = digitos;

    let cancelado = false;
    (async () => {
      setEstado("buscando");
      setAviso(null);
      try {
        const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`);
        if (!r.ok) throw new Error(String(r.status));
        const d = (await r.json()) as RespostaCNPJ;
        if (cancelado) return;

        const logradouro = [d.descricao_tipo_de_logradouro, d.logradouro]
          .filter(Boolean)
          .join(" ")
          .trim();

        preencher({
          razao_social: d.razao_social ?? "",
          nome_fantasia: d.nome_fantasia ?? "",
          logradouro,
          numero: d.numero ?? "",
          complemento: d.complemento ?? "",
          bairro: d.bairro ?? "",
          cep: d.cep ? mascararCEP(d.cep) : "",
          cidade: d.municipio ? capitalizar(d.municipio) : "",
          uf: d.uf ?? "",
          telefone_responsavel: d.ddd_telefone_1 ?? "",
          email_institucional: d.email ?? "",
        });
        setSituacao(d.descricao_situacao_cadastral ?? null);
        setEstado("ok");
      } catch {
        if (cancelado) return;
        setEstado("erro");
        setAviso("Não foi possível consultar o CNPJ agora — preencha à mão.");
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digitos]);

  const situacaoBoa = situacao ? SITUACOES_BOAS.includes(situacao.toUpperCase()) : false;

  return (
    <>
      <SecaoFormulario titulo="Identificação" />
      <CampoTextoCadastro
        rotulo="CNPJ"
        nome="cnpj"
        placeholder="00.000.000/0000-00"
        inputMode="numeric"
        transformar={mascararCNPJ}
        extra={
          estado === "buscando" ? (
            <span className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-marca-600 border-t-transparent" />
          ) : estado === "ok" ? (
            <Check className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-sucesso" />
          ) : null
        }
      />

      {invalido ? (
        <p className="flex items-center gap-1.5 text-xs text-erro">
          <AlertTriangle className="size-3" />
          CNPJ inválido — confira os números digitados.
        </p>
      ) : aviso ? (
        <p className="text-xs text-alerta">{aviso}</p>
      ) : situacao ? (
        <p className="flex items-center gap-1.5 text-xs">
          <span
            className={
              situacaoBoa
                ? "rounded-md bg-sucesso-fundo px-1.5 py-0.5 font-semibold text-sucesso"
                : "rounded-md bg-erro-fundo px-1.5 py-0.5 font-semibold text-erro"
            }
          >
            {situacao}
          </span>
          <span className="text-muted-foreground">situação na Receita Federal</span>
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3" />
          Digite o CNPJ e o sistema busca razão social, nome fantasia e endereço na Receita.
        </p>
      )}

      <CampoTextoCadastro
        rotulo="Razão social"
        nome="razao_social"
        obrigatorio
        placeholder={placeholderRazao}
      />
      <CampoTextoCadastro rotulo="Nome fantasia" nome="nome_fantasia" />
    </>
  );
}

function mascararCEP(valor: string) {
  const d = apenasDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function capitalizar(texto: string) {
  return texto
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((p) => (p.length > 2 ? p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1) : p))
    .join(" ");
}
