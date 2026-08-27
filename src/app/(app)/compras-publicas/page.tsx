import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pilula } from "@/components/selo-territorio";
import { Landmark, Radar } from "lucide-react";
import {
  STATUS_COMPRA_PUBLICA,
  TOM_STATUS_COMPRA,
  TIPOS_COMPRA_PUBLICA,
  ehDoisge,
} from "@/lib/dominio";
import { formatarMoeda, formatarData } from "@/lib/utils";
import { buscarLicitacoesPNCP, type LicitacaoPNCP } from "@/lib/pncp";
import { RadarPNCP, type PalavraChave } from "@/components/compras-publicas/radar-pncp";

export const metadata = { title: "Compras públicas" };

export default async function ComprasPublicasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: perfil }, { data: processos }, { data: palavras }] = await Promise.all([
    supabase.from("profiles").select("perfil").eq("id", user!.id).single(),
    supabase
      .from("processos_compra_publica")
      .select(
        "id, oportunidade_id, tipo_compra_publica, status_compra, numero_edital, data_sessao, valor_estimado, oportunidades ( codigo, nome_oportunidade, municipios ( nome, uf ) )"
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("palavras_chave_pncp")
      .select("id, termo, uf")
      .eq("ativo", true)
      .order("created_at"),
  ]);

  // Busca no PNCP em paralelo (limite de 6 termos para manter a página rápida)
  const termos = ((palavras ?? []) as PalavraChave[]).slice(0, 6);
  const buscas = await Promise.all(
    termos.map((p) => buscarLicitacoesPNCP(p.termo, p.uf, 8))
  );
  const resultados: Record<string, LicitacaoPNCP[]> = {};
  termos.forEach((p, i) => {
    resultados[p.id] = buscas[i];
  });

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compras públicas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Os processos das suas oportunidades e o radar de licitações abertas no
          PNCP por palavra-chave.
        </p>
      </div>

      <Tabs defaultValue="processos">
        <TabsList>
          <TabsTrigger value="processos">
            <Landmark className="size-3.5" />
            Meus processos
            {(processos ?? []).length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                {(processos ?? []).length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="radar">
            <Radar className="size-3.5" />
            Radar PNCP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="processos" className="mt-4">
          {(processos ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <Landmark className="mx-auto size-8 text-marca-600" strokeWidth={1.5} />
              <p className="mt-3 font-medium">Nenhum processo de compra pública</p>
              <p className="mt-1 text-sm text-muted-foreground">
                O processo é criado dentro da oportunidade, na aba "Compra pública".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oportunidade</TableHead>
                    <TableHead className="hidden md:table-cell">Modalidade</TableHead>
                    <TableHead className="hidden sm:table-cell">Edital</TableHead>
                    <TableHead className="hidden lg:table-cell">Sessão</TableHead>
                    <TableHead className="text-right">Valor estimado</TableHead>
                    <TableHead>Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(processos ?? []).map((p) => {
                    const oport = p.oportunidades as unknown as {
                      codigo: number;
                      nome_oportunidade: string;
                      municipios: { nome: string; uf: string } | null;
                    } | null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            href={`/oportunidades/${p.oportunidade_id}`}
                            className="font-medium hover:text-marca-700"
                          >
                            <span className="font-mono text-xs text-muted-foreground">
                              #{oport?.codigo}
                            </span>{" "}
                            {oport?.nome_oportunidade}
                          </Link>
                          <span className="block text-xs text-muted-foreground">
                            {oport?.municipios
                              ? `${oport.municipios.nome} · ${oport.municipios.uf}`
                              : ""}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {p.tipo_compra_publica
                            ? TIPOS_COMPRA_PUBLICA[p.tipo_compra_publica]
                            : "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-xs">
                          {p.numero_edital ?? "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatarData(p.data_sessao)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatarMoeda(p.valor_estimado)}
                        </TableCell>
                        <TableCell>
                          <Pilula tom={TOM_STATUS_COMPRA[p.status_compra] ?? "neutro"}>
                            {STATUS_COMPRA_PUBLICA[p.status_compra] ?? p.status_compra}
                          </Pilula>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="radar" className="mt-4">
          <RadarPNCP
            palavras={termos}
            resultados={resultados}
            podeEditar={ehDoisge(perfil?.perfil)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
