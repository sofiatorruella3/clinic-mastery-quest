import type { Caso, Feedback, FeedbackEtapa, SolicitudEtapa } from "@/lib/simulacion-tipos";
import { BANCO_1 } from "./banco-1";
import { BANCO_2 } from "./banco-2";
import { BANCO_3 } from "./banco-3";
import { BANCO_4 } from "./banco-4";
import type { CasoBanco, Clave, Item } from "./tipos";

export const BANCO: CasoBanco[] = [...BANCO_1, ...BANCO_2, ...BANCO_3, ...BANCO_4];

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
  ["hola|buen dia|buenas|soy el|soy la|mucho gusto", "Hola, doctor/a."],
];

export function responderPaciente(b: CasoBanco, pregunta: string): { texto: string; ids: string[] } {
  const hits = itemsAnamnesis(b).filter((i) => coincide(pregunta, i[1]));
  if (hits.length) {
    return { texto: hits.slice(0, 3).map((h) => h[2]).join(" "), ids: hits.map((h) => h[0]) };
  }
  const g = GENERICAS.find(([c]) => coincide(pregunta, c));
  if (g) return { texto: g[1], ids: [] };
  return { texto: "No sé bien qué contestarle, doctor/a... ¿me lo pregunta de otra forma?", ids: [] };
}

/* ───── Examen y estudios ───── */

export function responderSolicitud(b: CasoBanco, etapa: "examen" | "estudios", pedido: string) {
  const items: Item[] =
    etapa === "examen"
      ? [["Signos vitales", "signos vitales|tension arterial|presion|frecuencia|temperatura|saturacion|spo2|oximetria|vitales|peso|talla", b.vitales, 1], ...b.ex]
      : b.est;
  const hits = items.filter((i) => coincide(pedido, i[1]));
  if (!hits.length) {
    return etapa === "examen"
      ? "Sin hallazgos patológicos en lo solicitado."
      : "Resultado dentro de parámetros normales / sin hallazgos relevantes para este cuadro.";
  }
  return hits.map((h) => `**${h[0]}:** ${h[2]}`).join("\n\n");
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
  r: { anamnesisIds: string[]; examenFisico: SolicitudEtapa[]; estudios: SolicitudEtapa[]; diagnostico: string; tratamiento: string; seguimiento: string },
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
  const pesos = [0.25, 0.2, 0.2, 0.2, 0.075, 0.075];
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
