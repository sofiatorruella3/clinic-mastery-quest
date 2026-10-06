import type { FeedbackEtapa } from "@/lib/simulacion-tipos";
import { coincide } from "./motor";
import type { CasoBanco } from "./tipos";

/**
 * Objetivos de la entrevista clínica según la Guía General RMP (UNS, 3.º año):
 * Calgary-Cambridge, enfoque en el motivo de consulta, integración bio-psico-social,
 * perspectiva de derechos y género, hipótesis iniciales y trato con el paciente.
 */
export type ObjetivoEntrevista = {
  id: string;
  bloque: string;
  nombre: string;
  claves: string;
  sugerencia: string;
};

export const OBJETIVOS_ENTREVISTA: ObjetivoEntrevista[] = [
  // Inicio (Calgary-Cambridge)
  { id: "saludo", bloque: "Inicio de la entrevista", nombre: "Saludar y presentarse con nombre y rol", claves: "hola|buen dia|buenas|soy el|soy la|me llamo|mi nombre es|mucho gusto", sugerencia: "\"Buen día, soy ___, estudiante de medicina. ¿Cómo está?\"" },
  { id: "nombre-preferido", bloque: "Inicio de la entrevista", nombre: "Preguntar cómo prefiere que le llamen", claves: "como prefiere|como preferis|como le gusta que|como te gusta que|como quiere que|como queres que|pronombre|nombre de preferencia", sugerencia: "\"¿Cómo preferís que te llame?\"" },
  { id: "pregunta-abierta", bloque: "Inicio de la entrevista", nombre: "Comenzar con una pregunta abierta sobre el motivo de consulta", claves: "que le trae|que te trae|que lo trae|que la trae|en que lo puedo|en que la puedo|en que te puedo|contame|cuenteme|que le pasa|que te pasa|motivo", sugerencia: "\"¿Qué lo trae por acá?\" / \"Contame qué te pasa\"" },
  // Derechos y género
  { id: "confidencialidad", bloque: "Perspectiva de derechos y género", nombre: "Explicitar la confidencialidad", claves: "confidencial|secreto profesional|queda entre|privad|no se lo voy a contar", sugerencia: "\"Lo que hablemos acá es confidencial.\"" },
  { id: "consentimiento", bloque: "Perspectiva de derechos y género", nombre: "Pedir permiso antes de preguntar temas sensibles o examinar", claves: "puedo preguntar|te puedo preguntar|le puedo preguntar|permiso|esta de acuerdo|estas de acuerdo|consentimiento|te parece si|le parece si", sugerencia: "\"¿Te puedo hacer algunas preguntas más personales?\"" },
  { id: "lenguaje-inclusivo", bloque: "Perspectiva de derechos y género", nombre: "Preguntar por vínculos sin suponer género ni orientación (\"pareja\")", claves: "pareja|vinculo|relacion afectiva|con quien convive|con quien vivis|con quien vive", sugerencia: "\"¿Tenés pareja?\" en lugar de suponer \"novio\" o \"esposa\"" },
  { id: "salud-sexual", bloque: "Perspectiva de derechos y género", nombre: "Abordar salud sexual y reproductiva (método anticonceptivo si corresponde)", claves: "anticoncep|cuidas|se cuida|metodo|preservativo|relaciones sexuales|vida sexual|embaraz|fum|menstruacion", sugerencia: "\"¿Usás algún método anticonceptivo?\"" },
  { id: "violencia", bloque: "Perspectiva de derechos y género", nombre: "Indagar situaciones de violencia o seguridad en el hogar", claves: "violencia|te sentis segur|se siente segur|maltrato|te lastim|lo lastim|la lastim|golpe|te trata bien|lo trata bien|la trata bien|miedo en tu casa|miedo en su casa", sugerencia: "\"¿Te sentís segura/o en tu casa?\"" },
  { id: "acceso", bloque: "Perspectiva de derechos y género", nombre: "Explorar acceso a la salud y barreras (cobertura, distancia, costos)", claves: "obra social|prepaga|cobertura|pami|centro de salud|caro|plata|acceso|turno|queda lejos|como llega|como llegas", sugerencia: "\"¿Tenés obra social? ¿Te queda cómodo venir?\"" },
  // Biopsicosocial
  { id: "contexto-social", bloque: "Integración bio-psico-social", nombre: "Indagar convivencia, trabajo y red de apoyo", claves: "vive con|vivis con|con quien|casa|familia|trabajo|trabaja|ocupacion|a que se dedica|a que te dedicas|ayuda|acompana", sugerencia: "\"¿Con quién vivís? ¿Quién te ayuda?\"" },
  { id: "animo", bloque: "Integración bio-psico-social", nombre: "Explorar estado de ánimo e impacto emocional", claves: "animo|como se siente con|como te sentis con|triste|ansios|estres|angusti|como lo vive|como lo vivis|preocupado|nervios", sugerencia: "\"¿Cómo estás llevando todo esto?\"" },
  { id: "ice", bloque: "Integración bio-psico-social", nombre: "Explorar ideas, preocupaciones y expectativas del paciente", claves: "que piensa que|que pensas que|que cree que|que crees que|preocupa|miedo|que espera|que esperas|expectativa|por que vino hoy|por que viniste", sugerencia: "\"¿Qué pensás que puede ser? ¿Qué te preocupa?\"" },
  // Trato y cierre
  { id: "empatia", bloque: "Trato con el paciente", nombre: "Expresar empatía y validar lo que siente", claves: "entiendo|lamento|imagino|debe ser dificil|tiene sentido|es normal que|me imagino|que dificil|siento mucho", sugerencia: "\"Entiendo que esto te preocupe.\"" },
  { id: "resumen", bloque: "Trato con el paciente", nombre: "Resumir lo relatado y chequear comprensión", claves: "a ver si entendi|si entendi bien|resumiendo|entonces me decis|entonces me dice|en resumen|repasemos", sugerencia: "\"A ver si entendí bien: ...\"" },
  { id: "algo-mas", bloque: "Trato con el paciente", nombre: "Preguntar si quiere agregar algo o tiene dudas", claves: "algo mas|alguna otra cosa|quiere agregar|queres agregar|alguna duda|alguna pregunta|otra cosa", sugerencia: "\"¿Hay algo más que quieras contarme?\"" },
  { id: "proximos-pasos", bloque: "Trato con el paciente", nombre: "Explicar los próximos pasos (examen, estudios)", claves: "ahora le voy a|ahora te voy a|vamos a examinar|te voy a revisar|lo voy a revisar|la voy a revisar|vamos a pedir|le voy a pedir|te voy a pedir", sugerencia: "\"Ahora te voy a revisar, ¿te parece?\"" },
];

