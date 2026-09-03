import { createClient } from "@/lib/supabase/server";
import { RedeCliente, type ParceiroLinha } from "@/components/rede/rede-cliente";

export const metadata = { title: "Canais" };

export default async function RedePage() {
  const supabase = await createClient();

  const { data: parceiros } = await supabase
    .from("parceiros_rede")
    .select(
      "id, razao_social, nome_fantasia, cnpj, tipo_parceiro, status, cep, logradouro, numero, complemento, bairro, cidade, uf, uf_credenciamento, ufs_credenciamento, limite_cidades_preferenciais, responsavel_principal, email_responsavel, telefone_responsavel, consultor_responsavel, observacoes"
    )
    .order("razao_social");

  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Canais</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revendas e canais credenciados que vendem aos municípios. Clique numa linha para abrir a ficha completa.
        </p>
      </div>

      <RedeCliente parceiros={(parceiros ?? []) as ParceiroLinha[]} />
    </div>
  );
}
