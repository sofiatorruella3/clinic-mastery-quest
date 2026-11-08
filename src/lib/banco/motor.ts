import type { Caso, Feedback, FeedbackEtapa, SolicitudEtapa } from "@/lib/simulacion-tipos";
import { BANCO_1 } from "./banco-1";
import { BANCO_2 } from "./banco-2";
import { BANCO_3 } from "./banco-3";
import { BANCO_4 } from "./banco-4";
import { BANCO_5 } from "./banco-5";
import { BANCO_6 } from "./banco-6";
import { BANCO_7 } from "./banco-7";
import { BANCO_8 } from "./banco-8";
import { BANCO_9 } from "./banco-9";
import { BANCO_10 } from "./banco-10";
import { BANCO_11 } from "./banco-11";
import { BANCO_12 } from "./banco-12";
import { conPersonalidad } from "./personalidad";
import { RESPUESTAS_RMP } from "./objetivos-entrevista";
import type { CasoBanco, Clave, Item } from "./tipos";

export const BANCO: CasoBanco[] = [...BANCO_1, ...BANCO_2, ...BANCO_3, ...BANCO_4, ...BANCO_5, ...BANCO_6, ...BANCO_7, ...BANCO_8, ...BANCO_9, ...BANCO_10, ...BANCO_11, ...BANCO_12];

export function norm(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ");
}

function casiIgual(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, dif = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++dif > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return dif + (a.length - i) + (b.length - j) <= 1;
}

export function coincide(texto: string, claves: string, difuso = false) {
  const n = norm(texto);
  const t = ` ${n} `;
  const palabras = n.split(" ").filter(Boolean);
  // Une palabras partidas por error de tipeo ("tam iien" → "tamiien")
  const unidas = palabras.slice(0, -1).map((p, i) => p + palabras[i + 1]);
  const tokens = [...palabras, ...unidas];
  return claves.split("|").some((c) => {
    const k = norm(c).trim();
    if (!k) return false;
    if (t.includes(` ${k}`)) return true;
    // Tolerancia a errores de tipeo en claves de una sola palabra
    if (difuso && k.length >= 5 && !k.includes(" ")) {
      return tokens.some((p) => p.length >= 4 && (casiIgual(p, k) || (p.length > k.length && casiIgual(p.slice(0, k.length), k))));
    }
    return false;
  });
}

const ACTIVIDADES = "actividades|actividad diaria|vida diaria|dia a dia|rutina|escalera|subir|cuadras|caminar|esfuerzo|tareas|limita|cansa|agita|hacer cosas|quehaceres";

function ctxCaso(b: CasoBanco) {
  return norm(`${b.motivo} ${b.dx} ${b.anam.map((a) => a[2]).join(" ")} ${b.ex.map((a) => a[2]).join(" ")}`);
}

function respuestaActividades(b: CasoBanco) {
  const ctx = ctxCaso(b);
  if (/disnea|falta el aire|ahog|insuficiencia cardiaca|epoc|fatiga|cansancio|pecho|angina|anemia/.test(ctx))
    return "En reposo estoy más o menos bien, pero si subo un piso por la escalera, camino unas cuadras o hago las cosas de la casa ya me tengo que parar, me falta el aire y me canso. Antes no me pasaba.";
  if (/dolor|artritis|articul|lumbar|rodilla/.test(ctx))
    return "Sí, me cuesta bastante hacer las cosas de todos los días: el dolor me limita, tardo más en todo y algunas cosas las dejé de hacer.";
  return "En lo diario me arreglo bien, hago mis cosas como siempre; no noto que esto me limite mucho, salvo cuando me siento mal.";
}

/**
 * Respuestas dirigidas por síntoma: [claves de la pregunta, claves del contexto del caso,
 * respuesta si el caso lo menciona, respuesta si no].
 * Si el caso no menciona el síntoma, el paciente lo niega (como en un interrogatorio dirigido real).
 */
