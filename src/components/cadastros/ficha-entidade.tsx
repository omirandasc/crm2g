"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FormAcao } from "@/components/cadastros/form-acao";
import {
  BlocoSocios,
  BlocoCertidoes,
  type SocioLinha,
  type CertidaoLinha,
} from "@/components/cadastros/socios-certidoes";
import { FormEmpresa, type EmpresaLinha } from "@/components/portfolio/portfolio-cliente";
import { FormParceiro, type ParceiroLinha } from "@/components/rede/rede-cliente";
import {
  TerritorioCanal,
  type AreaLinha,
  type ExclusivaLinha,
} from "@/components/rede/territorio-canal";
import type { Opcao } from "@/components/autorizacoes/autorizacoes-cliente";
import { salvarEmpresa, salvarParceiro } from "@/lib/acoes/cadastros";

export type TerritorioFicha = {
  limite: number;
  ufs: string[];
  produtos: Opcao[];
  preferenciais: AreaLinha[];
  exclusivas: ExclusivaLinha[];
};

export function FichaEntidade({
  entidade,
  empresa,
  parceiro,
  socios,
  certidoes,
  territorio,
}: {
  entidade: "empresa_portfolio" | "parceiro_rede";
  empresa?: EmpresaLinha | null;
  parceiro?: ParceiroLinha | null;
  socios: SocioLinha[];
  certidoes: CertidaoLinha[];
  territorio?: TerritorioFicha | null;
}) {
  const registroId = (empresa?.id ?? parceiro?.id)!;

  return (
    <Tabs defaultValue="dados">
      <TabsList>
        <TabsTrigger value="dados">Dados</TabsTrigger>
        <TabsTrigger value="socios">
          Sócios
          {socios.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{socios.length}</span>}
        </TabsTrigger>
        <TabsTrigger value="certidoes">
          Certidões
          {certidoes.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{certidoes.length}</span>}
        </TabsTrigger>
        {territorio && (
          <TabsTrigger value="territorio">
            Território
            {territorio.preferenciais.length > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                {territorio.preferenciais.length}
              </span>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="dados" className="mt-4">
        <Card className="max-w-2xl">
          <CardContent>
            {entidade === "empresa_portfolio" ? (
              <FormAcao acao={salvarEmpresa}>
                <input type="hidden" name="id" value={registroId} />
                <div className="space-y-4">
                  <FormEmpresa empresa={empresa} />
                </div>
              </FormAcao>
            ) : (
              <FormAcao acao={salvarParceiro}>
                <input type="hidden" name="id" value={registroId} />
                <div className="space-y-4">
                  <FormParceiro parceiro={parceiro} />
                </div>
              </FormAcao>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="socios" className="mt-4">
        <BlocoSocios entidade={entidade} entidadeId={registroId} socios={socios} />
      </TabsContent>

      <TabsContent value="certidoes" className="mt-4">
        <BlocoCertidoes entidade={entidade} entidadeId={registroId} certidoes={certidoes} />
      </TabsContent>

      {territorio && (
        <TabsContent value="territorio" className="mt-4">
          <TerritorioCanal
            parceiroId={registroId}
            limite={territorio.limite}
            ufs={territorio.ufs}
            produtos={territorio.produtos}
            preferenciais={territorio.preferenciais}
            exclusivas={territorio.exclusivas}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
