"use client";

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
}: {
  rotulo: string;
  nome: string;
  valorInicial?: string | null;
  obrigatorio?: boolean;
  tipo?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={nome}>
        {rotulo}
        {obrigatorio && <span className="text-erro"> *</span>}
      </Label>
      <Input
        id={nome}
        name={nome}
        type={tipo}
        defaultValue={valorInicial ?? ""}
        required={obrigatorio}
        placeholder={placeholder}
      />
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

export function SecaoFormulario({ titulo }: { titulo: string }) {
  return (
    <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {titulo}
    </p>
  );
}