const SINTOMAS_DIRIGIDOS: [string, string, string, string][] = [
  ["de golpe|de a poco|brusco|repentino|comienzo|inicio|como arranco|como empezo|cuando empezo|hace cuanto|desde cuando", "subito|brusco|repentin|de golpe|agudo",
    "Empezó de golpe, de un momento para el otro, sin aviso.",
    "Fue de a poco, vino avanzando con los días."],
  ["fiebre|temperatura|febril|calentura", "fiebre|febril|febricula|38|39",
    "Sí, me tomé la temperatura y tenía fiebre, andaba por los 38 y pico. Me da como escalofríos.",
    "Fiebre no, no me la medí pero no me sentí caliente ni con escalofríos."],
  ["perdio peso|bajo de peso|adelgazo|adelgace|perdida de peso", "peso|adelgaz|bajo de peso|perdio",
    "Sí, la verdad que bajé de peso sin querer, la ropa me queda más grande.",
    "No, el peso se mantiene igual que siempre."],
  ["dolor|le duele|te duele|duele", "dolor",
    "Sí, me duele. Es el motivo por el que vine, más que nada.",
    "Dolor no tengo, por suerte."],
  ["donde le duele|donde te duele|localizacion|en que parte|en que zona", "dolor",
    "Acá, mire, justo donde me señalo. Es siempre en el mismo lugar.",
    "No me duele en ningún lado en particular."],
  ["como es el dolor|tipo de dolor|que tipo|punzante|opresivo|quemante|sordo|colico", "dolor",
    "Es un dolor que va y viene, a veces más fuerte. Cuando aprieta de verdad no me deja hacer nada.",
    "No tengo dolor."],
  ["se irradia|irradia|se va para|se corre el dolor|baja el dolor|sube el dolor", "irradia|dolor",
    "A veces siento que se me corre un poco para los costados, pero más que nada me queda acá.",
    "No, no se me mueve de donde es."],
  ["que lo empeora|que lo agrava|empeora con|peor con|aumenta con", "dolor|disnea|ahog",
    "Empeora cuando me muevo o hago esfuerzo; en reposo se calma un poco.",
    "No noto que nada en particular lo empeore."],
  ["que lo calma|que lo alivia|mejora con|alivia con|se pasa con", "dolor|disnea|ahog",
    "Descansando se me calma bastante. Y cuando me siento quieto/a estoy mejor.",
    "No encontré nada que lo alivie, viene y se va solo."],
  ["deposiciones|materia fecal|caca|hacer caca|evacu|diarrea|estrenim|intestin", "diarrea|melena|materia fecal|deposiciones|estrenim",
    "Ando medio mal de la panza con eso, noté cambios en las deposiciones estos días.",
    "Las deposiciones como siempre, una vez al día más o menos, normales."],
  ["orina|hacer pis|pis|miccion|cuanto orina", "orina|disuria|polaquiuria|hematuria|pis",
    "Con el pis ando medio raro, noté cambios: me molesta un poco.",
    "Orino normal, cuatro o cinco veces por día, color normal."],
  ["mareo|mareos|mareado|vertigo|se le mueve todo", "mareo|vertigo",
    "Sí, ando mareado/a, como que se me mueve todo a veces.",
    "Mareos no, por suerte."],
  ["se desmayo|desmayo|sincope|perdio el conocimiento|se bajo la presion|se puso blanco", "sincope|desmayo|lipotimia",
    "Sí, me desmayé / casi me desmayo, se me puso todo negro un momento.",
    "No, nunca me desmayé."],
  ["palpitaciones|corazon acelerado|latidos|taquicardia|le late fuerte", "palpitaciones|taquicardia|arritmia|fibrilacion",
    "Sí, siento el corazón que se me acelera de golpe, como si se me saliera del pecho.",
    "No, el corazón lo siento normal."],
  ["algo parecido antes|le paso antes|episodios previos|otra vez|primera vez que", "episodios|anteriores|recurrenc|previo",
    "Sí, me pasó algo parecido otra vez, aunque no tan fuerte.",
    "No, es la primera vez que me pasa algo así."],
  ["fue al medico|consulto|lo vio alguien|otro medico|guardia", "",
    "No, no fui a ningún médico por esto, vine directamente acá.",
    "No, no fui a ningún médico por esto, vine directamente acá."],
  ["estuvo internado|internacion|hospitaliz", "internad|hospitaliz",
    "Sí, estuve internado/a una vez por un tema parecido.",
    "No, nunca estuve internado/a."],
  ["viajo|viaje|viajar|exterior|avion", "viaje|viajo|avion",
    "Sí, hace poco hice un viaje largo, varias horas.",
    "No, no viajé últimamente."],
  ["contacto con enfermos|alguien enfermo|contagio|familiar enfermo|convive con", "contacto|contagio|convive",
    "Sí, en casa hubo alguien con algo parecido estos días.",
    "Que yo sepa, nadie cerca estuvo enfermo."],
  ["embarazada|embarazo|embarazada", "embarazo|gestante|embarazada",
    "Sí, estoy embarazada.",
    "No, no estoy embarazada."],
  ["menstruacion|la regla|periodo|le vino|ciclo menstrual", "menstru|regla|menorrea|amenorrea",
    "Con la regla ando medio irregular, justo estos días noté cambios.",
    "La regla me viene normal, todos los meses."],
  ["toma anticonceptivos|anticonceptiv|pastillas anticonceptivas", "anticonceptiv",
    "Sí, tomo las pastillas anticonceptivas.",
    "No, no tomo anticonceptivos."],
  ["le pica|picazon|comezon|se rasca", "prurito|picazon|dermat|urticaria|lesion",
    "Sí, me pica bastante, me tengo que aguantar para no rascarme.",
    "No, no me pica."],
  ["sarpullido|ronchas|lesiones en la piel|manchas en la piel|granos", "sarpullido|ronchas|lesion|erupcion|exantema|placa|mancha",
    "Sí, me salieron unas lesiones / manchas en la piel, mire.",
    "No, la piel la tengo bien."],
  ["zumba el oido|zumbido|acufeno|oido tapado|escucha bien|audicion|sordera", "zumbido|acufeno|hipoacusia|oido|sordera|audicion",
    "Sí, siento el oído medio tapado y me zumba a veces.",
    "Escucho bien, sin problemas de oídos."],
  ["ve borroso|vision|ve bien|vista|ojos|vision doble", "visual|vision|ocular|oftalm|ojo|borroso",
    "Sí, noto que no veo tan bien como antes, medio borroso.",
    "La vista la tengo bien."],
  ["nariz tapada|respirar por la nariz|congestion nasal|mocos|resfrio", "nasal|rinorrea|congestion|resfrio|rinitis",
    "Sí, tengo la nariz tapada y me moquea.",
    "No, respiro bien por la nariz."],
  ["le sangra|sangrado|sangra|sangre", "sangr|hemorrag|epistaxis|hemoptisis|hematemesis|melena",
    "Sí, noté sangre, eso fue lo que más me asustó.",
    "No, no tuve ningún sangrado."],
  ["tos|tose", "tos",
    "Sí, tengo tos, me agarra en ataques a veces.",
    "No, no tengo tos."],
  ["escupe sangre|tose sangre|flema con sangre|esputo", "hemoptisis|sangre al toser",
    "Sí, un par de veces vi sangre al toser, poquito.",
    "No, nunca escupí sangre."],
  ["flema|esputo|expectora|catarro", "esputo|flema|expectora",
    "Sí, levanto flemas, sobre todo a la mañana.",
    "No, tos seca, sin flemas."],
  ["cuesta tragar|disfagia|tragar|dolor al tragar|comida se le atora", "disfagia|odinofagia|tragar",
    "Sí, me cuesta tragar, como que se me queda la comida a mitad de camino.",
    "No, trago sin problema."],
  ["nauseas|vomitos|vomito|devolvio|asqueado", "nauseas|vomito",
    "Sí, anduve con náuseas y vomité un par de veces.",
    "No, sin náuseas ni vómitos."],
  ["acidez|ardor de estomago|pirosis|reflujo", "pirosis|acidez|reflujo",
    "Sí, me arde la boca del estómago, sobre todo después de comer.",
    "No, no tengo acidez."],
  ["cabeza|cefalea|dolor de cabeza", "cefalea|dolor de cabeza|migra",
    "Sí, me duele la cabeza, a veces fuerte.",
    "No, la cabeza no me duele."],
  ["escalofrios|tiembla de frio", "escalofrios|fiebre|febril",
    "Sí, me dieron escalofríos de esos que te sacuden todo.",
    "No, sin escalofríos."],
  ["ganglios|bolitas|bultos|adeno", "ganglio|adenopat|linfaden|bulto",
    "Sí, me toqué unas bolitas que no estaban antes.",
    "No, no me noté ninguna bolita."],
  ["caida del pelo|cae el pelo|cabello", "alopecia|pelo|cabello",
    "Sí, se me cae el pelo más de lo normal.",
    "No, el pelo normal."],
  ["sed|mucha sed|boca seca", "polidipsia|sed",
    "Sí, ando con una sed bárbara, tomo agua todo el día.",
    "No, tomo lo normal."],
  ["hambre|apetito|gana de comer", "polifagia|apetito|anorexia",
    "El apetito anduvo raro, noté cambios con las ganas de comer.",
    "El apetito normal, como siempre."],
  ["hormigueo|entumec|duerme la mano|duerme el pie|perdida de fuerza|debilidad|no puede mover", "parestesia|hormigueo|debilidad|paresia|fuerza|deficit",
    "Sí, noto como hormigueos y que me falta fuerza de un lado.",
    "No, ni hormigueos ni falta de fuerza."],
  ["convulsion|sacudidas|epilep|ataque", "convulsion|epilep|crisis",
    "Sí, tuve como un ataque, me sacudí toda.",
    "No, nunca tuve convulsiones."],
  ["edema|hinchazon|hinchado|se le hincha", "edema|hinchazon|hinchad",
    "Sí, se me hinchan, sobre todo a la tarde-noche.",
    "No, no noto hinchazón."],
  ["ortopnea|almohadas|dormir sentado|se ahoga acostado|ahoga de noche|despierta ahogado", "ortopnea|paroxistica|ahog",
    "Sí, de noche tengo que poner más almohadas porque acostado/a me ahogo.",
    "No, duermo acostado/a sin problema."],
];

