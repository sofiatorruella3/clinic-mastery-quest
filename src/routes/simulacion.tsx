import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Loader2, Send, Stethoscope } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { AnamnesisChat } from "@/components/AnamnesisChat";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { aCaso, buscarCaso, elegirCaso, evaluar, responderSolicitud } from "@/lib/banco/motor";
import type { CasoBanco } from "@/lib/banco/tipos";
import { guardarRegistro, obtenerRegistro } from "@/lib/historial";
import {
  APARATOS,
  DIFICULTADES,
  ETAPAS,
  type Caso,
  type EtapaId,
  type Feedback,
  type SolicitudEtapa,
} from "@/lib/simulacion-tipos";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  aparato: z.string().default("cardiovascular"),
  dificultad: z.enum(["baja", "moderada", "dificil"]).default("moderada"),
  repetir: z.string().optional(),
});

export const Route = createFileRoute("/simulacion")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Caso clínico en curso | Simulador Clínico" },
      {
        name: "description",
        content:
          "Anamnesis, examen físico, estudios complementarios, diagnóstico, tratamiento y seguimiento en un caso clínico simulado.",
      },
      { property: "og:title", content: "Caso clínico en curso | Simulador Clínico" },
      {
        property: "og:description",
        content: "Resolvé el caso paso a paso y recibí una devolución basada en guías clínicas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Simulacion,
});

function Simulacion() {
  const { aparato, dificultad, repetir } = Route.useSearch();
  const navigate = useNavigate();

  const ids = aparato.split(",").filter(Boolean);
  const [elegido] = useState(() => (repetir ? ids[0] : ids[Math.floor(Math.random() * ids.length)]) ?? "cardiovascular");
  const nombreAparato = APARATOS.find((a) => a.id === elegido)?.nombre ?? elegido;
  const etiquetaAparato =
    ids.length > 1 ? `Aleatorio entre ${ids.length} sistemas` : nombreAparato;
  const nombreDificultad = DIFICULTADES.find((d) => d.id === dificultad)?.nombre ?? dificultad;

  const [etapa, setEtapa] = useState<EtapaId>("anamnesis");
  const [anamnesis, setAnamnesis] = useState("");
  const [examenFisico, setExamenFisico] = useState<SolicitudEtapa[]>([]);
  const [estudios, setEstudios] = useState<SolicitudEtapa[]>([]);
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [seguimiento, setSeguimiento] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [anamnesisIds, setAnamnesisIds] = useState<string[]>([]);
  const [banco, setBanco] = useState<CasoBanco | null>(null);

  const iniciado = useRef(false);
  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    const previo = repetir ? obtenerRegistro(repetir) : undefined;
    setBanco(buscarCaso(previo?.caso.bancoId) ?? elegirCaso(elegido, dificultad) ?? null);
  }, [repetir, elegido, dificultad]);

  const finalizar = () => {
    if (!banco || !caso) return;
    const data = evaluar(banco, { transcripcion: anamnesis, anamnesisIds, examenFisico, estudios, diagnostico, tratamiento, seguimiento });
    setFeedback(data);
    try {
      guardarRegistro({
        aparato: banco.aparato,
        aparatoNombre: APARATOS.find((x) => x.id === banco.aparato)?.nombre ?? nombreAparato,
        dificultad,
        caso,
        respuestas: { anamnesis, examenFisico, estudios, diagnostico, tratamiento, seguimiento },
        feedback: data,
      });
    } catch {
      /* almacenamiento no disponible */
    }
    setEtapa("feedback");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onTranscripcion = useCallback((t: string, ids: string[]) => {
    setAnamnesis(t);
    setAnamnesisIds(ids);
  }, []);

  const caso: Caso | null = useMemo(() => (banco ? aCaso(banco) : null), [banco]);

  if (!banco || !caso) {
    return (
      <main className="mx-auto flex max-w-2xl items-center justify-center gap-2 px-5 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Preparando el caso...
      </main>
    );
  }

  const indiceEtapa = ETAPAS.findIndex((e) => e.id === etapa);

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Nuevo caso
        </Link>
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          {etiquetaAparato} · Dificultad {nombreDificultad}
        </span>
      </div>

      <section className="card-clinica mb-6 p-6">
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Stethoscope className="size-3.5" /> Nuevo paciente
        </div>
        <h1 className="text-3xl md:text-4xl">Un paciente espera ser atendido</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          No tenés datos previos: obtené su filiación, motivo de consulta y antecedentes en la
          anamnesis, y los signos vitales en el examen físico.
        </p>
      </section>

      <nav className="mb-8 flex flex-wrap gap-1.5">
        {ETAPAS.map((e, i) => {
          const habilitada = e.id !== "feedback" || !!feedback;
          return (
            <button
              key={e.id}
              type="button"
              disabled={!habilitada}
              onClick={() => habilitada && setEtapa(e.id)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                etapa === e.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < indiceEtapa
                    ? "border-border bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {i + 1}. {e.nombre}
            </button>
          );
        })}
      </nav>

      {etapa === "anamnesis" && (
        <Seccion
          titulo="Anamnesis"
          ayuda="Entrevistá al paciente como en el consultorio. Conducí la entrevista según el modelo Calgary-Cambridge, con perspectiva de derechos y género. Preguntá una cosa por vez."
        >
          <AnamnesisChat banco={banco} onTranscripcion={onTranscripcion} />
          <Avanzar onClick={() => setEtapa("examen")} texto="Pasar al examen físico" />
        </Seccion>
      )}

      {etapa === "examen" && (
        <Seccion
          titulo="Examen físico"
          ayuda="Indicá qué maniobras realizás (ej.: 'inspección general, auscultación cardíaca y pulmonar, palpación abdominal, edemas de MMII'). Solo vas a obtener los hallazgos de lo que pidas."
        >
          <EtapaSolicitudes
            banco={banco}
            etapaId="examen"
            solicitudes={examenFisico}
            setSolicitudes={setExamenFisico}
            placeholder="Ej.: auscultación cardíaca y pulmonar, TA en ambos brazos, pulsos periféricos"
          />
          <Avanzar onClick={() => setEtapa("estudios")} texto="Pasar a estudios complementarios" />
        </Seccion>
      )}

      {etapa === "estudios" && (
        <Seccion
          titulo="Estudios complementarios"
          ayuda="Solicitá los estudios que consideres necesarios (laboratorio, ECG, imágenes, cultivos). Recordá el criterio de costo-efectividad."
        >
          <EtapaSolicitudes
            banco={banco}
            etapaId="estudios"
            solicitudes={estudios}
            setSolicitudes={setEstudios}
            placeholder="Ej.: laboratorio con hemograma, urea, creatinina, ionograma y troponina; ECG de 12 derivaciones; Rx tórax F y P"
          />
          <Avanzar
            onClick={() => setEtapa("diagnostico")}
            texto="Pasar al diagnóstico presuntivo"
          />
        </Seccion>
      )}

      {etapa === "diagnostico" && (
        <Seccion
          titulo="Diagnóstico presuntivo"
          ayuda="Escribí tu diagnóstico presuntivo con los datos clave que lo sostienen. Los diferenciales solo mencionalos."
        >
          <Textarea
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            rows={10}
            placeholder="Diagnóstico presuntivo y fundamentación. Diferenciales: ..."
            className="min-h-48"
          />
          <Avanzar onClick={() => setEtapa("tratamiento")} texto="Pasar al tratamiento" />
        </Seccion>
      )}

      {etapa === "tratamiento" && (
        <Seccion
          titulo="Tratamiento"
          ayuda="Un pantallazo general de la conducta: medidas generales, grupos de fármacos, internación o derivación, interconsultas. No hace falta detallar dosis."
        >
          <Textarea
            value={tratamiento}
            onChange={(e) => setTratamiento(e.target.value)}
            rows={10}
            placeholder="Conducta general: medidas, grupos de fármacos, internación o ambulatorio..."
            className="min-h-48"
          />
          <Avanzar onClick={() => setEtapa("seguimiento")} texto="Pasar al seguimiento" />
        </Seccion>
      )}

      {etapa === "seguimiento" && (
        <Seccion
          titulo="Seguimiento"
          ayuda="Plan de control: plazos, parámetros a monitorear, pautas de alarma, prevención y educación al paciente."
        >
          <Textarea
            value={seguimiento}
            onChange={(e) => setSeguimiento(e.target.value)}
            rows={10}
            placeholder="Controles, pautas de alarma, prevención secundaria, educación al paciente..."
            className="min-h-48"
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={finalizar}
            >
              Finalizar y recibir devolución <ArrowRight className="size-4" />
            </Button>
          </div>
        </Seccion>
      )}

      {etapa === "feedback" && feedback && (
        <>
          <FeedbackPanel feedback={feedback} />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate({ to: "/" })}>Resolver otro caso</Button>
            <Button variant="outline" onClick={() => navigate({ to: "/historial" })}>
              Ver mis casos anteriores
            </Button>
          </div>
        </>
      )}
    </main>
  );
}

