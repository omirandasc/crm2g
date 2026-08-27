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
import { UFS } from "@/lib/dominio";

export function FiltrosMunicipios() {
  const router = useRouter();
  const params = useSearchParams();
  const [busca, setBusca] = React.useState(params.get("q") ?? "");
  const [uf, setUf] = React.useState(params.get("uf") ?? "todas");
  const [filtrando, startFiltro] = React.useTransition();

  const montarUrl = (novaBusca: string, novaUf: string) => {
    const p = new URLSearchParams();
    if (novaBusca) p.set("q", novaBusca);
    if (novaUf && novaUf !== "todas") p.set("uf", novaUf);
    return `/municipios?${p.toString()}`;
  };

  // Enter / troca de UF: fixa o filtro (entra no histórico, dá para copiar o link)
  const aplicar = (novaBusca: string, novaUf: string) => {
    startFiltro(() => router.push(montarUrl(novaBusca, novaUf)));
  };

  // Digitação: filtra ao vivo com debounce, sem poluir o histórico
  const primeiraRenderizacao = React.useRef(true);
  React.useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const t = setTimeout(() => {
      startFiltro(() => router.replace(montarUrl(busca, uf), { scroll: false }));
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const temFiltro = busca !== "" || uf !== "todas";

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        aplicar(busca, uf);
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
        value={uf}
        onValueChange={(v) => {
          const nova = (v as string) ?? "todas";
          setUf(nova);
          aplicar(busca, nova);
        }}
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
            setUf("todas");
            router.push("/municipios");
          }}
        >
          <X className="size-3.5" />
          Limpar
        </Button>
      )}
    </form>
  );
}