function respuestaSintomaDirigido(b: CasoBanco, pregunta: string, difuso: boolean): string | null {
  const ctx = ctxCaso(b);
  for (const [clavesPregunta, clavesCaso, si, no] of SINTOMAS_DIRIGIDOS) {
    if (!coincide(pregunta, clavesPregunta, difuso)) continue;
    if (b.paciente.sexo === "masculino" && /embaraz|menstru|regla|anticonceptiv/.test(norm(clavesPregunta)))
      return "No, eso no aplica en mi caso.";
    return clavesCaso && coincide(ctx, clavesCaso) ? si : no;
  }
  return null;
}

export function elegirCaso(aparato: string, dificultad: string) {
  const opciones = BANCO.filter((c) => c.aparato === aparato && c.dificultad === dificultad);
  const lista = opciones.length ? opciones : BANCO.filter((c) => c.aparato === aparato);
  return lista[Math.floor(Math.random() * lista.length)] ?? BANCO[0];
}

export const buscarCaso = (id?: string) => BANCO.find((c) => c.id === id);

export function aCaso(b: CasoBanco): Caso {
  return {
    bancoId: b.id,
    titulo: b.titulo,
    ambito: b.ambito,
    motivoConsulta: b.motivo,
    paciente: b.paciente,
    signosVitales: b.vitales,
    guionOculto: {
      diagnosticoFinal: b.dx,
      historiaCompleta: b.anam.map((a) => a[2]).join(" "),
      hallazgosExamenFisico: b.ex.map((a) => `${a[0]}: ${a[2]}`).join(" "),
      resultadosEstudios: b.est.map((a) => `${a[0]}: ${a[2]}`).join(" "),
      conductaEsperada: b.trat.map((t) => t[0]).join("; "),
      diferenciales: b.difs.map((d) => d[0]).join(", "),
      personalidad: "",
    },
  };
}

