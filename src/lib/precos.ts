// Cálculo do valor de tabela de uma oportunidade a partir da tabela de
// preços do produto. Puro (sem banco): roda no formulário, enquanto o
// usuário escolhe produto/cidade/quantidade, e de novo no servidor ao salvar.

export type PrecoVigente = {
  produto_id: string;
  tipo_preco: string;
  valor: number | string;
  faixa_inicial: number | null;
  faixa_final: number | null;
};

export type ResultadoTabela = {
  /** faixa = por habitante (mensal); unidade = por kit/usuário/serviço; fixo = mensalidade; consulta = sem faixa/sob consulta; sem_tabela = produto sem preço cadastrado */
  modo: "faixa" | "unidade" | "fixo" | "consulta" | "sem_tabela";
  valor: number | null;
  /** Preço de uma unidade, quando o modo é por unidade. */
  unitario: number | null;
  /** Explicação curta para mostrar ao lado do valor. */
  descricao: string;
};

const POR_UNIDADE = ["por_kit", "por_usuario", "por_servico"];
const POR_FAIXA = ["por_habitante", "tabela_faixa"];

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function calcularTabela(
  precos: PrecoVigente[],
  produtoId: string | null | undefined,
  populacao: number | null | undefined,
  quantidade: number | null | undefined
): ResultadoTabela {
  const doProduto = produtoId ? precos.filter((p) => p.produto_id === produtoId) : [];
  if (doProduto.length === 0) {
    return {
      modo: "sem_tabela",
      valor: null,
      unitario: null,
      descricao: "Este produto ainda não tem tabela de preços cadastrada — informe o valor manualmente.",
    };
  }

  const unidade = doProduto.find((p) => POR_UNIDADE.includes(p.tipo_preco));
  if (unidade) {
    const unitario = Number(unidade.valor);
    const rotulo =
      unidade.tipo_preco === "por_kit" ? "kit" : unidade.tipo_preco === "por_usuario" ? "usuário" : "serviço";
    if (!quantidade || quantidade <= 0) {
      return { modo: "unidade", valor: null, unitario, descricao: `${moeda(unitario)} por ${rotulo} — informe a quantidade.` };
    }
    return {
      modo: "unidade",
      valor: Math.round(unitario * quantidade * 100) / 100,
      unitario,
      descricao: `${quantidade.toLocaleString("pt-BR")} ${rotulo}${quantidade > 1 ? "s" : ""} × ${moeda(unitario)}`,
    };
  }

  const faixas = doProduto.filter((p) => POR_FAIXA.includes(p.tipo_preco));
  if (faixas.length > 0) {
    if (populacao == null) {
      return { modo: "faixa", valor: null, unitario: null, descricao: "Escolha o município para calcular pela população." };
    }
    const faixa = faixas.find(
      (f) => populacao >= (f.faixa_inicial ?? 0) && populacao <= (f.faixa_final ?? Number.MAX_SAFE_INTEGER)
    );
    if (!faixa) {
      return {
        modo: "consulta",
        valor: null,
        unitario: null,
        descricao: `${populacao.toLocaleString("pt-BR")} habitantes fica fora das faixas da tabela — valor sob consulta à DoisGe.`,
      };
    }
    const ate = faixa.faixa_final ? `até ${faixa.faixa_final.toLocaleString("pt-BR")}` : "acima";
    return {
      modo: "faixa",
      valor: Number(faixa.valor),
      unitario: null,
      descricao: `Faixa ${ate} habitantes (município com ${populacao.toLocaleString("pt-BR")}) — valor mensal.`,
    };
  }

  const fixo = doProduto.find((p) => ["mensalidade", "valor_unico", "por_implantacao", "anual"].includes(p.tipo_preco));
  if (fixo) {
    const valor = fixo.tipo_preco === "anual" ? Math.round((Number(fixo.valor) / 12) * 100) / 100 : Number(fixo.valor);
    return {
      modo: "fixo",
      valor,
      unitario: null,
      descricao: fixo.tipo_preco === "anual" ? "Valor anual dividido por 12." : "Valor fixo da tabela.",
    };
  }

  return { modo: "consulta", valor: null, unitario: null, descricao: "Preço a consultar com a DoisGe." };
}

/** Quando o modo é por unidade, o formulário precisa do campo de quantidade. */
export function usaQuantidade(precos: PrecoVigente[], produtoId: string | null | undefined) {
  return !!produtoId && precos.some((p) => p.produto_id === produtoId && POR_UNIDADE.includes(p.tipo_preco));
}
