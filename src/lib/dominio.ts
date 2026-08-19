// Vocabulário do domínio: rótulos em português para os enums do banco.

export type PerfilAcesso =
  | "administrador_geral"
  | "governanca_doisge"
  | "gestor_comercial_doisge"
  | "gestor_financeiro_doisge"
  | "gestor_contratos_doisge"
  | "usuario_portfolio"
  | "administrador_portfolio"
  | "usuario_rede"
  | "administrador_rede"
  | "usuario_consulta";

export const PERFIS: Record<PerfilAcesso, string> = {
  administrador_geral: "Administrador geral",
  governanca_doisge: "Governança DOISGE",
  gestor_comercial_doisge: "Gestor comercial",
  gestor_financeiro_doisge: "Gestor financeiro",
  gestor_contratos_doisge: "Gestor de contratos",
  usuario_portfolio: "Usuário do Portfólio",
  administrador_portfolio: "Administrador do Portfólio",
  usuario_rede: "Usuário da Rede",
  administrador_rede: "Administrador da Rede",
  usuario_consulta: "Consulta",
};

export const PERFIS_DOISGE: PerfilAcesso[] = [
  "administrador_geral",
  "governanca_doisge",
  "gestor_comercial_doisge",
  "gestor_financeiro_doisge",
  "gestor_contratos_doisge",
];

export function ehDoisge(perfil?: string | null) {
  return PERFIS_DOISGE.includes(perfil as PerfilAcesso);
}

export function ehPortfolio(perfil?: string | null) {
  return perfil === "usuario_portfolio" || perfil === "administrador_portfolio";
}

export function ehRede(perfil?: string | null) {
  return perfil === "usuario_rede" || perfil === "administrador_rede";
}

// ── Módulo territorial ─────────────────────────────────────────────

export type StatusTerritorio = "livre" | "preferencial" | "exclusiva";

export const ETAPAS_COMERCIAIS: Record<string, string> = {
  lead_identificado: "Lead identificado",
  oportunidade_cadastrada: "Oportunidade cadastrada",
  qualificacao_inicial: "Qualificação inicial",
  diagnostico_da_dor: "Diagnóstico da dor",
  reuniao_realizada: "Reunião realizada",
  solucao_apresentada: "Solução apresentada",
  interesse_validado: "Interesse validado",
  proposta_solicitada: "Proposta solicitada",
  proposta_enviada: "Proposta enviada",
  modelo_contratacao_definido: "Modelo de contratação definido",
  processo_compra_iniciado: "Processo de compra iniciado",
  compra_em_andamento: "Compra em andamento",
  negociacao: "Negociação",
  contrato_em_elaboracao: "Contrato em elaboração",
  fechado_ganho: "Fechado — ganho",
  fechado_perdido: "Fechado — perdido",
  suspenso: "Suspenso",
};

export const STATUS_OPORTUNIDADE: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  ganha: "Ganha",
  perdida: "Perdida",
  suspensa: "Suspensa",
  cancelada: "Cancelada",
};

export const TIPOS_COMPRA_PUBLICA: Record<string, string> = {
  inexigibilidade: "Inexigibilidade",
  dispensa_compra_direta: "Dispensa / compra direta",
  pregao: "Pregão",
  concorrencia: "Concorrência",
  registro_precos: "Registro de preços",
  adesao_ata: "Adesão a ata",
  credenciamento: "Credenciamento",
  chamamento_publico: "Chamamento público",
  termo_cooperacao: "Termo de cooperação",
  contrato_administrativo: "Contrato administrativo",
  outro: "Outro",
};

export const PORTES_MUNICIPIO: Record<string, string> = {
  ate_5_mil: "Até 5 mil",
  de_5_a_10_mil: "5 a 10 mil",
  de_10_a_25_mil: "10 a 25 mil",
  de_25_a_50_mil: "25 a 50 mil",
  de_50_a_100_mil: "50 a 100 mil",
  acima_100_mil: "Acima de 100 mil",
};

export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export const STATUS_EMPRESA: Record<string, string> = {
  prospectada: "Prospectada",
  em_negociacao: "Em negociação",
  contrato_em_elaboracao: "Contrato em elaboração",
  ativa: "Ativa",
  suspensa: "Suspensa",
  encerrada: "Encerrada",
};

export const STATUS_PARCEIRO: Record<string, string> = {
  prospectado: "Prospectado",
  em_qualificacao: "Em qualificação",
  contrato_em_elaboracao: "Contrato em elaboração",
  ativo: "Ativo",
  suspenso: "Suspenso",
  inativo: "Inativo",
  descredenciado: "Descredenciado",
  encerrado: "Encerrado",
};

export const STATUS_PRODUTO: Record<string, string> = {
  rascunho: "Rascunho",
  enviado_para_aprovacao: "Enviado para aprovação",
  aprovado: "Aprovado",
  ativo: "Ativo",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
};

export const TIPOS_PARCEIRO: Record<string, string> = {
  canal_comercial: "Canal comercial",
  revendedor_distribuidor: "Revendedor distribuidor",
  revendedor_parceiro: "Revendedor parceiro",
  parceiro_servico: "Parceiro de serviço",
  consultor: "Consultor",
  representante_regional: "Representante regional",
  parceiro_institucional: "Parceiro institucional",
};