/* ───── Anamnesis ───── */

function itemsAnamnesis(b: CasoBanco): Item[] {
  const p = b.paciente;
  return [
    ["Motivo de consulta", "que le pasa|que te pasa|motivo|que lo trae|que la trae|que te trae|en que lo puedo|en que la puedo|en que te puedo|como esta|como se siente|como te sentis|consulta|contame|cuenteme", b.motivo, 1],
    ["Nombre", "nombre|como se llama|como te llamas", `Me llamo ${p.nombre}.`, 1],
    ["Edad", "edad|cuantos anos|anos tiene", `Tengo ${p.edad} años.`, 1],
    ["Ocupación", "trabaja|ocupacion|a que se dedica|a que te dedicas|trabajo", `Soy ${p.ocupacion}.`, 1],
    ...b.anam,
  ];
}

const GENERICAS: [string, string][] = [
  ["alergi", "Que yo sepa, no soy alérgico/a a nada."],
  ["medicacion|medicamento|remedio|pastilla|toma algo", "No tomo ninguna medicación de forma habitual."],
  ["fuma|tabaco|cigarr", "No fumo."],
  ["alcohol|toma alcohol|bebe", "Alcohol muy poco, algo social."],
  ["droga|consume|sustancia", "No consumo drogas."],
  ["operado|cirugia|operacion", "No me operaron nunca."],
  ["familia|padre|madre|hermano", "En mi familia no hay nada importante que yo sepa."],
  ["antecedente|enfermedad|problema de salud", "No tengo otras enfermedades que yo sepa."],
  ["preocupa|miedo|asusta|que piensa que|que cree que", "Y... un poco de miedo tengo, la verdad. Uno lee cosas en internet y se asusta."],
  ["duerme|sueno|dormir", "Duermo más o menos, me despierto algunas veces a la noche."],
  ["comio algo raro|comida en mal estado|intoxicacion|envenen|algo que le cayo mal", "No, comí lo de siempre en casa, nada raro ni en mal estado."],
  ["apetito|come|alimentacion|dieta|comida", "Como como siempre, nada raro. Capaz un poco desordenado."],
  ["vive con|con quien vive|casa|familia vive|hijos|pareja|casado", "Vivo con mi familia, me acompañan bastante."],
  ["actividad fisica|ejercicio|deporte|camina", "Ejercicio no hago mucho, la verdad. Camino lo que puedo."],
  ["vacuna", "Creo que las vacunas las tengo al día, el carnet lo tengo en casa."],
  ["estado de animo|animo|triste|ansios|estres|nervios", "Estoy un poco preocupado/a con todo esto, pero bien dentro de todo."],
  ["algo mas|alguna otra cosa|algo que quiera agregar|otra cosa|alguna duda|pregunta", "No, creo que es todo... bueno, ¿usted cree que es algo grave, doctor/a?"],
  ["gracias|perfecto|muy bien|entiendo|bueno", "Gracias a usted, doctor/a."],
  ["tranquil|no se preocupe|quedese", "Bueno, me deja más tranquilo/a que me lo diga."],
  ["hola|buen dia|buenas|soy el|soy la|mucho gusto", "Hola, doctor/a, buen día. Gracias por atenderme."],
];

