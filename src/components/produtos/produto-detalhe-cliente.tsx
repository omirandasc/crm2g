"use client";

import * as React from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pilula } from "@/components/selo-territorio";
import { FormAcao } from "@/components/cadastros/form-acao";
import { PainelFormulario } from "@/components/cadastros/painel-formulario";
import { CampoArquivo, BotaoBaixar } from "@/components/cadastros/campo-arquivo";
import {
  CampoTexto,
  CampoTextoLongo,
  CampoSelecao,
} from "@/components/cadastros/campos";
import {
  FormProduto,
  type ProdutoLinha,
  type EmpresaOpcao,
} from "@/components/produtos/produtos-cliente";
import { salvarProduto } from "@/lib/acoes/cadastros";
import {
  salvarPreco,
  removerPreco,
  salvarMaterial,
  removerMaterial,
} from "@/lib/acoes/produto-detalhe";
import { formatarMoeda, formatarNumero } from "@/lib/utils";

const TIPOS_PRECO: Record<string, string> = {
  mensalidade: "Mensalidade",
  anual: "Anual",
  por_usuario: "Por usuário",
  por_habitante: "Por habitante",
  por_kit: "Por kit",
  por_servico: "Por serviço",
  por_implantacao: "Por implantação",
  valor_unico: "Valor único",
  tabela_faixa: "Tabela por faixa populacional",
  a_consultar: "A consultar",
};

const TIPOS_MATERIAL: Record<string, string> = {
  apresentacao_comercial: "Apresentação comercial",
  proposta_modelo: "Modelo de proposta",
  contrato_modelo: "Modelo de contrato",
  termo_referencia: "Termo de referência",
  estudo_tecnico_preliminar: "Estudo técnico preliminar",
  justificativa_contratacao: "Justificativa de contratação",
  atestado_tecnico: "Atestado técnico",
  carta_exclusividade: "Carta de exclusividade",
  tabela_precos: "Tabela de preços",
  perguntas_frequentes: "Perguntas frequentes",
  video: "Vídeo",
  manual: "Manual",
  documento_tecnico: "Documento técnico",
  documento_juridico: "Documento jurídico",
  material_implantacao: "Material de implantação",
  material_suporte: "Material de suporte",
};

const VISIBILIDADES_MATERIAL: Record<string, string> = {
  interno_doisge: "Interno DOISGE",
  portfolio: "Portfólio",
  rede_autorizada: "Rede autorizada",
  publico: "Público",
  restrito: "Restrito",
};

export type PrecoLinha = {
  id: string;
  tipo_preco: string;
  valor: number | null;
  faixa_inicial: number | null;
  faixa_final: number | null;
  preco_minimo_permitido: number | null;
  desconto_maximo: number | null;
  data_inicio_vigencia: string | null;
  data_fim_vigencia: string | null;
  observacoes: string | null;
};

export type MaterialLinha = {
  id: string;
  nome_material: string;
  tipo_material: string;
  nivel_visibilidade: string;
  descricao: string | null;
  arquivo_url: string | null;
};