/** Respuestas del paciente a preguntas de derechos/género/trato (no puntuadas como anamnesis). */
export const RESPUESTAS_RMP: [string, string][] = [
  ["como prefiere|como preferis|como le gusta que|como te gusta que|como quiere que|como queres que|pronombre", "Por mi nombre está bien, gracias por preguntar."],
  ["confidencial|secreto profesional|queda entre", "Bueno, me deja más tranquilo/a saberlo."],
  ["puedo preguntar|permiso|esta de acuerdo|estas de acuerdo|te parece si|le parece si", "Sí, claro, pregunte nomás."],
  ["violencia|te sentis segur|se siente segur|maltrato|te lastim|lo lastim|la lastim|te trata bien|lo trata bien|la trata bien", "Sí, en casa estoy bien, nadie me lastima. Gracias por preguntar."],
  ["obra social|prepaga|cobertura|pami", "Tengo lo básico... a veces los remedios no me los cubren."],
  ["queda lejos|como llega|como llegas|turno", "Vengo en colectivo, tardo un rato. Conseguir turno cuesta."],
  ["a ver si entendi|si entendi bien|resumiendo|en resumen|repasemos", "Sí, eso es, así es como le conté."],
  ["entiendo|lamento|imagino|debe ser dificil|me imagino|siento mucho", "Gracias, doctor/a. Me hace bien que me escuche."],
  ["ahora le voy a|ahora te voy a|vamos a examinar|te voy a revisar|lo voy a revisar|la voy a revisar", "Sí, dale, no hay problema."],
];