/** Comodín final: el paciente siempre contesta algo, nunca dice que no entendió. */
const RESPUESTAS_COMODIN = [
  "Mmm, la verdad que de eso no noté nada raro, doctor/a. Lo que más me molesta es lo que le conté.",
  "No, eso no. Por suerte lo mío viene por otro lado, como le decía.",
  "Eso no lo tuve, no. Yo sigo igual con lo que le conté al principio.",
  "No sabría decirle, pero no me parece que venga por ahí la cosa. ¿Quiere que le cuente de nuevo cómo empezó todo?",
];
let comodinIdx = 0;

export function responderPaciente(b: CasoBanco, pregunta: string): { texto: string; ids: string[] } {
  return intentar(b, pregunta, false) ?? intentar(b, pregunta, true) ?? { texto: conPersonalidad(b, norm(pregunta), RESPUESTAS_COMODIN[comodinIdx++ % RESPUESTAS_COMODIN.length]!, false), ids: [] };
}

function intentar(b: CasoBanco, pregunta: string, d: boolean): { texto: string; ids: string[] } | null {
  const q = norm(pregunta);
  const hits = itemsAnamnesis(b).filter((i) => coincide(pregunta, i[1], d));
  const charla = (b.charla ?? []).filter((i) => coincide(pregunta, i[1], d));
  if (hits.length || charla.length) {
    const textos = [...hits.slice(0, 3).map((h) => h[2]), ...charla.slice(0, hits.length ? 1 : 2).map((c) => c[2])];
    const abierta = hits.some((h) => h[0] === "Motivo de consulta");
    return { texto: conPersonalidad(b, q, textos.join(" "), abierta), ids: hits.map((h) => h[0]) };
  }
  if (coincide(pregunta, ACTIVIDADES, d)) return { texto: conPersonalidad(b, q, respuestaActividades(b), false), ids: [] };
  const sintoma = respuestaSintomaDirigido(b, pregunta, d);
  if (sintoma) return { texto: conPersonalidad(b, q, sintoma, false), ids: [] };
  const rmp = RESPUESTAS_RMP.find(([c]) => coincide(pregunta, c, d));
  if (rmp) return { texto: rmp[1], ids: [] };
  const g = GENERICAS.find(([c]) => coincide(pregunta, c, d));
  if (g) return { texto: conPersonalidad(b, q, g[1], false), ids: [] };
  return null;
}

/* ───── Examen y estudios ───── */

/** Valores normales de referencia: se muestran cuando el caso no tiene un hallazgo específico para lo pedido. */
const NORMALES_EXAMEN: [string, string, string][] = [
  ["Inspección general", "inspeccion general|estado general|aspecto|facie", "Lúcido, orientado en tiempo y espacio, colaborador, facie no característica, normohidratado."],
  ["Piel y mucosas", "piel|mucosa|palidez|ictericia|cianosis|turgor", "Piel normocoloreada, normotérmica, sin lesiones; mucosas húmedas y rosadas; relleno capilar < 2 s."],
  ["Cabeza y cuello", "cuello|tiroides|yugular|ingurgitacion", "Cuello móvil, tiroides no palpable, sin ingurgitación yugular, pulsos carotídeos simétricos sin soplos."],
  ["Adenopatías", "ganglio|adenopatia", "Sin adenopatías palpables en cadenas cervicales, axilares ni inguinales."],
  ["Auscultación cardíaca", "cardiac|corazon|ruidos cardiacos|soplo|r1|auscultacion cardiaca|precordio", "R1 y R2 normofonéticos en 4 focos, silencios libres, sin soplos ni R3/R4. Choque de punta en 5.º EIC LMC."],
  ["Pulsos periféricos", "pulso|pedio|radial|femoral", "Pulsos periféricos presentes, simétricos, amplitud conservada."],
  ["Examen respiratorio", "pulmon|respiratori|torax|auscultacion pulmonar|murmullo|ventila|percusion|vibraciones|rales|crepitantes|sibilancias", "Tórax simétrico, expansión conservada, vibraciones vocales conservadas, sonoridad normal, murmullo vesicular presente bilateral sin ruidos agregados."],
  ["Examen abdominal", "abdomen|abdominal|palpacion abdominal|hepat|bazo|esplen|ruidos hidroaereos|blumberg|murphy|mcburney|rebote|defensa", "Abdomen blando, depresible, indoloro, sin defensa ni reacción peritoneal; RHA presentes; sin visceromegalias. Murphy y Blumberg negativos."],
  ["Puño percusión lumbar", "puno percusion|punopercusion|lumbar|giordano", "Puño percusión lumbar negativa bilateral."],
  ["Miembros inferiores", "edema|miembros inferiores|piernas|godet|tvp|pantorrilla", "Sin edemas, sin signos de TVP, pantorrillas blandas e indoloras."],
  ["Examen neurológico", "neurolog|pares craneales|fuerza|reflejos|sensibilidad|babinski|marcha|romberg|meningeo|rigidez de nuca|kernig|brudzinski|glasgow|pupilas|coordinacion", "Glasgow 15/15. Pupilas isocóricas reactivas. Pares craneales sin alteraciones. Fuerza 5/5 en 4 miembros, ROT ++ simétricos, Babinski negativo, sensibilidad conservada, coordinación y marcha normales, Romberg negativo, sin signos meníngeos."],
  ["Examen osteoarticular", "articul|osteoarticular|columna|rodilla|cadera|hombro|entesis|movilidad", "Articulaciones sin signos inflamatorios, movilidad activa y pasiva conservada e indolora; columna sin dolor a la palpación."],
  ["Otoscopía", "otoscop|oido|timpano|conducto auditivo", "Conducto auditivo permeable, membrana timpánica nacarada, íntegra, con triángulo luminoso."],
  ["Rinoscopía y fauces", "rinoscop|nariz|fosas nasales|fauces|faringe|garganta|amigdala|boca|orofaringe", "Fosas nasales permeables, mucosa rosada; fauces sin eritema ni exudado, amígdalas grado I."],
  ["Examen oftalmológico", "agudeza visual|fondo de ojo|ojo|pupila|campimetria|tonometria|biomicroscop|conjuntiva", "Agudeza visual 10/10 AO, conjuntivas sin inyección, córnea transparente, reflejos pupilares conservados, fondo de ojo con papila de bordes netos y relación excavación/disco 0,3."],
  ["Examen mamario", "mama|mamario", "Mamas simétricas, sin nódulos ni retracciones, sin secreción por pezón; axilas libres."],
  ["Examen ginecológico", "especulo|ginecolog|tacto vaginal|cuello uterino|anexo", "Genitales externos normales; cuello uterino sin lesiones, sin flujo patológico; útero en AVF de tamaño normal, anexos no palpables e indoloros."],
  ["Tacto rectal", "tacto rectal|prostata", "Esfínter normotónico, ampolla rectal con materia fecal de características normales, sin masas; próstata de tamaño normal, elástica, surco conservado."],
];

