import { z } from "zod";

import type { Caso, Dificultad, Feedback, SolicitudEtapa } from "@/lib/simulacion-tipos";

export type RegistroCaso = {
  id: string;
  fecha: string;
  aparato: string;
  aparatoNombre: string;
  dificultad: Dificultad;
  caso: Caso;
  respuestas: {
    anamnesis: string;
    examenFisico: SolicitudEtapa[];
    estudios: SolicitudEtapa[];
    diagnostico: string;
    tratamiento: string;
    seguimiento: string;
  };
  feedback: Feedback;
};

const solicitudSchema = z.object({
  pedido: z.string(),
  hallazgo: z.string(),
});

const feedbackEtapaSchema = z.object({
  etapa: z.string(),
  puntaje: z.number(),
  bienHecho: z.array(z.string()),
  errores: z.array(z.string()),
  faltoRealizar: z.array(z.string()),
  aEvitar: z.array(z.string()),
  comentario: z.string(),
});

export const registroCasoSchema = z.object({
  id: z.string().min(1),
  fecha: z.string().min(1),
  aparato: z.string().min(1),
  aparatoNombre: z.string().min(1),
  dificultad: z.enum(["baja", "moderada", "dificil"]),
  caso: z.object({
    bancoId: z.string().optional(),
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
  }),
  respuestas: z.object({
    anamnesis: z.string(),
    examenFisico: z.array(solicitudSchema),
    estudios: z.array(solicitudSchema),
    diagnostico: z.string(),
    tratamiento: z.string(),
    seguimiento: z.string(),
  }),
  feedback: z.object({
    puntajeGlobal: z.number(),
    diagnosticoCorrecto: z.string(),
    resumenGlobal: z.string(),
    etapas: z.array(feedbackEtapaSchema),
    guiasUtilizadas: z.array(z.string()),
    proximosPasos: z.array(z.string()),
  }),
});

const CLAVE = "simulador-historial-v1";
const MAX_REGISTROS = 50;

export function validarListaHistorial(raw: unknown): RegistroCaso[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && "registros" in raw && Array.isArray((raw as { registros: unknown }).registros)
      ? (raw as { registros: unknown[] }).registros
      : [];
  const validos: RegistroCaso[] = [];
  for (const item of arr) {
    const parsed = registroCasoSchema.safeParse(item);
    if (parsed.success) validos.push(parsed.data as RegistroCaso);
  }
  return validos.slice(0, MAX_REGISTROS);
}

export function leerHistorial(): RegistroCaso[] {
  if (typeof window === "undefined") return [];
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) return [];
    return validarListaHistorial(JSON.parse(texto));
  } catch {
    return [];
  }
}

export function guardarRegistro(r: Omit<RegistroCaso, "id" | "fecha">): void {
  const nuevo: RegistroCaso = {
    ...r,
    id: crypto.randomUUID(),
    fecha: new Date().toISOString(),
  };
  const lista = [nuevo, ...leerHistorial()].slice(0, MAX_REGISTROS);
  localStorage.setItem(CLAVE, JSON.stringify(lista));
}

export function borrarRegistro(id: string): void {
  localStorage.setItem(CLAVE, JSON.stringify(leerHistorial().filter((r) => r.id !== id)));
}

export function limpiarHistorial(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLAVE);
}

export function obtenerRegistro(id: string): RegistroCaso | undefined {
  return leerHistorial().find((r) => r.id === id);
}

export function exportarHistorialJson(): string {
  return JSON.stringify(
    { version: 1, exportadoEn: new Date().toISOString(), registros: leerHistorial() },
    null,
    2,
  );
}

export function importarHistorialJson(jsonTexto: string): { agregados: number; total: number } {
  const parsed: unknown = JSON.parse(jsonTexto);
  const entrantes = validarListaHistorial(parsed);
  if (entrantes.length === 0) {
    throw new Error("El archivo no contiene casos válidos.");
  }
  const actuales = leerHistorial();
  const idsExistentes = new Set(actuales.map((r) => r.id));
  const nuevos = entrantes.filter((r) => !idsExistentes.has(r.id));
  const combinados = [...nuevos, ...actuales]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, MAX_REGISTROS);
  localStorage.setItem(CLAVE, JSON.stringify(combinados));
  return { agregados: nuevos.length, total: combinados.length };
}
