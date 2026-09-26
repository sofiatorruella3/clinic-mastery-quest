import { createFileRoute } from "@tanstack/react-router";
import { streamObject } from "ai";
import { z } from "zod";

import { createResponsesModel, razonamiento } from "@/lib/ai-gateway.server";

const casoSchema = z.object({
  titulo: z.string(),
  ambito: z.string(),
  motivoConsulta: z.string(),
  paciente: z.object({
    nombre: z.string(),
    edad: z.string(),
    sexo: z.string(),
    ocupacion: z.string(),
    apariencia: z.string(),
  }),
  signosVitales: z.string(),
  guionOculto: z.object({
    diagnosticoFinal: z.string(),
    historiaCompleta: z.string(),
    hallazgosExamenFisico: z.string(),
    resultadosEstudios: z.string(),
    conductaEsperada: z.string(),
    diferenciales: z.string(),
    personalidad: z.string(),
  }),
});

const CONTEXTO_ARG = `Contexto: simulación clínica para estudiantes de medicina en Argentina.
Usá terminología y nomenclatura de la práctica clínica argentina (p. ej. "laboratorio con hemograma, urea, creatinina, ionograma", "Rx tórax frente y perfil", "ECG de 12 derivaciones", "guardia", "obra social", "PAMI", "AMBA", "SAMIC").
Nombres, obras sociales, medicamentos y dosis deben ser verosímiles para Argentina (nombres genéricos y comerciales locales cuando corresponda).`;

export const Route = createFileRoute("/api/caso")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { aparato?: string; dificultad?: string };
        const aparato = body.aparato ?? "cardiovascular";
        const dificultad = body.dificultad ?? "moderada";

        const { model } = createResponsesModel();

        const result = streamObject({
          model,
          schema: casoSchema,
          system: `Sos un docente de medicina interna que diseña casos clínicos simulados de alta calidad, basados en guías de práctica clínica nacionales (Ministerio de Salud de la Nación, sociedades científicas argentinas) e internacionales.
${CONTEXTO_ARG}
El "guionOculto" NO se le muestra al estudiante: contiene la verdad del caso para que el simulador responda con coherencia.
Nivel de dificultad solicitado:
- baja: presentación típica, paciente colaborador, patología prevalente.
- moderada: comorbilidades, datos que el paciente no relata espontáneamente, diferenciales cercanos.
- dificil: presentación atípica, paciente poco confiable u omisivo, urgencia o patología menos frecuente.
Redactá "historiaCompleta", "hallazgosExamenFisico" y "resultadosEstudios" con detalle suficiente (valores de laboratorio con unidades, descripciones de imágenes, ECG) para poder responder cualquier pedido razonable del estudiante.`,
          prompt: `Generá un caso clínico nuevo y original del aparato/área "${aparato}" con dificultad "${dificultad}". No repitas el caso clásico más obvio; variá edad, sexo, ámbito de atención y contexto social.`,
          providerOptions: razonamiento,
        });

        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              for await (const partial of result.partialObjectStream) {
                controller.enqueue(encoder.encode(JSON.stringify(partial) + "\n"));
              }
              const final = await result.object;
              controller.enqueue(encoder.encode(JSON.stringify({ __final: final }) + "\n"));
            } catch (error) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    __error: /payment required|402|insufficient_quota|quota/i.test(
                      String((error as Error)?.message),
                    )
                      ? "Tu cuenta de OpenAI no tiene saldo disponible para usar la API. Cargá saldo en platform.openai.com para seguir generando casos."
                      : ((error as Error)?.message ?? "error"),
                  }) + "\n",
                ),
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});