const NORMALES_ESTUDIOS: [string, string, string][] = [
  ["Hemograma", "hemograma|globulos|hemoglobina|hematocrito|leucocitos|plaquetas|recuento", "Hb 13,8 g/dL, Hto 41 %, VCM 88 fL, GB 7.200/mm³ (N 62 %, L 30 %), plaquetas 245.000/mm³."],
  ["Glucemia", "glucemia|glucosa", "Glucemia en ayunas 88 mg/dL."],
  ["Función renal", "urea|creatinina|funcion renal|filtrado|tfg", "Urea 32 mg/dL, creatinina 0,86 mg/dL, TFG (CKD-EPI) > 90 mL/min/1,73 m²."],
  ["Ionograma", "ionograma|sodio|potasio|electrolit|cloro", "Na 140 mEq/L, K 4,2 mEq/L, Cl 102 mEq/L."],
  ["Hepatograma", "hepatograma|transaminasas|got|gpt|bilirrubina|fal|fosfatasa|ggt|hepatico", "GOT 22 U/L, GPT 25 U/L, FAL 85 U/L, GGT 30 U/L, bilirrubina total 0,7 mg/dL, albúmina 4,2 g/dL."],
  ["Coagulograma", "coagulograma|tp|kptt|rin|quick|coagulacion", "TP 95 %, RIN 1,0, KPTT 30 s."],
  ["Reactantes de fase aguda", "pcr|proteina c|eritrosedimentacion|vsg|eritro", "PCR 3 mg/L, eritrosedimentación 10 mm/1.ª h."],
  ["Perfil lipídico", "lipid|colesterol|trigliceridos|hdl|ldl", "Colesterol total 185 mg/dL, LDL 110 mg/dL, HDL 52 mg/dL, triglicéridos 115 mg/dL."],
  ["Perfil tiroideo", "tsh|t4|tiroide", "TSH 2,1 µUI/mL, T4 libre 1,2 ng/dL."],
  ["HbA1c", "hba1c|hemoglobina glicosilada|glicada", "HbA1c 5,3 %."],
  ["Orina completa", "orina|sedimento|urinalisis", "Orina amarilla, límpida, densidad 1.018, pH 6; sin proteínas, glucosa ni cetonas; sedimento: 1-2 leucocitos/campo, 0-1 hematíes/campo, sin cilindros."],
  ["Urocultivo", "urocultivo", "Urocultivo negativo (< 10.000 UFC/mL)."],
  ["Hemocultivos", "hemocultivo", "Hemocultivos x2: sin desarrollo a las 72 h."],
  ["Gases en sangre", "gases|gasometria|eab|estado acido", "pH 7,40, pCO2 40 mmHg, pO2 92 mmHg, HCO3 24 mEq/L, EB 0, SatO2 97 % (aire ambiente)."],
  ["Lactato", "lactato|acido lactico", "Lactato 1,1 mmol/L."],
  ["Troponina", "troponina|enzimas cardiacas|cpk|biomarcador", "Troponina T ultrasensible 6 ng/L (< 14); CPK 110 U/L."],
  ["Dímero D", "dimero", "Dímero D 280 ng/mL (< 500)."],
  ["NT-proBNP", "bnp|probnp|peptido natriuretico", "NT-proBNP 60 pg/mL."],
  ["Amilasa/lipasa", "amilasa|lipasa", "Amilasa 70 U/L, lipasa 35 U/L."],
  ["Electrocardiograma", "ecg|electrocardiograma", "Ritmo sinusal, FC 72 lpm, eje +60°, PR 160 ms, QRS 90 ms, QTc 410 ms, sin alteraciones de ST-T."],
  ["Radiografía de tórax", "radiografia de torax|rx de torax|rx torax|placa de torax|radiografia|rx", "Rx tórax PA: campos pulmonares bien expandidos sin infiltrados, senos costofrénicos libres, índice cardiotorácico < 0,5, mediastino centrado."],
  ["Ecografía abdominal", "ecografia abdominal|eco abdominal|ecografia|eco", "Hígado de tamaño y ecoestructura conservados, vía biliar no dilatada, vesícula alitiásica de paredes finas, páncreas y bazo sin alteraciones, riñones de tamaño normal sin dilatación pielocalicial, sin líquido libre."],
  ["Ecocardiograma", "ecocardiograma|ecocardio|eco doppler cardiaco", "Cavidades de dimensiones normales, FEVI 62 %, sin trastornos de motilidad, válvulas sin alteraciones significativas, sin derrame pericárdico."],
  ["Tomografía", "tomografia|tac|tc ", "TC sin hallazgos patológicos en la región estudiada."],
  ["Resonancia", "resonancia|rmn|rm ", "RM sin hallazgos patológicos en la región estudiada."],
  ["Espirometría", "espirometria", "FVC 98 % del teórico, FEV1 96 %, FEV1/FVC 0,82; sin respuesta significativa a broncodilatador."],
  ["Serologías", "serologia|hiv|vih|vdrl|hepatitis b|hepatitis c|hbsag", "VIH no reactivo, VDRL no reactiva, HBsAg negativo, anti-HCV negativo."],
  ["Test de embarazo", "embarazo|beta hcg|subunidad beta|bhcg", "Subunidad beta de hCG cuantitativa: < 5 mUI/mL (negativa)."],
  ["Ferritina y metabolismo del hierro", "ferritina|ferremia|hierro|transferrina|saturacion de transferrina", "Ferremia 95 µg/dL, ferritina 80 ng/mL, saturación de transferrina 30 %."],
  ["Vitamina B12 y ácido fólico", "b12|cobalamina|folico|folato", "Vitamina B12 450 pg/mL, ácido fólico 9 ng/mL."],
  ["Punción lumbar / LCR", "puncion lumbar|lcr|liquido cefalorraquideo", "LCR claro, presión de apertura 14 cmH2O, células 2/mm³, proteínas 35 mg/dL, glucorraquia 60 mg/dL (65 % de la glucemia)."],
  ["Factor reumatoideo / anti-CCP / FAN", "factor reumatoideo|anti ccp|fan|anticuerpos|autoinmun", "FR negativo, anti-CCP negativo, FAN negativo."],
  ["Ácido úrico", "acido urico|uricemia", "Uricemia 5,2 mg/dL."],
  ["Hisopado / test rápido", "hisopado|test rapido|antigeno|pcr para", "Test rápido negativo."],
];

