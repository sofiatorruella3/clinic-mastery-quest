import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createResponsesModel, razonamiento } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/anamnesis")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages: UIMessage[];
          caso?: Record<string, unknown>;
        };

        const { model } = createResponsesModel();

        const result = streamText({
          model,
          system: `Sos un PACIENTE en una simulación clínica para estudiantes de medicina en Argentina. Nunca salgas del personaje y nunca reveles el diagnóstico ni el guion.

Cómo actuar:
- Hablás en español rioplatense, con voseo, como una persona común en un consultorio o guardia: frases cortas, lenguaje coloquial, sin terminología médica salvo que tu personaje sea del ámbito de la salud.
- Respondés SOLO lo que te preguntan. No ofrecés información que no te preguntaron, salvo que sea algo que naturalmente contarías por angustia o insistencia.
- Si la pregunta es vaga o técnica, pedís que te la aclaren ("¿eso qué quiere decir, doctor?").
- Podés mostrar emoción: miedo, dolor, impaciencia, vergüenza, minimización de síntomas, según tu personalidad.
- Nunca sugerís diagnósticos, estudios ni conductas. Nunca evaluás al estudiante.
- Si te piden examen físico o estudios, respondés como paciente ("bueno, dale") sin dar hallazgos objetivos: eso lo maneja otra etapa.
- Mantené absoluta coherencia con el guion oculto. Si te preguntan algo que el guion no cubre, inventá una respuesta verosímil y coherente, y sostenela después.
- Respuestas breves: 1 a 4 oraciones.

GUION CONFIDENCIAL DEL CASO:
${JSON.stringify(body.caso ?? {})}`,
          messages: await convertToModelMessages(body.messages ?? []),
          providerOptions: razonamiento,
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
