import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FeedbackPanel } from "@/components/FeedbackPanel";
import { Button } from "@/components/ui/button";
import {
  borrarRegistro,
  exportarHistorialJson,
  importarHistorialJson,
  leerHistorial,
  limpiarHistorial,
  type RegistroCaso,
} from "@/lib/historial";
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
  const [aviso, setAviso] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => setLista(leerHistorial()), []);

  const exportar = () => {
    const blob = new Blob([exportarHistorialJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulador-clinico-historial-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const texto = await file.text();
      const { agregados } = importarHistorialJson(texto);
      setLista(leerHistorial());
      setAviso(
        agregados > 0
          ? `Se importaron ${agregados} caso(s) al historial.`
          : "Todos los casos del archivo ya estaban en tu historial.",
      );
    } catch {
      setAviso("No se pudo importar el archivo: verificá que sea un JSON exportado por el simulador.");
    }
  };

  const borrarTodo = () => {
    if (!window.confirm("¿Seguro que querés borrar todos los casos guardados en este dispositivo?")) {
      return;
    }
    limpiarHistorial();
    setLista([]);
    setAbierto(null);
    setAviso("Se borró el historial.");
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Inicio
      </Link>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl">Mis casos anteriores</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Se guardan en este dispositivo. Podés revisar la devolución, repetir el mismo paciente o
            exportar tu historial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={importar}
          />
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" /> Importar
          </Button>
          {lista.length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={exportar}>
                <Download className="size-4" /> Exportar
              </Button>
              <Button size="sm" variant="ghost" onClick={borrarTodo}>
                <Trash2 className="size-4" /> Borrar todo
              </Button>
            </>
          )}
        </div>
      </div>

      {aviso && (
        <div className="mb-6 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {aviso}
        </div>
      )}

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
