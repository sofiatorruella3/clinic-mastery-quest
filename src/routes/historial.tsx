import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { FeedbackPanel } from "@/components/FeedbackPanel";
import { Button } from "@/components/ui/button";
import { borrarRegistro, leerHistorial, type RegistroCaso } from "@/lib/historial";
import { DIFICULTADES } from "@/lib/simulacion-tipos";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Mis casos anteriores | Simulador Clínico" },
      {
        name: "description",
        content: "Revisá tus casos clínicos simulados, sus devoluciones y las guías citadas, y repetilos.",
      },
      { property: "og:title", content: "Mis casos anteriores | Simulador Clínico" },
      {
        property: "og:description",
        content: "Historial de casos simulados con devolución y guías de práctica clínica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Historial,
});

function Historial() {
  const [lista, setLista] = useState<RegistroCaso[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => setLista(leerHistorial()), []);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Inicio
      </Link>
      <h1 className="text-4xl md:text-5xl">Mis casos anteriores</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground">
        Se guardan en este dispositivo. Podés revisar la devolución y repetir el mismo paciente
        desde cero.
      </p>

      {lista.length === 0 && (
        <div className="card-clinica p-8 text-center text-sm text-muted-foreground">
          Todavía no completaste ningún caso.{" "}
          <Link to="/" className="text-primary underline">
            Empezá uno
          </Link>
          .
        </div>
      )}

      <ul className="space-y-3">
        {lista.map((r) => {
          const esAbierto = abierto === r.id;
          const dif = DIFICULTADES.find((d) => d.id === r.dificultad)?.nombre ?? r.dificultad;
          return (
            <li key={r.id} className="card-clinica p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.fecha).toLocaleString("es-AR")} · {r.aparatoNombre} · {dif}
                  </p>
                  <h2 className="mt-1 text-xl">{r.caso.guionOculto.diagnosticoFinal}</h2>
                  <p className="text-sm text-muted-foreground">
                    Puntaje global: <strong>{r.feedback.puntajeGlobal}</strong>/100
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAbierto(esAbierto ? null : r.id)}>
                    <ChevronDown className={esAbierto ? "size-4 rotate-180" : "size-4"} />
                    {esAbierto ? "Ocultar" : "Ver devolución"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate({
                        to: "/simulacion",
                        search: { aparato: r.aparato, dificultad: r.dificultad, repetir: r.id },
                      })
                    }
                  >
                    <RotateCcw className="size-4" /> Repetir
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Borrar caso"
                    onClick={() => {
                      borrarRegistro(r.id);
                      setLista(leerHistorial());
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {esAbierto && (
                <div className="mt-6 border-t border-border pt-6">
                  <FeedbackPanel feedback={r.feedback} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
