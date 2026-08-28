"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UFS, PORTES_MUNICIPIO } from "@/lib/dominio";

const SITUACOES: Record<string, string> = {
  livre: "Livre",
  preferencial: "Preferencial",
  exclusiva: "Exclusiva",
};

export function FiltrosMunicipios() {
  const router = useRouter();
  const params = useSearchParams();
  const [busca, setBusca] = React.useState(params.get("q") ?? "");
  const [filtrando, startFiltro] = React.useTransition();

  const uf = params.get("uf") ?? "todas";
  const porte = params.get("porte") ?? "todos";
  const territorio = params.get("territorio") ?? "todas";

  const montarUrl = (mudancas: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [chave, valor] of Object.entries(mudancas)) {
      const vazio =
        valor === "" || valor === "todas" || valor === "todos";
      if (vazio) p.delete(chave);
      else p.set(chave, valor);
    }
    p.delete("pagina"); // filtro novo volta para a página 1
    const query = p.toString();
    return query ? `/municipios?${query}` : "/municipios";
  };

  const aplicar = (mudancas: Record<string, string>) =>
    startFiltro(() => router.push(montarUrl(mudancas)));

  // Digitação: filtra ao vivo com debounce, sem poluir o histórico
  const primeiraRenderizacao = React.useRef(true);
  React.useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const t = setTimeout(() => {
      startFiltro(() => router.replace(montarUrl({ q: busca }), { scroll: false }));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const temFiltro =
    busca !== "" || uf !== "todas" || porte !== "todos" || territorio !== "todas";

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        aplicar({ q: busca });
      }}
    >
      <div className="relative flex-1 min-w-52">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite o nome do município — a lista filtra sozinha…"
          className="pl-8"
        />
        {filtrando && (
          <span className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-marca-600 border-t-transparent" />
        )}
      </div>

      <Select
        value={territorio}
        onValueChange={(v) => aplicar({ territorio: (v as string) ?? "todas" })}
        items={{ todas: "Todas as situações", ...SITUACOES }}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as situações</SelectItem>
          {Object.entries(SITUACOES).map(([valor, rotulo]) => (
            <SelectItem key={valor} value={valor}>
              {rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={porte}
        onValueChange={(v) => aplicar({ porte: (v as string) ?? "todos" })}
        items={{ todos: "Todos os portes", ...PORTES_MUNICIPIO }}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os portes</SelectItem>
          {Object.entries(PORTES_MUNICIPIO).map(([valor, rotulo]) => (
            <SelectItem key={valor} value={valor}>
              {rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={uf}
        onValueChange={(v) => aplicar({ uf: (v as string) ?? "todas" })}
        items={{ todas: "Todas as UFs", ...Object.fromEntries(UFS.map((s) => [s, s])) }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as UFs</SelectItem>
          {UFS.map((sigla) => (
            <SelectItem key={sigla} value={sigla}>
              {sigla}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {temFiltro && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setBusca("");
            startFiltro(() => router.push("/municipios"));
          }}
        >
          <X className="size-3.5" />
          Limpar filtros
        </Button>
      )}
    </form>
  );
}
