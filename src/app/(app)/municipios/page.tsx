import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatarNumero } from "@/lib/utils";
import { PORTES_MUNICIPIO, UFS } from "@/lib/dominio";
import { Search } from "lucide-react";

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
    .select("id, codigo_ibge, nome, uf, populacao, porte, regiao", {
      count: "exact",
    })
    .order("nome")
    .range(de, de + POR_PAGINA - 1);

  if (q) consulta = consulta.ilike("nome", `%${q}%`);
  if (uf) consulta = consulta.eq("uf", uf);

  const { data: municipios, count } = await consulta;
  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const parametros = (novaPagina: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (uf) p.set("uf", uf);
    p.set("pagina", String(novaPagina));
    return `?${p.toString()}`;
  };

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Municípios</h1>
          <p className="mt-1 text-sm text-tinta-suave">
            Base oficial do IBGE — {formatarNumero(total)} municípios encontrados.
          </p>
        </div>
      </div>

      <form className="mt-6 flex flex-wrap gap-3" method="get">
        <div className="relative flex-1 min-w-56">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta-fraca"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome do município…"
            className="w-full rounded-md border border-linha-forte bg-cartao pl-9 pr-3 py-2 text-sm placeholder:text-tinta-fraca"
          />
        </div>
        <select
          name="uf"
          defaultValue={uf}
          className="rounded-md border border-linha-forte bg-cartao px-3 py-2 text-sm"
        >
          <option value="">Todas as UFs</option>
          {UFS.map((sigla) => (
            <option key={sigla} value={sigla}>
              {sigla}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-marca-600 hover:bg-marca-700 text-white px-4 py-2 text-sm font-medium transition-colors"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border border-linha bg-cartao shadow-cartao">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-linha text-left text-xs uppercase tracking-wider text-tinta-fraca">
              <th className="px-4 py-3 font-medium">Município</th>
              <th className="px-4 py-3 font-medium">UF</th>
              <th className="px-4 py-3 font-medium">Região</th>
              <th className="px-4 py-3 font-medium text-right">População</th>
              <th className="px-4 py-3 font-medium">Porte</th>
              <th className="px-4 py-3 font-medium">Código IBGE</th>
            </tr>
          </thead>
          <tbody>
            {(municipios ?? []).map((m) => (
              <tr key={m.id} className="border-b border-linha last:border-0 hover:bg-papel/60">
                <td className="px-4 py-2.5 font-medium">{m.nome}</td>
                <td className="px-4 py-2.5">{m.uf}</td>
                <td className="px-4 py-2.5 text-tinta-suave">{m.regiao}</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {formatarNumero(m.populacao)}
                </td>
                <td className="px-4 py-2.5 text-tinta-suave">
                  {PORTES_MUNICIPIO[m.porte as string] ?? "—"}
                </td>
                <td className="px-4 py-2.5 font-mono text-tinta-fraca">{m.codigo_ibge}</td>
              </tr>
            ))}
            {(municipios ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-tinta-suave">
                  Nenhum município encontrado com esses filtros. Limpe a busca e tente de novo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-tinta-suave">
            Página {paginaAtual} de {formatarNumero(totalPaginas)}
          </p>
          <div className="flex gap-2">
            {paginaAtual > 1 && (
              <Link
                href={parametros(paginaAtual - 1)}
                className="rounded-md border border-linha bg-cartao px-3 py-1.5 hover:bg-papel"
              >
                Anterior
              </Link>
            )}
            {paginaAtual < totalPaginas && (
              <Link
                href={parametros(paginaAtual + 1)}
                className="rounded-md border border-linha bg-cartao px-3 py-1.5 hover:bg-papel"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
