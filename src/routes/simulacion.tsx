import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Loader2, Send, Stethoscope } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { AnamnesisChat } from "@/components/AnamnesisChat";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { GeneracionCaso } from "@/components/GeneracionCaso";
import { MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generarFeedback, responderEtapa } from "@/lib/simulacion.functions";
import { useCasoStream } from "@/lib/useCasoStream";
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
    ],
  }),
  component: Simulacion,
});

function Simulacion() {
  const { aparato, dificultad } = Route.useSearch();
  const navigate = useNavigate();

  const nombreAparato = APARATOS.find((a) => a.id === aparato)?.nombre ?? aparato;
  const nombreDificultad = DIFICULTADES.find((d) => d.id === dificultad)?.nombre ?? dificultad;

  const [etapa, setEtapa] = useState<EtapaId>("anamnesis");
  const [anamnesis, setAnamnesis] = useState("");
  const [examenFisico, setExamenFisico] = useState<SolicitudEtapa[]>([]);
  const [estudios, setEstudios] = useState<SolicitudEtapa[]>([]);
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [seguimiento, setSeguimiento] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const pedirEtapa = useServerFn(responderEtapa);
  const pedirFeedback = useServerFn(generarFeedback);

  const { parcial, caso, error: errorCaso, generando, generar } = useCasoStream();

  const iniciado = useRef(false);
  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void generar(nombreAparato, dificultad);
  }, [generar, nombreAparato, dificultad]);

  const feedbackMutation = useMutation({
    mutationFn: () =>
      pedirFeedback({
        data: {
          caso: caso!,
          anamnesis,
          examenFisico,
          estudios,
          diagnostico,
          tratamiento,
          seguimiento,
        },
      }),
    onSuccess: (data) => {
      setFeedback(data as Feedback);
      setEtapa("feedback");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  });

  const onTranscripcion = useCallback((t: string) => setAnamnesis(t), []);

  if (!caso && !errorCaso) {
    return (
      <GeneracionCaso
        parcial={parcial}
        detalle={`${nombreAparato} · dificultad ${nombreDificultad.toLowerCase()}`}
      />
    );
  }

  if (!caso) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-24 text-center">
        <h1 className="text-3xl">No se pudo generar el caso</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {errorCaso ?? "Ocurrió un problema al crear la simulación."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button disabled={generando} onClick={() => void generar(nombreAparato, dificultad)}>
            Reintentar
          </Button>
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            Volver al inicio
          </Button>
        </div>
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
          {nombreAparato} · Dificultad {nombreDificultad}
        </span>
      </div>

      <section className="card-clinica mb-6 p-6">
        <div className="mb-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Stethoscope className="mt-0.5 size-3.5 shrink-0" /> <span>{caso.ambito}</span>
        </div>
        <h1 className="text-3xl md:text-4xl">{caso.titulo}</h1>
        <p className="mt-3 text-sm leading-relaxed">
          <strong className="font-medium">{caso.paciente.nombre}</strong>, {caso.paciente.edad},{" "}
          {caso.paciente.sexo}. {caso.paciente.ocupacion}. {caso.paciente.apariencia}
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          <span className="text-muted-foreground">Motivo de consulta: </span>
          {caso.motivoConsulta}
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          <span className="text-muted-foreground">Signos vitales al ingreso: </span>
          {caso.signosVitales}
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
          ayuda="Entrevistá al paciente como en el consultorio. Preguntá una cosa por vez: solo responde lo que le preguntes."
        >
          <AnamnesisChat caso={caso} onTranscripcion={onTranscripcion} />
          <Avanzar onClick={() => setEtapa("examen")} texto="Pasar al examen físico" />
        </Seccion>
      )}

      {etapa === "examen" && (
        <Seccion
          titulo="Examen físico"
          ayuda="Indicá qué maniobras realizás (ej.: 'inspección general, auscultación cardíaca y pulmonar, palpación abdominal, edemas de MMII'). Solo vas a obtener los hallazgos de lo que pidas."
        >
          <EtapaSolicitudes
            caso={caso}
            etapaId="examen"
            solicitudes={examenFisico}
            setSolicitudes={setExamenFisico}
            pedirEtapa={pedirEtapa}
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
            caso={caso}
            etapaId="estudios"
            solicitudes={estudios}
            setSolicitudes={setEstudios}
            pedirEtapa={pedirEtapa}
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
          ayuda="Escribí tu diagnóstico presuntivo, los principales diferenciales y los datos que los sostienen o descartan."
        >
          <Textarea
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            rows={10}
            placeholder="Diagnóstico presuntivo, diferenciales y fundamentación..."
            className="min-h-48"
          />
          <Avanzar onClick={() => setEtapa("tratamiento")} texto="Pasar al tratamiento" />
        </Seccion>
      )}

      {etapa === "tratamiento" && (
        <Seccion
          titulo="Tratamiento"
          ayuda="Definí conducta inicial: medidas generales, fármacos con dosis y vía, criterios de internación o derivación, interconsultas."
        >
          <Textarea
            value={tratamiento}
            onChange={(e) => setTratamiento(e.target.value)}
            rows={10}
            placeholder="Conducta inicial, fármacos con dosis y vía, criterios de internación..."
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
              disabled={feedbackMutation.isPending}
              onClick={() => feedbackMutation.mutate()}
            >
              {feedbackMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Evaluando según guías...
                </>
              ) : (
                <>
                  Finalizar y recibir devolución <ArrowRight className="size-4" />
                </>
              )}
            </Button>
            {feedbackMutation.isError && (
              <span className="text-sm text-destructive">
                No se pudo generar la devolución. Probá de nuevo.
              </span>
            )}
          </div>
        </Seccion>
      )}

      {etapa === "feedback" && feedback && (
        <>
          <FeedbackPanel feedback={feedback} />
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => navigate({ to: "/" })}>Resolver otro caso</Button>
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
  caso,
  etapaId,
  solicitudes,
  setSolicitudes,
  pedirEtapa,
  placeholder,
}: {
  caso: Caso;
  etapaId: "examen" | "estudios";
  solicitudes: SolicitudEtapa[];
  setSolicitudes: React.Dispatch<React.SetStateAction<SolicitudEtapa[]>>;
  pedirEtapa: (opts: {
    data: {
      caso: Caso;
      etapa: "examen" | "estudios";
      pedido: string;
      previos: string[];
    };
  }) => Promise<{ hallazgo: string }>;
  placeholder: string;
}) {
  const [pedido, setPedido] = useState("");

  const mutation = useMutation({
    mutationFn: (texto: string) =>
      pedirEtapa({
        data: {
          caso,
          etapa: etapaId,
          pedido: texto,
          previos: solicitudes.map((s) => s.pedido),
        },
      }),
    onSuccess: (data, texto) =>
      setSolicitudes((prev) => [...prev, { pedido: texto, hallazgo: data.hallazgo }]),
  });

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