export function ProdutoDetalheCliente({
  produto,
  precos,
  materiais,
  empresas,
}: {
  produto: ProdutoLinha;
  precos: PrecoLinha[];
  materiais: MaterialLinha[];
  empresas: EmpresaOpcao[];
}) {
  const [precoAberto, setPrecoAberto] = React.useState(false);
  const [editandoPreco, setEditandoPreco] = React.useState<PrecoLinha | null>(null);
  const [materialAberto, setMaterialAberto] = React.useState(false);
  const [removendo, startRemocao] = React.useTransition();

  const FormPreco = ({ preco }: { preco?: PrecoLinha | null }) => (
    <>
      <input type="hidden" name="produto_id" value={produto.id} />
      <CampoSelecao rotulo="Tipo de preço" nome="tipo_preco" obrigatorio opcoes={TIPOS_PRECO} valorInicial={preco?.tipo_preco ?? "mensalidade"} />
      <CampoTexto rotulo="Valor (R$)" nome="valor" tipo="number" valorInicial={preco?.valor?.toString()} placeholder="0,00" />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Faixa: população de" nome="faixa_inicial" tipo="number" valorInicial={preco?.faixa_inicial?.toString()} placeholder="Ex.: 0" />
        <CampoTexto rotulo="até" nome="faixa_final" tipo="number" valorInicial={preco?.faixa_final?.toString()} placeholder="Ex.: 5000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Preço mínimo permitido (R$)" nome="preco_minimo_permitido" tipo="number" valorInicial={preco?.preco_minimo_permitido?.toString()} />
        <CampoTexto rotulo="Desconto máximo (%)" nome="desconto_maximo" tipo="number" valorInicial={preco?.desconto_maximo?.toString()} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Início da vigência" nome="data_inicio_vigencia" tipo="date" valorInicial={preco?.data_inicio_vigencia ?? undefined} />
        <CampoTexto rotulo="Fim da vigência" nome="data_fim_vigencia" tipo="date" valorInicial={preco?.data_fim_vigencia ?? undefined} />
      </div>
      <CampoTextoLongo rotulo="Observações" nome="observacoes" valorInicial={preco?.observacoes} />
    </>
  );

  return (
    <Tabs defaultValue="dados">
      <TabsList>
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="precos">
          Preços
          {precos.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{precos.length}</span>}
        </TabsTrigger>
        <TabsTrigger value="materiais">
          Materiais
          {materiais.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{materiais.length}</span>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dados" className="mt-4">
        <Card className="max-w-2xl">
          <CardContent>
            <FormAcao acao={salvarProduto}>
              <input type="hidden" name="id" value={produto.id} />
              <div className="space-y-4">
                <FormProduto produto={produto} empresas={empresas} />
              </div>
            </FormAcao>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="precos" className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Para tabela por faixa populacional (como a do Sentinela), crie um preço
            por faixa com "população de/até".
          </p>
          <Button onClick={() => setPrecoAberto(true)}>
            <Plus className="size-4" />
            Novo preço
          </Button>
        </div>

        {precos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhum preço cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-cartao">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Faixa populacional</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Mínimo</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Desc. máx.</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {precos.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setEditandoPreco(p)}>
                    <TableCell className="font-medium">{TIPOS_PRECO[p.tipo_preco] ?? p.tipo_preco}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.faixa_inicial != null || p.faixa_final != null
                        ? `${formatarNumero(p.faixa_inicial ?? 0)} – ${p.faixa_final != null ? formatarNumero(p.faixa_final) : "∞"} hab.`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatarMoeda(p.valor)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right font-mono tabular-nums">
                      {formatarMoeda(p.preco_minimo_permitido)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      {p.desconto_maximo != null ? `${p.desconto_maximo}%` : "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        title="Remover preço"
                        disabled={removendo}
                        onClick={(e) => {
                          e.stopPropagation();
                          startRemocao(async () => {
                            const r = await removerPreco(p.id, produto.id);
                            if (r.ok) toast.success("Preço removido.");
                            else toast.error(r.erro ?? "Não foi possível remover.");
                          });
                        }}
                        className="text-muted-foreground hover:text-erro"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="materiais" className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Apresentações, modelos e documentos do produto — a visibilidade controla
            quem pode ver cada arquivo.
          </p>
          <Button onClick={() => setMaterialAberto(true)}>
            <Plus className="size-4" />
            Novo material
          </Button>
        </div>

        {materiais.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhum material enviado.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {materiais.map((m) => (
              <Card key={m.id}>
                <CardContent className="space-y-2">
                  <p className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="size-4 shrink-0 text-marca-600" />
                      {m.nome_material}
                    </span>
                    <button
                      type="button"
                      title="Remover material"
                      disabled={removendo}
                      onClick={() =>
                        startRemocao(async () => {
                          const r = await removerMaterial(m.id, produto.id);
                          if (r.ok) toast.success("Material removido.");
                          else toast.error(r.erro ?? "Não foi possível remover.");
                        })
                      }
                      className="text-muted-foreground hover:text-erro"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {TIPOS_MATERIAL[m.tipo_material] ?? m.tipo_material}
                  </p>
                  <div className="flex items-center justify-between">
                    <Pilula tom="info">
                      {VISIBILIDADES_MATERIAL[m.nivel_visibilidade] ?? m.nivel_visibilidade}
                    </Pilula>
                    {m.arquivo_url && <BotaoBaixar caminho={m.arquivo_url} />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <PainelFormulario
        aberto={precoAberto}
        aoFechar={() => setPrecoAberto(false)}
        titulo="Novo preço"
        acao={salvarPreco}
      >
        <FormPreco />
      </PainelFormulario>

      <PainelFormulario
        key={editandoPreco?.id ?? "nenhum"}
        aberto={!!editandoPreco}
        aoFechar={() => setEditandoPreco(null)}
        titulo="Editar preço"
        acao={salvarPreco}
        idRegistro={editandoPreco?.id}
      >
        <FormPreco preco={editandoPreco} />
      </PainelFormulario>

      <PainelFormulario
        aberto={materialAberto}
        aoFechar={() => setMaterialAberto(false)}
        titulo="Novo material"
        descricao="O arquivo fica no cofre de materiais; a visibilidade controla quem acessa."
        acao={salvarMaterial}
      >
        <input type="hidden" name="produto_id" value={produto.id} />
        <CampoTexto rotulo="Nome do material" nome="nome_material" obrigatorio placeholder="Ex.: Apresentação institucional" />
        <div className="grid grid-cols-2 gap-3">
          <CampoSelecao rotulo="Tipo" nome="tipo_material" obrigatorio opcoes={TIPOS_MATERIAL} valorInicial="apresentacao_comercial" />
          <CampoSelecao rotulo="Visibilidade" nome="nivel_visibilidade" obrigatorio opcoes={VISIBILIDADES_MATERIAL} valorInicial="interno_doisge" />
        </div>
        <CampoTextoLongo rotulo="Descrição" nome="descricao" />
        <CampoArquivo nome="arquivo_url" balde="materiais" pasta={produto.id} obrigatorio />
      </PainelFormulario>
    </Tabs>
  );
}
