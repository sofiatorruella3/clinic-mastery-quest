import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  const [aparatos, setAparatos] = useState<string[]>([]);
  const toggle = (id: string) =>
    setAparatos((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const [dificultad, setDificultad] = useState<Dificultad>("moderada");

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <header className="mb-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase">
          <Stethoscope className="size-3.5" />
          Simulación clínica interactiva
        </div>
        <Link to="/historial" className="ml-3 text-sm text-primary underline-offset-4 hover:underline">
          Mis casos anteriores →
        </Link>
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
          Elegí uno, dos o más. Si elegís varios, el caso sale de uno de ellos al azar.
        </p>
        <div className="mb-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAparatos(APARATOS.map((a) => a.id))}>
            Todos (aleatorio)
          </Button>
          {aparatos.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setAparatos([])}>
              Limpiar
            </Button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {APARATOS.map((a) => {
            const Icono = ICONOS[a.icono] ?? Stethoscope;
            const activo = aparatos.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
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
                  <span className="self-center font-medium">{a.nombre}</span>
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
          disabled={aparatos.length === 0}
          onClick={() =>
            aparatos.length > 0 &&
            navigate({ to: "/simulacion", search: { aparato: aparatos.join(","), dificultad } })
          }
        >
          Comenzar simulación
        </Button>
        {aparatos.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Seleccioná al menos un aparato para empezar.
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
