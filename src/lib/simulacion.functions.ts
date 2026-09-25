import { createServerFn } from "@tanstack/react-start";
import { Output, streamText } from "ai";
import { z } from "zod";

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

const feedbackSchema = z.object({
  puntajeGlobal: z.number(),
  diagnosticoCorrecto: z.string(),
  resumenGlobal: z.string(),
  etapas: z.array(
    z.object({
      etapa: z.string(),
      puntaje: z.number(),
      bienHecho: z.array(z.string()),
      errores: z.array(z.string()),
      faltoRealizar: z.array(z.string()),
      aEvitar: z.array(z.string()),
      comentario: z.string(),
    }),
  ),
  guiasUtilizadas: z.array(z.string()),
  proximosPasos: z.array(z.string()),
});

const CONTEXTO_ARG = `Contexto: simulación clínica para estudiantes de medicina en Argentina.
Usá terminología y nomenclatura de la práctica clínica argentina (p. ej. "laboratorio con hemograma, urea, creatinina, ionograma", "Rx tórax frente y perfil", "ECG de 12 derivaciones", "guardia", "obra social", "PAMI", "AMBA", "SAMIC").
Nombres, obras sociales, medicamentos y dosis deben ser verosímiles para Argentina (nombres genéricos y comerciales locales cuando corresponda).`;

export const generarCaso = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ aparato: z.string(), dificultad: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { createResponsesModel, razonamiento } = await import("./ai-gateway.server");
    const { model } = createResponsesModel();

    const result = streamText({
      model,
      output: Output.object({ schema: casoSchema }),
      system: `Sos un docente de medicina interna que diseña casos clínicos simulados de alta calidad, basados en guías de práctica clínica nacionales (Ministerio de Salud de la Nación, sociedades científicas argentinas) e internacionales.
${CONTEXTO_ARG}
El "guionOculto" NO se le muestra al estudiante: contiene la verdad del caso para que el simulador responda con coherencia.
Nivel de dificultad solicitado:
- baja: presentación típica, paciente colaborador, patología prevalente.
- moderada: comorbilidades, datos que el paciente no relata espontáneamente, diferenciales cercanos.
- dificil: presentación atípica, paciente poco confiable u omisivo, urgencia o patología menos frecuente.
Redactá "historiaCompleta", "hallazgosExamenFisico" y "resultadosEstudios" con detalle suficiente (valores de laboratorio con unidades, descripciones de imágenes, ECG) para poder responder cualquier pedido razonable del estudiante.`,
      prompt: `Generá un caso clínico nuevo y original del aparato/área "${data.aparato}" con dificultad "${data.dificultad}". No repitas el caso clásico más obvio; variá edad, sexo, ámbito de atención y contexto social.`,
      providerOptions: razonamiento,
    });

    return await result.output;
  });

export const responderEtapa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        caso: casoSchema,
        etapa: z.enum(["examen", "estudios"]),
        pedido: z.string().min(1),
        previos: z.array(z.string()),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { createResponsesModel, razonamiento } = await import("./ai-gateway.server");
    const { model } = createResponsesModel();

    const instruccion =
      data.etapa === "examen"
        ? `El estudiante indica qué maniobras o sectores del examen físico realiza. Devolvé ÚNICAMENTE los hallazgos objetivos correspondientes a lo que pidió, en formato de informe clínico breve (markdown con viñetas). Si pide "examen físico completo", dá los hallazgos por aparatos de forma resumida. Si pide algo no realizable o mal formulado, aclaralo en una línea. No des interpretaciones, ni diagnósticos, ni sugerencias.`
        : `El estudiante solicita estudios complementarios. Devolvé ÚNICAMENTE los resultados de los estudios pedidos (valores con unidades y valores de referencia cuando corresponda, informes de imágenes, ECG), en markdown. Si un estudio no está disponible o no corresponde al ámbito, indicalo brevemente. No interpretes, no diagnostiques, no sugieras otros estudios.`;

    const result = streamText({
      model,
      system: `Sos el motor de un simulador clínico. ${CONTEXTO_ARG}
${instruccion}
Mantené coherencia estricta con el guion oculto del caso.`,
      prompt: `CASO (confidencial):
${JSON.stringify(data.caso.guionOculto)}
Signos vitales: ${data.caso.signosVitales}
Paciente: ${JSON.stringify(data.caso.paciente)}

Pedidos previos del estudiante: ${data.previos.join(" | ") || "ninguno"}

Nuevo pedido del estudiante: "${data.pedido}"`,
      providerOptions: razonamiento,
    });

    return { hallazgo: await result.text };
  });