function respuestaConNormales(items: Item[], normales: [string, string, string][], pedido: string, vacio: string) {
  const hits = items.filter((i) => coincide(pedido, i[1]));
  const cubierto = hits.map((h) => h[1].replace(/\|/g, " ")).join(" ");
  const extra = normales.filter(([, c]) => coincide(pedido, c) && !coincide(cubierto, c));
  const out = [...hits.map((h) => `**${h[0]}:** ${h[2]}`), ...extra.map(([n, , t]) => `**${n}:** ${t}`)];
  return out.length ? out.join("\n\n") : vacio;
}

export function responderSolicitud(b: CasoBanco, etapa: "examen" | "estudios", pedido: string) {
  if (etapa === "examen") {
    const items: Item[] = [["Signos vitales", "signos vitales|tension arterial|presion|frecuencia|temperatura|saturacion|spo2|oximetria|vitales|peso|talla", b.vitales, 1], ...b.ex];
    return respuestaConNormales(items, NORMALES_EXAMEN, pedido, "Especificá qué maniobra o región querés examinar (por ej.: auscultación cardíaca, abdomen, examen neurológico).");
  }
  return respuestaConNormales(b.est, NORMALES_ESTUDIOS, pedido, "Especificá qué estudio querés pedir (por ej.: hemograma, ECG, Rx de tórax, orina completa).");
}

/* ───── Devolución ───── */

