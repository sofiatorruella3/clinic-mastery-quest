import { AlertTriangle, Ban, CheckCircle2, CircleSlash, ExternalLink, XCircle } from "lucide-react";

import { REFERENCIAS_GUIAS } from "@/lib/banco/referencias";
import type { Feedback } from "@/lib/simulacion-tipos";
import { cn } from "@/lib/utils";

const SIGLAS_GUIAS: [RegExp, string][] = [
  [/\bFASGO\b/i, "FASGO"],
  [/\bSOGIBA\b/i, "SOGIBA"],
  [/\bSAC\b|Sociedad Argentina de Cardiolog/i, "SAC"],
  [/\bSADI\b|Sociedad Argentina de Infectolog/i, "SADI"],
  [/\bSAR\b|Sociedad Argentina de Reumatolog/i, "SAR"],
  [/\bALAT\b/i, "ALAT"],
  [/\bSAGE\b|Sociedad Argentina de Gastroenterolog/i, "SAGE"],
  [/\bAAMR\b|Asociaci[oó]n Argentina de Medicina Respiratoria/i, "AAMR"],
  [/\b(SAN|SADEN)\b|Sociedad Argentina de Nefrolog/i, "SADEN"],
];

function urlGuia(texto: string): string | undefined {
  for (const [re, sigla] of SIGLAS_GUIAS) {
    if (re.test(texto)) {
      return REFERENCIAS_GUIAS.find((r) => r.sociedad.toUpperCase().startsWith(sigla))?.url;
    }
  }
  return undefined;
}

function Lista({
  titulo,
  items,
  icono: Icono,
  tono,
}: {
  titulo: string;
  items: string[];
  icono: typeof CheckCircle2;
  tono: string;
}) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Icono className={cn("size-4", tono)} />
        {titulo}
      </h4>
      <ul className="space-y-1.5 pl-6 text-sm leading-relaxed text-muted-foreground">
        {items.map((t, i) => (
          <li key={i} className="list-disc">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function colorPuntaje(p: number) {
  if (p >= 75) return "text-success";
  if (p >= 50) return "text-warning";
  return "text-destructive";
}

export function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  return (
    <div className="space-y-6">
      <div className="card-clinica overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-deep px-6 py-5 text-primary-foreground">
          <div>
            <p className="text-xs tracking-wide uppercase opacity-70">Devolución final</p>
            <h2 className="mt-1 text-2xl text-primary-foreground">
              {feedback.diagnosticoCorrecto}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">Puntaje global</p>
            <p className="font-display text-4xl leading-none">
              {Math.round(feedback.puntajeGlobal)}
              <span className="text-lg opacity-60">/100</span>
            </p>
          </div>
        </div>
        <p className="px-6 py-5 text-sm leading-relaxed">{feedback.resumenGlobal}</p>
      </div>

      {feedback.etapas.map((e) => (
        <div key={e.etapa} className="card-clinica p-6">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="text-xl">{e.etapa}</h3>
            <span className={cn("font-display text-2xl", colorPuntaje(e.puntaje))}>
              {Math.round(e.puntaje)}
            </span>
          </div>
          {e.comentario && (
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {e.comentario}
            </p>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <Lista
              titulo="Bien hecho"
              items={e.bienHecho}
              icono={CheckCircle2}
              tono="text-success"
            />
            <Lista titulo="Errores" items={e.errores} icono={XCircle} tono="text-destructive" />
            <Lista
              titulo="Faltó realizar"
              items={e.faltoRealizar}
              icono={AlertTriangle}
              tono="text-warning"
            />
            <Lista titulo="A evitar" items={e.aEvitar} icono={Ban} tono="text-muted-foreground" />
          </div>
        </div>
      ))}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-clinica p-6">
          <h3 className="mb-3 text-lg">Próximos pasos</h3>
          <ul className="space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {feedback.proximosPasos.map((p, i) => (
              <li key={i} className="list-disc">
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="card-clinica p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg">
            <CircleSlash className="size-4 text-primary" />
            Guías utilizadas
          </h3>
          <ul className="space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {feedback.guiasUtilizadas.map((g, i) => {
              const url = urlGuia(g);
              return (
                <li key={i} className="list-disc">
                  {g}
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:opacity-80"
                    >
                      Ver fuente <ExternalLink className="size-3" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