export const TIPOS_PRODUTO: Record<string, string> = {
  saas: "SaaS (software)",
  fisico: "Físico",
  servico: "Serviço",
  hibrido: "Híbrido",
};

export type TomPilula = "neutro" | "sucesso" | "alerta" | "erro" | "info";

export const TOM_STATUS_EMPRESA: Record<string, TomPilula> = {
  prospectada: "neutro",
  em_negociacao: "alerta",
  contrato_em_elaboracao: "info",
  ativa: "sucesso",
  suspensa: "erro",
  encerrada: "neutro",
};

export const TOM_STATUS_PARCEIRO: Record<string, TomPilula> = {
  prospectado: "neutro",
  em_qualificacao: "alerta",
  contrato_em_elaboracao: "info",
  ativo: "sucesso",
  suspenso: "erro",
  inativo: "neutro",
  descredenciado: "erro",
  encerrado: "neutro",
};

export const TOM_STATUS_PRODUTO: Record<string, TomPilula> = {
  rascunho: "neutro",
  enviado_para_aprovacao: "alerta",
  aprovado: "info",
  ativo: "sucesso",
  suspenso: "erro",
  encerrado: "neutro",
};

export const STATUS_AUTORIZACAO: Record<string, string> = {
  solicitada: "Solicitada",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  ativa: "Ativa",
  suspensa: "Suspensa",
  encerrada: "Encerrada",
  cancelada: "Cancelada",
};

export const TOM_STATUS_AUTORIZACAO: Record<string, TomPilula> = {
  solicitada: "neutro",
  em_analise: "alerta",
  aprovada: "info",
  ativa: "sucesso",
  suspensa: "erro",
  encerrada: "neutro",
  cancelada: "erro",
};

export const STATUS_AREA_PREFERENCIAL: Record<string, string> = {
  solicitada: "Solicitada",
  em_analise: "Em análise",
  aprovada: "Aprovada",
  ativa: "Ativa",
  rejeitada: "Rejeitada",
  vencida: "Vencida",
  cancelada: "Cancelada",
  liberada: "Liberada",
  convertida_em_exclusiva: "Virou exclusiva",
};

export const TOM_STATUS_AREA: Record<string, TomPilula> = {
  solicitada: "neutro",
  em_analise: "alerta",
  aprovada: "sucesso",
  ativa: "sucesso",
  rejeitada: "erro",
  vencida: "alerta",
  cancelada: "erro",
  liberada: "neutro",
  convertida_em_exclusiva: "info",
};

export const ORIGENS_OPORTUNIDADE: Record<string, string> = {
  doisge: "DOISGE",
  parceiro: "Parceiro da Rede",
  empresa_portfolio: "Empresa do Portfólio",
  indicacao: "Indicação",
  evento: "Evento",
  relacionamento_institucional: "Relacionamento institucional",
  demanda_espontanea: "Demanda espontânea",
  licitacao: "Licitação",
  outro: "Outro",
};

export const TOM_ETAPA: Record<string, TomPilula> = {
  lead_identificado: "neutro",
  oportunidade_cadastrada: "neutro",
  qualificacao_inicial: "neutro",
  diagnostico_da_dor: "neutro",
  reuniao_realizada: "info",
  solucao_apresentada: "info",
  interesse_validado: "info",
  proposta_solicitada: "alerta",
  proposta_enviada: "alerta",
  modelo_contratacao_definido: "alerta",
  processo_compra_iniciado: "info",
  compra_em_andamento: "info",
  negociacao: "alerta",
  contrato_em_elaboracao: "alerta",
  fechado_ganho: "sucesso",
  fechado_perdido: "erro",
  suspenso: "neutro",
};

export const GRUPOS_FUNIL: { chave: string; rotulo: string; etapas: string[] }[] = [
  {
    chave: "prospeccao",
    rotulo: "Prospecção",
    etapas: ["lead_identificado", "oportunidade_cadastrada", "qualificacao_inicial", "diagnostico_da_dor"],
  },
  {
    chave: "apresentacao",
    rotulo: "Apresentação",
    etapas: ["reuniao_realizada", "solucao_apresentada", "interesse_validado"],
  },
  {
    chave: "proposta",
    rotulo: "Proposta",
    etapas: ["proposta_solicitada", "proposta_enviada", "modelo_contratacao_definido"],
  },
  {
    chave: "licitacao",
    rotulo: "Em licitação",
    etapas: ["processo_compra_iniciado", "compra_em_andamento"],
  },
  {
    chave: "negociacao",
    rotulo: "Negociação",
    etapas: ["negociacao", "contrato_em_elaboracao"],
  },
  { chave: "ganhas", rotulo: "Ganhas", etapas: ["fechado_ganho"] },
  { chave: "perdidas", rotulo: "Perdidas", etapas: ["fechado_perdido", "suspenso"] },
];

export const STATUS_CONTRATO: Record<string, string> = {
  em_elaboracao: "Em elaboração",
  enviado_para_assinatura: "Enviado para assinatura",
  assinado: "Assinado",
  aguardando_implantacao: "Aguardando implantação",
  em_implantacao: "Em implantação",
  ativo: "Ativo",
  em_renovacao: "Em renovação",
  renovado: "Renovado",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
  inadimplente: "Inadimplente",
  substituido: "Substituído",
};
