"use client";

import * as React from "react";
import { ChevronsUpDown, MapPin, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Municipio = { id: string; nome: string; uf: string; populacao: number | null };

/** Seletor de município com busca no banco (5.571 cidades do IBGE). */
export function CampoMunicipio({
  rotulo = "Município",
  nome,
  obrigatorio,
  valorInicial,
}: {
  rotulo?: string;
  nome: string;
  obrigatorio?: boolean;
  valorInicial?: { id: string; nome: string; uf: string } | null;
}) {
  const [aberto, setAberto] = React.useState(false);
  const [busca, setBusca] = React.useState("");
  const [opcoes, setOpcoes] = React.useState<Municipio[]>([]);
  const [escolhido, setEscolhido] = React.useState<Municipio | null>(
    valorInicial ? { ...valorInicial, populacao: null } : null
  );

  React.useEffect(() => {
    if (!aberto) return;
    const supabase = createClient();
    const t = setTimeout(async () => {
      let consulta = supabase
        .from("municipios")
        .select("id, nome, uf, populacao")
        .order("populacao", { ascending: false, nullsFirst: false })
        .limit(15);
      if (busca) consulta = consulta.ilike("nome", `${busca}%`);
      const { data } = await consulta;
      setOpcoes(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [busca, aberto]);

  return (
    <div className="space-y-1.5">
      <Label>
        {rotulo}
        {obrigatorio && <span className="text-erro"> *</span>}
      </Label>
      <input type="hidden" name={nome} value={escolhido?.id ?? ""} required={obrigatorio} />
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            >
              <span className="flex items-center gap-2 truncate">
                <MapPin className="size-4 text-muted-foreground" />
                {escolhido ? `${escolhido.nome} · ${escolhido.uf}` : "Buscar cidade…"}
              </span>
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent className="w-[--anchor-width] min-w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Digite o nome da cidade…"
              value={busca}
              onValueChange={setBusca}
            />
            <CommandList>
              <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
              <CommandGroup>
                {opcoes.map((m) => (
                  <CommandItem
                    key={m.id}
                    value={m.id}
                    onSelect={() => {
                      setEscolhido(m);
                      setAberto(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        escolhido?.id === m.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {m.nome} · {m.uf}
                    {m.populacao != null && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {m.populacao.toLocaleString("pt-BR")} hab.
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