function Seccion({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-2xl">{titulo}</h2>
      <p className="mt-1 mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{ayuda}</p>
      {children}
    </section>
  );
}

function Avanzar({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <div className="mt-5">
      <Button onClick={onClick} size="lg">
        {texto} <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

function EtapaSolicitudes({
  banco,
  etapaId,
  solicitudes,
  setSolicitudes,
  placeholder,
}: {
  banco: CasoBanco;
  etapaId: "examen" | "estudios";
  solicitudes: SolicitudEtapa[];
  setSolicitudes: React.Dispatch<React.SetStateAction<SolicitudEtapa[]>>;
  placeholder: string;
}) {
  const [pedido, setPedido] = useState("");
  const mutation = {
    isPending: false,
    isError: false,
    mutate: (texto: string) =>
      setSolicitudes((prev) => [...prev, { pedido: texto, hallazgo: responderSolicitud(banco, etapaId, texto) }]),
  };

  return (
    <div className="space-y-4">
      {solicitudes.map((s, i) => (
        <div key={i} className="card-clinica overflow-hidden">
          <div className="border-b border-border bg-secondary/40 px-4 py-2.5 text-sm font-medium">
            {s.pedido}
          </div>
          <div className="px-4 py-3 text-sm leading-relaxed">
            <MessageResponse>{s.hallazgo}</MessageResponse>
          </div>
        </div>
      ))}

      {mutation.isPending && (
        <div className="card-clinica flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Obteniendo resultados...
        </div>
      )}

      <div className="card-clinica p-3">
        <Textarea
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="resize-none border-0 shadow-none focus-visible:ring-0"
        />
        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            disabled={!pedido.trim() || mutation.isPending}
            onClick={() => {
              const texto = pedido.trim();
              if (!texto) return;
              setPedido("");
              mutation.mutate(texto);
            }}
          >
            <Send className="size-3.5" /> Solicitar
          </Button>
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive">No se pudo obtener el resultado. Probá de nuevo.</p>
      )}
    </div>
  );
}
