import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import { formatarData } from "@/lib/utils";

export type PassoAgenda = {
  id: string;
  codigo: number;
  nome_oportunidade: string;
  proximo_passo: string;
  data_proximo_passo: string | null;
};

function corDoPrazo(data: string | null) {
  if (!data) return "text-muted-foreground";
  const hoje = new Date().toISOString().slice(0, 10);
  if (data < hoje) return "text-erro font-medium";
  if (data === hoje) return "text-alerta font-medium";
  return "text-muted-foreground";
}

function rotuloDoPrazo(data: string | null) {
  if (!data) return "sem data";
  const hoje = new Date().toISOString().slice(0, 10);
  if (data < hoje) return `atrasado · ${formatarData(data)}`;
  if (data === hoje) return "hoje";
  return formatarData(data);
}

export function AgendaProximosPassos({ passos }: { passos: PassoAgenda[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4 text-marca-600" />
          Próximos passos
        </CardTitle>
        <CardDescription>
          O que precisa acontecer nas suas oportunidades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {passos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nada agendado. Defina o "próximo passo" nas oportunidades para
            nunca deixar um negócio esfriar.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {passos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/oportunidades/${p.id}`}
                  className="group flex items-start justify-between gap-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium group-hover:text-marca-700">
                      {p.proximo_passo}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      #{p.codigo} · {p.nome_oportunidade}
                    </span>
                  </span>
                  <span className={`shrink-0 text-xs ${corDoPrazo(p.data_proximo_passo)}`}>
                    {rotuloDoPrazo(p.data_proximo_passo)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
