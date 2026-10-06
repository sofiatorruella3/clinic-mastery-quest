import type { Caso, Feedback, FeedbackEtapa, SolicitudEtapa } from "@/lib/simulacion-tipos";
import { BANCO_1 } from "./banco-1";
import { BANCO_2 } from "./banco-2";
import { BANCO_3 } from "./banco-3";
import { BANCO_4 } from "./banco-4";
import { BANCO_5 } from "./banco-5";
import { BANCO_6 } from "./banco-6";
import { BANCO_7 } from "./banco-7";
import { BANCO_8 } from "./banco-8";
import { evaluarEntrevista, evaluarHipotesis, RESPUESTAS_RMP } from "./objetivos-entrevista";
import type { CasoBanco, Clave, Item } from "./tipos";

export const BANCO: CasoBanco[] = [...BANCO_1, ...BANCO_2, ...BANCO_3, ...BANCO_4, ...BANCO_5, ...BANCO_6, ...BANCO_7, ...BANCO_8];

export function norm(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ");
}

export function coincide(texto: string, claves: string) {
  const t = ` ${norm(texto)} `;
  return claves.split("|").some((c) => {
    const k = norm(c).trim();
    return k.length > 0 && t.includes(` ${k}`);
  });
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

const NO_ENTIENDE = [
  "Mmm, no sé bien qué decirle, doctor/a... ¿a qué se refiere?",
  "Perdón, no le entendí bien. ¿Me lo puede preguntar de otra manera?",
  "La verdad que de eso no le sabría decir... no me fijé.",
  "Uy, no sé. ¿Eso tiene que ver con lo que me pasa?",
];
let noEntiendeIdx = 0;

export function responderPaciente(b: CasoBanco, pregunta: string): { texto: string; ids: string[] } {
  const hits = itemsAnamnesis(b).filter((i) => coincide(pregunta, i[1]));
  const charla = (b.charla ?? []).filter((i) => coincide(pregunta, i[1]));
  if (hits.length || charla.length) {
    const textos = [...hits.slice(0, 3).map((h) => h[2]), ...charla.slice(0, hits.length ? 1 : 2).map((c) => c[2])];
    return { texto: textos.join(" "), ids: hits.map((h) => h[0]) };
  }
  const rmp = RESPUESTAS_RMP.find(([c]) => coincide(pregunta, c));
  if (rmp) return { texto: rmp[1], ids: [] };
  const g = GENERICAS.find(([c]) => coincide(pregunta, c));
  if (g) return { texto: g[1], ids: [] };
  return { texto: NO_ENTIENDE[noEntiendeIdx++ % NO_ENTIENDE.length]!, ids: [] };
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

  const rmp = evaluarEntrevista(r.transcripcion ?? "");
  const hip = evaluarHipotesis(b, r.hipotesis ?? "");
  const etapas = [rmp, anam, hip, ex, est, dx, trat, seg];
  const pesos = [0.15, 0.2, 0.1, 0.15, 0.15, 0.15, 0.05, 0.05];
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
