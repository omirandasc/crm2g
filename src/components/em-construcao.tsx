import { Hammer } from "lucide-react";

export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
      <p className="mt-1 text-sm text-tinta-suave">{descricao}</p>

      <div className="mt-8 rounded-lg border border-dashed border-linha-forte bg-cartao p-10 text-center">
        <Hammer size={28} className="mx-auto text-marca-600" strokeWidth={1.6} />
        <p className="mt-3 font-medium">Este módulo está em construção</p>
        <p className="mt-1 text-sm text-tinta-suave">
          Ele faz parte do plano de entregas e será liberado nas próximas versões.
        </p>
      </div>
    </div>
  );
}