export const generarFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        caso: casoSchema,
        anamnesis: z.string(),
        examenFisico: z.array(z.object({ pedido: z.string(), hallazgo: z.string() })),
        estudios: z.array(z.object({ pedido: z.string(), hallazgo: z.string() })),
        diagnostico: z.string(),
        tratamiento: z.string(),
        seguimiento: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { createResponsesModel, razonamiento } = await import("./ai-gateway.server");
    const { model } = createResponsesModel();

    const result = streamText({
      model,
      output: Output.object({ schema: feedbackSchema }),
      system: `Sos un médico docente evaluador. Evaluás el desempeño de un estudiante en una simulación clínica comparándolo con guías de práctica clínica altamente validadas: guías del Ministerio de Salud de la Nación Argentina, consensos de sociedades científicas argentinas (SAC, AAMR, SAGE, SADI, SAN, SAD, SAHA, FASGO), y guías internacionales de referencia (ESC, AHA/ACC, GOLD, GINA, KDIGO, ADA, IDSA, WHO, NICE, Surviving Sepsis).
${CONTEXTO_ARG}
Reglas de evaluación:
- Puntajes de 0 a 100, exigentes pero justos según la dificultad del caso.
- Prioridad: el foco pedagógico está en recabar y analizar buenos datos en Anamnesis, Examen físico, Estudios complementarios y Diagnóstico presuntivo. Evaluá esas etapas con mayor profundidad y peso en el puntaje global.
- El estudiante empieza sin datos del paciente: valorá que haya obtenido filiación, motivo de consulta, antecedentes y signos vitales por sí mismo.
- Tratamiento: evaluá solo el enfoque general (medidas, grupos de fármacos, internación/derivación). NO exijas ni corrijas dosis, vías o posologías; tu devolución de tratamiento también debe ser general, sin dosis.
- Diferenciales: solo deben mencionarse. No penalices que no estén justificados, y en tu devolución listalos brevemente sin explicar por qué sí o por qué no cada uno.
- Tratamiento y Seguimiento: comentarios breves.
- Evaluá una etapa por cada una de: Anamnesis, Examen físico, Estudios complementarios, Diagnóstico presuntivo, Tratamiento, Seguimiento.
- En cada etapa: qué hizo bien, qué hizo mal, qué faltó preguntar/hacer, y qué debería evitar (estudios innecesarios, iatrogenia, preguntas inductivas, omisión de banderas rojas, sobreindicación de antibióticos o imágenes, falta de consentimiento, sesgos).
- Citá la guía o recomendación concreta que respalda cada señalamiento cuando sea posible, con nombre y año aproximado.
- "guiasUtilizadas": listá las guías efectivamente usadas para la devolución.
- "proximosPasos": recomendaciones concretas de estudio para el alumno.
- Escribí en español rioplatense, en segunda persona ("preguntaste", "te faltó"), claro y pedagógico.
- No inventes acciones que el estudiante no realizó. Si una etapa quedó vacía, evaluala como no realizada y explicá su importancia.`,
      prompt: `CASO Y VERDAD CLÍNICA (confidencial):
${JSON.stringify(data.caso)}

DESEMPEÑO DEL ESTUDIANTE:

1) ANAMNESIS (transcripción de la entrevista médico-paciente):
${data.anamnesis || "(no realizó anamnesis)"}

2) EXAMEN FÍSICO solicitado:
${data.examenFisico.map((s) => `- Pidió: ${s.pedido}\n  Halló: ${s.hallazgo}`).join("\n") || "(no realizó examen físico)"}

3) ESTUDIOS COMPLEMENTARIOS solicitados:
${data.estudios.map((s) => `- Pidió: ${s.pedido}\n  Resultado: ${s.hallazgo}`).join("\n") || "(no solicitó estudios)"}

4) DIAGNÓSTICO PRESUNTIVO Y DIFERENCIALES:
${data.diagnostico || "(sin respuesta)"}

5) TRATAMIENTO PROPUESTO:
${data.tratamiento || "(sin respuesta)"}

6) SEGUIMIENTO PROPUESTO:
${data.seguimiento || "(sin respuesta)"}`,
      providerOptions: razonamiento,
    });

    return await result.output;
  });