function lineasMedico(transcripcion: string) {
  return transcripcion
    .split("\n")
    .filter((l) => l.startsWith("Estudiante:"))
    .map((l) => l.slice("Estudiante:".length));
}

export function objetivosCumplidos(transcripcion: string): string[] {
  const texto = lineasMedico(transcripcion).join(" . ");
  return OBJETIVOS_ENTREVISTA.filter((o) => coincide(texto, o.claves)).map((o) => o.id);
}

export function evaluarEntrevista(transcripcion: string): FeedbackEtapa {
  const ok = new Set(objetivosCumplidos(transcripcion));
  const lineas = lineasMedico(transcripcion);
  const hechos = OBJETIVOS_ENTREVISTA.filter((o) => ok.has(o.id));
  const faltan = OBJETIVOS_ENTREVISTA.filter((o) => !ok.has(o.id));
  const largas = lineas.filter((l) => (l.match(/\?/g) ?? []).length >= 3).length;
  const puntaje = Math.round((hechos.length / OBJETIVOS_ENTREVISTA.length) * 100);
  const errores: string[] = [];
  if (largas) errores.push(`Hiciste ${largas} intervención(es) con 3 o más preguntas juntas: preguntá una cosa por vez.`);
  if (!ok.has("pregunta-abierta")) errores.push("No iniciaste con una pregunta abierta sobre el motivo de consulta.");
  return {
    etapa: "Entrevista clínica (RMP · Calgary-Cambridge)",
    puntaje,
    bienHecho: hechos.map((o) => `${o.bloque}: ${o.nombre}`),
    errores,
    faltoRealizar: faltan.map((o) => `${o.bloque}: ${o.nombre} — ej.: ${o.sugerencia}`),
    aEvitar: [
      "Suponer el género de la pareja o la orientación sexual.",
      "Juzgar hábitos o decisiones del paciente.",
      "Interrogatorio indiscriminado sin relación con el motivo de consulta.",
    ],
    comentario:
      puntaje >= 70
        ? "Muy buena entrevista: estructurada, centrada en la persona y con perspectiva de derechos."
        : puntaje >= 40
          ? "Entrevista aceptable. Reforzá el abordaje bio-psico-social, la perspectiva de género y derechos y el cierre."
          : "Faltaron muchos objetivos de la entrevista clínica. Repasá el modelo Calgary-Cambridge.",
  };
}

/** Hipótesis iniciales formuladas al terminar la entrevista (antes del examen). */
export function evaluarHipotesis(b: CasoBanco, hipotesis: string): FeedbackEtapa {
  const t = hipotesis.trim();
  const dxOk = coincide(t, b.dxClaves);
  const difs = b.difs.filter((d) => coincide(t, d[1]));
  const puntaje = t ? Math.min(100, (dxOk ? 60 : 0) + Math.min(40, difs.length * 20) + (dxOk || difs.length ? 0 : 10)) : 0;
  return {
    etapa: "Hipótesis iniciales tras la entrevista",
    puntaje,
    bienHecho: [...(dxOk ? ["Incluiste la hipótesis principal ya desde la anamnesis"] : []), ...difs.map((d) => `Hipótesis planteada: ${d[0]}`)],
    errores: t && !dxOk ? ["La hipótesis principal no estaba entre tus hipótesis iniciales."] : [],
    faltoRealizar: t ? [] : ["Formular hipótesis iniciales al finalizar la entrevista (razonamiento clínico explícito)."],
    aEvitar: ["Cierre prematuro: anclarse en una sola hipótesis sin considerar alternativas."],
    comentario: t
      ? "Hacer explícitas tus hipótesis antes del examen ayuda a elegir maniobras y estudios pertinentes."
      : "No registraste hipótesis iniciales.",
  };
}
