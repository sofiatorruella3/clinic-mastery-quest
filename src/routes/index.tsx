import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Baby,
  Bone,
  Brain,
  Bug,
  Droplet,
  Heart,
  Stethoscope,
  TestTube,
  Utensils,
  Wind,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { APARATOS, DIFICULTADES, type Dificultad } from "@/lib/simulacion-tipos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Simulador Clínico | Casos interactivos para estudiantes de medicina" },
      {
        name: "description",
        content:
          "Resolvé casos clínicos simulados por aparatos y sistemas: anamnesis con el paciente, examen físico, estudios, diagnóstico, tratamiento y devolución basada en guías de práctica clínica.",
      },
      {
        property: "og:title",
        content: "Simulador Clínico | Casos interactivos para estudiantes de medicina",
      },
      {
        property: "og:description",
        content:
          "Entrevistá al paciente, pedí estudios y recibí una devolución basada en guías nacionales e internacionales.",
      },
    ],
  }),
  component: Inicio,
});

const ICONOS: Record<string, typeof Heart> = {
  heart: Heart,
  wind: Wind,
  utensils: Utensils,
  droplet: Droplet,
  brain: Brain,
  activity: Activity,
  "test-tube": TestTube,
  bug: Bug,
  bone: Bone,
  baby: Baby,
};

function Inicio() {
  const navigate = useNavigate();
  const [aparato, setAparato] = useState<string | null>(null);
  const [dificultad, setDificultad] = useState<Dificultad>("moderada");

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <header className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase">
          <Stethoscope className="size-3.5" />
          Simulación clínica interactiva
        </div>
        <h1 className="max-w-2xl text-4xl leading-tight md:text-6xl">
          Practicá el razonamiento clínico como en el consultorio.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          Elegí un aparato o sistema y un nivel de dificultad. Vas a entrevistar al paciente,
          examinarlo, pedir estudios y definir conducta. Al final recibís una devolución
          detallada según guías de práctica clínica nacionales e internacionales.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-1 text-2xl">1. Aparato o sistema</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          El caso se genera nuevo cada vez.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {APARATOS.map((a) => {
            const Icono = ICONOS[a.icono] ?? Stethoscope;
            const activo = aparato === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAparato(a.id)}
                className={cn(
                  "card-clinica group cursor-pointer p-4 text-left transition-all hover:-translate-y-0.5",
                  activo && "border-primary ring-2 ring-primary/25",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary",
                      activo && "bg-primary text-primary-foreground",
                    )}
                  >
                    <Icono className="size-4.5" />
                  </span>
                  <span>
                    <span className="block font-medium">{a.nombre}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {a.descripcion}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-2xl">2. Dificultad</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Define la complejidad del caso y la exigencia de la evaluación.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {DIFICULTADES.map((d) => {
            const activo = dificultad === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDificultad(d.id)}
                className={cn(
                  "card-clinica cursor-pointer p-4 text-left transition-all hover:-translate-y-0.5",
                  activo && "border-primary ring-2 ring-primary/25",
                )}
              >
                <span className="block font-medium">{d.nombre}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {d.detalle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          disabled={!aparato}
          onClick={() =>
            aparato &&
            navigate({ to: "/simulacion", search: { aparato, dificultad } })
          }
        >
          Comenzar simulación
        </Button>
        {!aparato && (
          <span className="text-sm text-muted-foreground">
            Seleccioná un aparato para empezar.
          </span>
        )}
      </div>

      <footer className="mt-16 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        Herramienta educativa. Los casos son ficticios y generados automáticamente: no
        reemplazan el juicio clínico ni constituyen recomendación médica.
      </footer>
    </main>
  );
}
