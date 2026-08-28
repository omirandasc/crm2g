import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { formatarNumero } from "@/lib/utils";
import { FiltrosMunicipios } from "@/components/municipios/filtros";
import { TabelaMunicipios, type MunicipioLinha } from "@/components/municipios/tabela";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata = { title: "Municípios" };

const POR_PAGINA = 25;

export default async function MunicipiosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; uf?: string; pagina?: string }>;
}) {
  const { q = "", uf = "", pagina = "1" } = await searchParams;
  const paginaAtual = Math.max(1, parseInt(pagina, 10) || 1);
  const de = (paginaAtual - 1) * POR_PAGINA;

  const supabase = await createClient();

  let consulta = supabase
    .from("municipios")
    .select("id, codigo_ibge, nome, uf, populacao, porte, regiao, microrregiao", {
      count: "exact",
    })
    .order("nome")
    .range(de, de + POR_PAGINA - 1);

  // Busca ignorando acentos: normaliza o termo e consulta a coluna nome_busca
  const termoNormalizado = q
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  if (q) consulta = consulta.ilike("nome_busca", `%${termoNormalizado}%`);
  if (uf) consulta = consulta.eq("uf", uf);

  const { data: municipios, count } = await consulta;
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  // Situação territorial real dos municípios da página
  const ids = (municipios ?? []).map((m) => m.id);
  const [{ data: preferenciais }, { data: exclusivas }] = await Promise.all([
    ids.length
      ? supabase
          .from("areas_preferenciais")
          .select(
            "municipio_id, produtos ( nome_produto ), parceiros_rede ( razao_social, nome_fantasia )"
          )
          .in("municipio_id", ids)
          .in("status", ["aprovada", "ativa"])
      : Promise.resolve({ data: [] as never[] }),
    ids.length
      ? supabase
          .from("areas_exclusivas")
          .select(
            "municipio_id, produtos ( nome_produto ), parceiros_rede ( razao_social, nome_fantasia )"
          )
          .in("municipio_id", ids)
          .in("status", ["ativa", "em_implantacao", "em_renovacao", "mantida_por_direito_economico"])
      : Promise.resolve({ data: [] as never[] }),
  ]);

  type AreaBruta = {
    municipio_id: string;
    produtos: { nome_produto: string } | null;
    parceiros_rede: { razao_social: string; nome_fantasia: string | null } | null;
  };

  const territorios: Record<
    string,
    { status: "livre" | "preferencial" | "exclusiva"; itens: { tipo: string; produto: string; canal: string }[] }
  > = {};
  const registrar = (a: AreaBruta, tipo: "preferencial" | "exclusiva") => {
    const alvo = (territorios[a.municipio_id] ??= { status: "livre", itens: [] });
    alvo.itens.push({
      tipo,
      produto: a.produtos?.nome_produto ?? "Produto",
      canal: a.parceiros_rede?.nome_fantasia || a.parceiros_rede?.razao_social || "Canal",
    });
    if (tipo === "exclusiva" || alvo.status === "livre") alvo.status = tipo;
  };
  ((preferenciais ?? []) as unknown as AreaBruta[]).forEach((a) => registrar(a, "preferencial"));
  ((exclusivas ?? []) as unknown as AreaBruta[]).forEach((a) => registrar(a, "exclusiva"));

  const linkPagina = (nova: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (uf) p.set("uf", uf);
    p.set("pagina", String(nova));
    return `/municipios?${p.toString()}`;
  };

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Municípios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Base oficial do IBGE — {formatarNumero(total)} municípios encontrados.
          Clique em uma linha para ver os detalhes.
        </p>
      </div>

      <Suspense>
        <FiltrosMunicipios />
      </Suspense>

      <TabelaMunicipios
        linhas={(municipios ?? []) as MunicipioLinha[]}
        territorios={territorios}
      />

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Página {formatarNumero(paginaAtual)} de {formatarNumero(totalPaginas)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual <= 1}
              nativeButton={false}
              render={<Link href={linkPagina(paginaAtual - 1)} aria-disabled={paginaAtual <= 1} />}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={paginaAtual >= totalPaginas}
              nativeButton={false}
              render={<Link href={linkPagina(paginaAtual + 1)} aria-disabled={paginaAtual >= totalPaginas} />}
            >
              Próxima
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
