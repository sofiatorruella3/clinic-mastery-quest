import type { CasoBanco } from "./tipos";

export type Personalidad = "verboso" | "laconico" | "ansioso" | "despistado";
const TIPOS: Personalidad[] = ["verboso", "laconico", "ansioso", "despistado"];

/** Personalidad fija por caso: usa la del caso si la define, si no se deriva del id. */
export function personalidadDe(b: CasoBanco): Personalidad {
  if (b.personalidad) return b.personalidad;
  let h = 0;
  for (const c of b.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TIPOS[h % TIPOS.length]!;
}

/** Términos técnicos → como lo diría un paciente. */
const PROFANO: [RegExp, string][] = [
  [/\bdisnea\b/gi, "ahogo"],
  [/\bortopnea\b/gi, "ahogo cuando me acuesto"],
  [/\bdolor pleur[ií]tico\b/gi, "puntada"],
  [/\bprecordialgia\b/gi, "dolor en el pecho"],
  [/\bpalpitaciones\b/gi, "el corazón que se me acelera"],
  [/\bs[ií]ncope\b/gi, "desmayo"],
  [/\blipotimia\b/gi, "que casi me desmayo"],
  [/\bhemoptisis\b/gi, "sangre al toser"],
  [/\bhematemesis\b/gi, "vómito con sangre"],
  [/\bmelena\b/gi, "materia fecal negra como alquitrán"],
  [/\bdiaforesis\b/gi, "sudor frío"],
  [/\bastenia\b/gi, "cansancio"],
  [/\bastenia y adinamia\b/gi, "cansancio, sin fuerzas"],
  [/\bcefalea\b/gi, "dolor de cabeza"],
  [/\bdisuria\b/gi, "ardor al hacer pis"],
  [/\bpolaquiuria\b/gi, "ganas de hacer pis a cada rato"],
  [/\bhematuria\b/gi, "pis con sangre"],
  [/\bpoliuria\b/gi, "orino muchísimo"],
  [/\bpolidipsia\b/gi, "tengo mucha sed"],
  [/\bprurito\b/gi, "picazón"],
  [/\bedemas?\b/gi, "hinchazón"],
  [/\bfebr[ií]cula\b/gi, "un poco de fiebre"],
  [/\bepigastralgia\b/gi, "dolor en la boca del estómago"],
  [/\bpirosis\b/gi, "acidez"],
  [/\bv[ée]rtigo\b/gi, "mareo que me da vueltas todo"],
  [/\bfotofobia\b/gi, "me molesta la luz"],
  [/\bmialgias?\b/gi, "dolor de cuerpo"],
  [/\bartralgias?\b/gi, "dolor de articulaciones"],
  [/\bepistaxis\b/gi, "sangrado por la nariz"],
  [/\bodinofagia\b/gi, "dolor al tragar"],
  [/\bdisfagia\b/gi, "me cuesta tragar"],
];

export function aProfano(t: string) {
  return PROFANO.reduce((acc, [r, s]) => acc.replace(r, s), t);
}

const TRIVIALES: Record<Personalidad, string[]> = {
  verboso: [
    "Ah, y le cuento que vine en el colectivo 60 y tardó una eternidad, ¡no sabe!",
    "Mi cuñada dice que es todo de los nervios, ella siempre tiene una opinión para todo.",
    "Una vecina me recomendó un té de boldo, ¿usted qué piensa?",
    "Mi perro, el Toto, está más preocupado que yo, no se me despega.",
    "Con el calor que hace estos días, encima, uno anda peor.",
  ],
  laconico: [],
  ansioso: [
    "¿Es algo malo, doctor/a?",
    "¿No será algo grave, no?",
    "Perdón que pregunte, pero... ¿usted me ve bien?",
    "Busqué en internet y me asusté muchísimo.",
  ],
  despistado: [
    "Bah, no sé si fue así exactamente, capaz que me confundo.",
    "En casa se acuerdan mejor que yo de esas cosas.",
    "Perdón, se me mezclan las fechas.",
  ],
};

const APERTURAS: Record<Personalidad, string[]> = {
  verboso: ["Mire, le cuento...", "Ay, doctor/a, ¿por dónde empiezo?", "Bueno, es una historia larga...", ""],
  laconico: [""],
  ansioso: ["Ay, sí...", "Mire, estoy muy nervioso/a con esto...", ""],
  despistado: ["Mmm, a ver...", "Uh, déjeme pensar...", "Eh...", ""],
};

const VAGUEDAD: [RegExp, string][] = [
  [/\bhace (\d+) d[ií]as\b/gi, "hace unos días, $1 o capaz más"],
  [/\bhace (\d+) semanas\b/gi, "hace un par de semanas, $1 o por ahí"],
  [/\bhace (\d+) meses\b/gi, "hace unos meses, $1 o capaz más"],
  [/\bhace (\d+) a[ñn]os\b/gi, "hace como $1 años, no me acuerdo bien"],
];

const PIDE_MAS = /\b(algo mas|contame mas|cuenteme mas|digame mas|y que mas|explayese|como es eso|por ejemplo|a ver|siga|segui)\b/;

/** Estado conversacional por caso (lo que el paciente lacónico se guardó). */
const pendiente = new Map<string, string>();
const contador = new Map<string, number>();

function oraciones(t: string) {
  return t.match(/[^.!?]+[.!?]+["»]?|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [t];
}

/** Aplica personalidad y lenguaje coloquial a una respuesta del paciente. */
export function conPersonalidad(b: CasoBanco, preguntaNorm: string, texto: string, abierta: boolean): string {
  const tipo = personalidadDe(b);
  const n = (contador.get(b.id) ?? 0) + 1;
  contador.set(b.id, n);
  let t = aProfano(texto);
  const pick = <T,>(arr: T[]) => arr[n % arr.length]!;

  if (tipo === "laconico") {
    const prev = pendiente.get(b.id);
    if (PIDE_MAS.test(preguntaNorm) && prev) {
      pendiente.delete(b.id);
      return prev;
    }
    const os = oraciones(t);
    if (os.length > 1) {
      pendiente.set(b.id, os.slice(1).join(" "));
      return os[0]!;
    }
    return t;
  }
  if (tipo === "despistado") {
    t = VAGUEDAD.reduce((acc, [r, s]) => acc.replace(r, s), t);
  }
  const ap = pick(APERTURAS[tipo]);
  const triv = TRIVIALES[tipo];
  const agrega = triv.length && (abierta || n % (tipo === "ansioso" ? 2 : 3) === 0);
  return [ap, t, agrega ? pick(triv) : ""].filter(Boolean).join(" ");
}

export const ETIQUETA_PERSONALIDAD: Record<Personalidad, string> = {
  verboso: "Charlatán: habla mucho y se va por las ramas",
  laconico: "Reservado: contesta corto, hay que repreguntar",
  ansioso: "Ansioso: le preocupa que sea grave",
  despistado: "Despistado: le cuesta precisar fechas",
};
