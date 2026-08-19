"use client";

import * as React from "react";
import { Upload, FileCheck2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Upload para o Storage do Supabase; grava o caminho num input oculto. */
export function CampoArquivo({
  rotulo = "Arquivo",
  nome,
  balde,
  pasta,
  obrigatorio,
}: {
  rotulo?: string;
  nome: string;
  balde: "materiais" | "documentos" | "certidoes";
  pasta: string;
  obrigatorio?: boolean;
}) {
  const [caminho, setCaminho] = React.useState("");
  const [nomeArquivo, setNomeArquivo] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [erro, setErro] = React.useState("");

  const aoEscolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setEnviando(true);
    setErro("");
    const supabase = createClient();
    const destino = `${pasta}/${Date.now()}-${arquivo.name.replace(/[^\w.\-]+/g, "_")}`;
    const { error } = await supabase.storage.from(balde).upload(destino, arquivo);
    setEnviando(false);
    if (error) {
      setErro("Falha no envio: " + error.message);
      return;
    }
    setCaminho(`${balde}/${destino}`);
    setNomeArquivo(arquivo.name);
  };

  return (
    <div className="space-y-1.5">
      <Label>
        {rotulo}
        {obrigatorio && <span className="text-erro"> *</span>}
      </Label>
      <input type="hidden" name={nome} value={caminho} required={obrigatorio} />
      <label
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm transition-colors hover:bg-muted",
          caminho && "border-solid border-sucesso/40 bg-sucesso-fundo"
        )}
      >
        {enviando ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : caminho ? (
          <FileCheck2 className="size-4 text-sucesso" />
        ) : (
          <Upload className="size-4 text-muted-foreground" />
        )}
        <span className={caminho ? "text-sucesso" : "text-muted-foreground"}>
          {enviando ? "Enviando…" : nomeArquivo || "Clique para escolher o arquivo"}
        </span>
        <input type="file" className="sr-only" onChange={aoEscolher} />
      </label>
      {erro && <p className="text-xs text-erro">{erro}</p>}
    </div>
  );
}

/** Botão de download com URL assinada temporária. */
export function BotaoBaixar({ caminho, children }: { caminho: string; children?: React.ReactNode }) {
  const abrir = async () => {
    const [balde, ...resto] = caminho.split("/");
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(balde)
      .createSignedUrl(resto.join("/"), 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else alert("Não foi possível abrir o arquivo" + (error ? `: ${error.message}` : "."));
  };
  return (
    <button type="button" onClick={abrir} className="text-marca-700 hover:underline text-sm font-medium">
      {children ?? "Baixar"}
    </button>
  );
}
