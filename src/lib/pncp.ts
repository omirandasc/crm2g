// Cliente da API pública de busca do PNCP (Portal Nacional de Contratações
// Públicas). Sem autenticação; a API oscila (conexões resetadas), então toda
// busca tem nova tentativa e falha de forma silenciosa devolvendo lista vazia.

export type LicitacaoPNCP = {
  id: string;
  objeto: string;
  orgao: string;
  municipio: string | null;
  uf: string | null;
  modalidade: string | null;
  situacao: string | null;
  dataPublicacao: string | null;
  prazoPropostas: string | null;
  valorGlobal: number | null;
  url: string;
};

type ItemBrutoPNCP = {
  numero_controle_pncp?: string;
  description?: string;
  title?: string;
  orgao_nome?: string;
  orgao_cnpj?: string;
  ano?: string;
  numero_sequencial?: string;
  municipio_nome?: string;
  uf?: string;
  modalidade_licitacao_nome?: string;
  situacao_nome?: string;
  data_publicacao_pncp?: string;
  data_fim_vigencia?: string;
  valor_global?: number | null;
};

export async function buscarLicitacoesPNCP(
  termo: string,
  uf?: string | null,
  limite = 10
): Promise<LicitacaoPNCP[]> {
  const parametros = new URLSearchParams({
    q: termo,
    tipos_documento: "edital",
    ordenacao: "-data",
    pagina: "1",
    tam_pagina: String(limite),
    status: "recebendo_proposta",
  });
  if (uf) parametros.set("ufs", uf);

  const url = `https://pncp.gov.br/api/search/?${parametros.toString()}`;

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const resposta = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (CRM DOISGE)", Accept: "application/json" },
        next: { revalidate: 1800 },
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const corpo = (await resposta.json()) as { items?: ItemBrutoPNCP[] };

      return (corpo.items ?? []).map((i) => ({
        id: i.numero_controle_pncp ?? `${i.orgao_cnpj}-${i.ano}-${i.numero_sequencial}`,
        objeto: (i.description || i.title || "").trim(),
        orgao: i.orgao_nome ?? "Órgão não informado",
        municipio: i.municipio_nome ?? null,
        uf: i.uf ?? null,
        modalidade: i.modalidade_licitacao_nome ?? null,
        situacao: i.situacao_nome ?? null,
        dataPublicacao: i.data_publicacao_pncp ?? null,
        prazoPropostas: i.data_fim_vigencia ?? null,
        valorGlobal: i.valor_global ?? null,
        url: `https://pncp.gov.br/app/editais/${i.orgao_cnpj}/${i.ano}/${i.numero_sequencial}`,
      }));
    } catch {
      if (tentativa < 2) await new Promise((r) => setTimeout(r, 1200));
    }
  }
  return [];
}
