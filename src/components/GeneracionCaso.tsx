import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type CasoParcial = {
  titulo?: string;
  ambito?: string;
  motivoConsulta?: string;
  paciente?: {
    nombre?: string;
    edad?: string;
    sexo?: string;
    ocupacion?: string;
    apariencia?: string;
  };
  signosVitales?: string;
  guionOculto?: Record<string, string | undefined>;
};

const PASOS_PUBLICOS: { clave: keyof CasoParcial; etiqueta: string }[] = [
  { clave: "titulo", etiqueta: "Definiendo el caso" },
  { clave: "ambito", etiqueta: "Eligiendo el ámbito de atención" },
  { clave: "motivoConsulta", etiqueta: "Redactando el motivo de consulta" },
  { clave: "paciente", etiqueta: "Creando al paciente" },
  { clave: "signosVitales", etiqueta: "Tomando signos vitales" },
];

const PASOS_OCULTOS: { clave: string; etiqueta: string }[] = [
  { clave: "historiaCompleta", etiqueta: "Escribiendo la historia clínica real" },
  { clave: "hallazgosExamenFisico", etiqueta: "Preparando hallazgos del examen físico" },
  { clave: "resultadosEstudios", etiqueta: "Generando laboratorio, ECG e imágenes" },
  { clave: "diferenciales", etiqueta: "Armando diagnósticos diferenciales" },
  { clave: "conductaEsperada", etiqueta: "Definiendo la conducta esperada" },
  { clave: "personalidad", etiqueta: "Dando personalidad al paciente" },
];

function Paso({ listo, etiqueta }: { listo: boolean; etiqueta: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          listo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
        )}
      >
        {listo ? (
          <Check className="size-3" />
        ) : (
          <Loader2 className="size-3 animate-spin opacity-50" />
        )}
      </span>
      <span className={listo ? "text-foreground" : "text-muted-foreground"}>{etiqueta}</span>
    </li>
  );
}

export function GeneracionCaso({
  parcial,
  detalle,
}: {
  parcial: CasoParcial | null;
  detalle: string;
}) {
  const p = parcial ?? {};
  const oculto = p.guionOculto ?? {};

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-20">
      <div className="mb-8 text-center">
        <Loader2 className="mx-auto mb-4 size-6 animate-spin text-primary" />
        <h1 className="text-3xl md:text-4xl">Preparando el caso clínico</h1>
        <p className="mt-2 text-sm text-muted-foreground">{detalle}</p>
      </div>

      <section className="card-clinica mb-5 p-6">
        <h2 className="mb-4 text-xs tracking-wide text-muted-foreground uppercase">
          Datos de la consulta
        </h2>
        <ul className="space-y-2.5">
          {PASOS_PUBLICOS.map((s) => (
            <Paso key={s.clave} listo={Boolean(p[s.clave])} etiqueta={s.etiqueta} />
          ))}
        </ul>

        {(p.titulo || p.paciente?.nombre || p.signosVitales) && (
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm leading-relaxed">
            {p.titulo && <p className="font-medium">{p.titulo}</p>}
            {p.ambito && <p className="text-xs text-muted-foreground">{p.ambito}</p>}
            {p.paciente?.nombre && (
              <p>
                {p.paciente.nombre}
                {p.paciente.edad ? `, ${p.paciente.edad}` : ""}
                {p.paciente.sexo ? `, ${p.paciente.sexo}` : ""}
                {p.paciente.ocupacion ? `. ${p.paciente.ocupacion}` : ""}
              </p>
            )}
            {p.motivoConsulta && (
              <p>
                <span className="text-muted-foreground">Motivo de consulta: </span>
                {p.motivoConsulta}
              </p>
            )}
            {p.signosVitales && (
              <p>
                <span className="text-muted-foreground">Signos vitales: </span>
                {p.signosVitales}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="card-clinica p-6">
        <h2 className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
          Historia oculta del paciente
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Se genera en reserva para no revelarte el diagnóstico.
        </p>
        <ul className="space-y-2.5">
          {PASOS_OCULTOS.map((s) => (
            <Paso key={s.clave} listo={Boolean(oculto[s.clave])} etiqueta={s.etiqueta} />
          ))}
        </ul>

        {oculto["historiaCompleta"] && (
          <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground blur-[3px] select-none">
            {String(oculto["historiaCompleta"]).slice(-280)}
          </p>
        )}
      </section>
    </main>
  );
}