function evaluarItems(nombre: string, items: Item[], texto: string, extra: string[] = []): FeedbackEtapa {
  const esenciales = items.filter((i) => i[3] === 1);
  const hechos = esenciales.filter((i) => extra.includes(i[0]) || coincide(texto, i[1]));
  const otros = items.filter((i) => i[3] !== 1 && (extra.includes(i[0]) || coincide(texto, i[1])));
  const faltan = esenciales.filter((i) => !hechos.includes(i));
  const puntaje = esenciales.length ? Math.round((hechos.length / esenciales.length) * 100) : 100;
  return {
    etapa: nombre,
    puntaje,
    bienHecho: [...hechos, ...otros].map((i) => i[0]),
    errores: [],
    faltoRealizar: faltan.map((i) => i[0]),
    aEvitar: [],
    comentario:
      puntaje >= 75
        ? "Muy buena recolección de datos: cubriste la mayoría de los puntos clave."
        : puntaje >= 50
          ? "Recolección aceptable, pero faltaron datos importantes para orientar el diagnóstico."
          : "Faltaron muchos datos clave. Repasá la semiología dirigida a este motivo de consulta.",
  };
}

function evaluarClaves(nombre: string, claves: Clave[], texto: string): FeedbackEtapa {
  const hechos = claves.filter((c) => coincide(texto, c[1]));
  const puntaje = claves.length ? Math.round((hechos.length / claves.length) * 100) : 100;
  return {
    etapa: nombre,
    puntaje: texto.trim() ? puntaje : 0,
    bienHecho: hechos.map((c) => c[0]),
    errores: [],
    faltoRealizar: claves.filter((c) => !hechos.includes(c)).map((c) => c[0]),
    aEvitar: [],
    comentario: texto.trim() ? "Comparado con la conducta recomendada por las guías nacionales." : "No completaste esta etapa.",
  };
}

export function evaluar(
  b: CasoBanco,
  r: { transcripcion?: string; hipotesis?: string; anamnesisIds: string[]; examenFisico: SolicitudEtapa[]; estudios: SolicitudEtapa[]; diagnostico: string; tratamiento: string; seguimiento: string },
): Feedback {
  const anam = evaluarItems("Anamnesis", itemsAnamnesis(b), "", r.anamnesisIds);
  const ex = evaluarItems("Examen físico", b.ex, r.examenFisico.map((s) => s.pedido).join(" . "));
  const est = evaluarItems("Estudios complementarios", b.est, r.estudios.map((s) => s.pedido).join(" . "));

  const dxOk = coincide(r.diagnostico, b.dxClaves);
  const difsHit = b.difs.filter((d) => coincide(r.diagnostico, d[1]));
  const dxPuntaje = Math.min(100, (dxOk ? 70 : 0) + Math.round(Math.min(1, difsHit.length / 2) * 30));
  const dx: FeedbackEtapa = {
    etapa: "Diagnóstico presuntivo",
    puntaje: dxPuntaje,
    bienHecho: [...(dxOk ? ["Diagnóstico presuntivo correcto"] : []), ...difsHit.map((d) => `Diferencial mencionado: ${d[0]}`)],
    errores: dxOk ? [] : [`El diagnóstico planteado no coincide con el cuadro. El diagnóstico era: ${b.dx}.`],
    faltoRealizar: b.difs.filter((d) => !difsHit.includes(d)).map((d) => `Diferencial: ${d[0]}`),
    aEvitar: [],
    comentario: dxOk ? "Llegaste al diagnóstico correcto." : "Revisá qué datos de la anamnesis y el examen orientaban al diagnóstico.",
  };

  const trat = evaluarClaves("Tratamiento", b.trat, r.tratamiento);
  trat.aEvitar = b.evitar;
  const seg = evaluarClaves("Seguimiento", b.seg, r.seguimiento);

   const etapas = [anam, ex, est, dx, trat, seg];
   const pesos = [0.25, 0.2, 0.2, 0.25, 0.05, 0.05];
  const global = Math.round(etapas.reduce((s, e, i) => s + e.puntaje * (pesos[i] ?? 0), 0));

  const debil = [...etapas].sort((a, c) => a.puntaje - c.puntaje).slice(0, 2);
  return {
    puntajeGlobal: global,
    diagnosticoCorrecto: b.dx,
    resumenGlobal:
      global >= 75
        ? "Muy buen desempeño: tu razonamiento clínico siguió las recomendaciones de las guías nacionales."
        : global >= 50
          ? "Desempeño aceptable, con puntos a reforzar en la recolección y el análisis de datos."
          : "Desempeño por debajo de lo esperado: conviene repasar el abordaje de este cuadro.",
    etapas,
    guiasUtilizadas: b.guias,
    proximosPasos: [
      ...debil.map((e) => `Reforzá la etapa "${e.etapa}" (${e.puntaje}/100).`),
      "Repetí el caso desde 'Mis casos anteriores' para mejorar tu puntaje.",
    ],
  };
}
