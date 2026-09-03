"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UFS } from "@/lib/dominio";

export function CampoTexto({
  rotulo,
  nome,
  valorInicial,
  obrigatorio,
  tipo = "text",
  placeholder,
  valor,
  aoMudar,
  aoSairDoCampo,
  inputMode,
  extra,
}: {
  rotulo: string;
  nome: string;
  valorInicial?: string | null;
  obrigatorio?: boolean;
  tipo?: string;
  placeholder?: string;
  /** Use valor + aoMudar para campo controlado (ex.: preenchido pelo CEP). */
  valor?: string;
  aoMudar?: (valor: string) => void;
  aoSairDoCampo?: () => void;
  inputMode?: "text" | "numeric";
  /** Conteúdo à direita do campo (ex.: indicador de busca). */
  extra?: React.ReactNode;
}) {
  const controlado = valor !== undefined && aoMudar !== undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={nome}>
        {rotulo}
        {obrigatorio && <span className="text-erro"> *</span>}
      </Label>
      <div className={extra ? "relative" : undefined}>
        <Input
          id={nome}
          name={nome}
          type={tipo}
          inputMode={inputMode}
          {...(controlado
            ? { value: valor, onChange: (e) => aoMudar(e.target.value) }
            : { defaultValue: valorInicial ?? "" })}
          onBlur={aoSairDoCampo}
          required={obrigatorio}
          placeholder={placeholder}
        />
        {extra}
      </div>
    </div>
  );
}

export function CampoTextoLongo({
  rotulo,
  nome,
  valorInicial,
  placeholder,
}: {
  rotulo: string;
  nome: string;
  valorInicial?: string | null;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={nome}>{rotulo}</Label>
      <Textarea
        id={nome}
        name={nome}
        defaultValue={valorInicial ?? ""}
        placeholder={placeholder}
        rows={3}
      />
    </div>
  );
}

export function CampoSelecao({
  rotulo,
  nome,
  opcoes,
  valorInicial,
  obrigatorio,
  permitirVazio,
  rotuloVazio = "— Nenhum —",
}: {
  rotulo: string;
  nome: string;
  opcoes: Record<string, string>;
  valorInicial?: string | null;
  obrigatorio?: boolean;
  permitirVazio?: boolean;
  rotuloVazio?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={nome}>
        {rotulo}
        {obrigatorio && <span className="text-erro"> *</span>}
      </Label>
      <Select
        name={nome}
        items={permitirVazio ? { "": rotuloVazio, ...opcoes } : opcoes}
        defaultValue={valorInicial ?? (permitirVazio ? "" : undefined)}
        required={obrigatorio}
      >
        <SelectTrigger id={nome} className="w-full">
          <SelectValue placeholder="Escolher…" />
        </SelectTrigger>
        <SelectContent>
          {permitirVazio && <SelectItem value="">{rotuloVazio}</SelectItem>}
          {Object.entries(opcoes).map(([valor, texto]) => (
            <SelectItem key={valor} value={valor}>
              {texto}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CampoUF({
  rotulo = "UF",
  nome,
  valorInicial,
  permitirVazio = true,
}: {
  rotulo?: string;
  nome: string;
  valorInicial?: string | null;
  permitirVazio?: boolean;
}) {
  return (
    <CampoSelecao
      rotulo={rotulo}
      nome={nome}
      valorInicial={valorInicial}
      permitirVazio={permitirVazio}
      rotuloVazio="—"
      opcoes={Object.fromEntries(UFS.map((s) => [s, s]))}
    />
  );
}

/** Seleção de várias UFs por chips clicáveis; envia CSV num input oculto. */
export function CampoUFsMultiplas({
  rotulo = "UFs de credenciamento",
  nome,
  valorInicial,
}: {
  rotulo?: string;
  nome: string;
  valorInicial?: string[] | null;
}) {
  const [selecionadas, setSelecionadas] = React.useState<string[]>(valorInicial ?? []);

  const alternar = (sigla: string) =>
    setSelecionadas((atual) =>
      atual.includes(sigla) ? atual.filter((s) => s !== sigla) : [...atual, sigla].sort()
    );

  return (
    <div className="space-y-1.5">
      <Label>{rotulo}</Label>
      <input type="hidden" name={nome} value={selecionadas.join(",")} />
      <div className="flex flex-wrap gap-1">
        {UFS.map((sigla) => {
          const ativa = selecionadas.includes(sigla);
          return (
            <button
              key={sigla}
              type="button"
              onClick={() => alternar(sigla)}
              aria-pressed={ativa}
              className={
                ativa
                  ? "rounded-md bg-marca-600 px-2 py-1 font-mono text-xs font-semibold text-white"
                  : "rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground hover:border-marca-600/50 hover:text-foreground"
              }
            >
              {sigla}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {selecionadas.length > 0
          ? `Credenciado em: ${selecionadas.join(", ")}`
          : "Nenhuma UF selecionada — sem restrição de cidades."}
      </p>
    </div>
  );
}

export function SecaoFormulario({ titulo }: { titulo: string }) {
  return (
    <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {titulo}
    </p>
  );
}
