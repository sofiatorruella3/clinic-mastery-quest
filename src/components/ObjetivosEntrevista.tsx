import { CheckCircle2, Circle } from "lucide-react";
import { useMemo } from "react";

import { OBJETIVOS_ENTREVISTA, objetivosCumplidos } from "@/lib/banco/objetivos-entrevista";
import { cn } from "@/lib/utils";

export function ObjetivosEntrevista({ transcripcion }: { transcripcion: string }) {
  const ok = useMemo(() => new Set(objetivosCumplidos(transcripcion)), [transcripcion]);
  const bloques = Array.from(new Set(OBJETIVOS_ENTREVISTA.map((o) => o.bloque)));
  return (
    <details className="card-clinica mt-4 p-4" open>
      <summary className="cursor-pointer text-sm font-medium">
        Objetivos de la entrevista ({ok.size}/{OBJETIVOS_ENTREVISTA.length})
      </summary>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {bloques.map((b) => (
          <div key={b}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{b}</p>
            <ul className="space-y-1">
              {OBJETIVOS_ENTREVISTA.filter((o) => o.bloque === b).map((o) => {
                const hecho = ok.has(o.id);
                const Icono = hecho ? CheckCircle2 : Circle;
                return (
                  <li key={o.id} className={cn("flex gap-1.5 text-xs", hecho ? "text-foreground" : "text-muted-foreground")}>
                    <Icono className={cn("mt-0.5 size-3.5 shrink-0", hecho && "text-primary")} />
                    {o.nombre}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
