import type { RegistroCaso } from "@/lib/historial";
import type { Dificultad } from "@/lib/simulacion-tipos";

export type ResumenGrupo = {
  id: string;
  nombre: string;
  cantidad: number;
  promedio: number;
};

export type Estadisticas = {
  total: number;
  casosUnicos: number;
  promedioGlobal: number;
  mejorPuntaje: number;
  porAparato: ResumenGrupo[];
  porDificultad: ResumenGrupo[];
};

const NOMBRES_DIF: Record<Dificultad, string> = {
  baja: "Baja",
  moderada: "Moderada",
  dificil: "Difícil",
};

export function calcularEstadisticas(lista: RegistroCaso[]): Estadisticas {
  if (lista.length === 0) {
    return {
      total: 0,
      casosUnicos: 0,
      promedioGlobal: 0,
      mejorPuntaje: 0,
      porAparato: [],
      porDificultad: [],
    };
  }

  let sumaGlobal = 0;
  let mejor = 0;
  const unicos = new Set<string>();
  const mapaAparato = new Map<string, { nombre: string; suma: number; count: number }>();
  const mapaDif = new Map<Dificultad, { suma: number; count: number }>();

  for (const r of lista) {
    const p = r.feedback.puntajeGlobal;
    sumaGlobal += p;
    if (p > mejor) mejor = p;
    unicos.add(r.caso.bancoId ?? r.caso.guionOculto.diagnosticoFinal);

    const ap = mapaAparato.get(r.aparato) ?? { nombre: r.aparatoNombre, suma: 0, count: 0 };
    ap.suma += p;
    ap.count += 1;
    mapaAparato.set(r.aparato, ap);

    const df = mapaDif.get(r.dificultad) ?? { suma: 0, count: 0 };
    df.suma += p;
    df.count += 1;
    mapaDif.set(r.dificultad, df);
  }

  const porAparato: ResumenGrupo[] = Array.from(mapaAparato.entries())
    .map(([id, v]) => ({
      id,
      nombre: v.nombre,
      cantidad: v.count,
      promedio: Math.round(v.suma / v.count),
    }))
    .sort((a, b) => a.promedio - b.promedio);

  const ordenDif: Dificultad[] = ["baja", "moderada", "dificil"];
  const porDificultad: ResumenGrupo[] = ordenDif
    .filter((d) => mapaDif.has(d))
    .map((d) => {
      const v = mapaDif.get(d)!;
      return {
        id: d,
        nombre: NOMBRES_DIF[d],
        cantidad: v.count,
        promedio: Math.round(v.suma / v.count),
      };
    });

  return {
    total: lista.length,
    casosUnicos: unicos.size,
    promedioGlobal: Math.round(sumaGlobal / lista.length),
    mejorPuntaje: Math.round(mejor),
    porAparato,
    porDificultad,
  };
}
