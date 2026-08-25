import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FichaEntidade } from "@/components/cadastros/ficha-entidade";
import type { ParceiroLinha } from "@/components/rede/rede-cliente";
import type { SocioLinha, CertidaoLinha } from "@/components/cadastros/socios-certidoes";
import { Pilula } from "@/components/selo-territorio";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { STATUS_PARCEIRO, TOM_STATUS_PARCEIRO, TIPOS_PARCEIRO } from "@/lib/dominio";

export const metadata = { title: "Canal" };

export default async function CanalDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: parceiro } = await supabase
    .from("parceiros_rede")
    .select("*")
    .eq("id", id)
    .single();

  if (!parceiro) notFound();

  const [{ data: socios }, { data: certidoes }] = await Promise.all([
    supabase
      .from("socios")
      .select("id, nome, cpf, percentual, email, telefone")
      .eq("entidade", "parceiro_rede")
      .eq("entidade_id", id)
      .order("percentual", { ascending: false }),
    supabase
      .from("certidoes")
      .select("id, nome, data_validade, arquivo_url")
      .eq("entidade", "parceiro_rede")
      .eq("entidade_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon-sm" nativeButton={false} render={<Link href="/rede" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {parceiro.nome_fantasia || parceiro.razao_social}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Canal · {TIPOS_PARCEIRO[parceiro.tipo_parceiro] ?? parceiro.tipo_parceiro}
            {parceiro.uf_credenciamento && ` · credenciado em ${parceiro.uf_credenciamento}`}
          </p>
        </div>
        <Pilula tom={TOM_STATUS_PARCEIRO[parceiro.status] ?? "neutro"}>
          {STATUS_PARCEIRO[parceiro.status] ?? parceiro.status}
        </Pilula>
      </div>

      <FichaEntidade
        entidade="parceiro_rede"
        parceiro={parceiro as unknown as ParceiroLinha}
        socios={(socios ?? []) as SocioLinha[]}
        certidoes={(certidoes ?? []) as CertidaoLinha[]}
      />
    </div>
  );
}
