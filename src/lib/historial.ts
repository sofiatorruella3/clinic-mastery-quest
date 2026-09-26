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

const CLAVE = "simulador-historial-v1";

export function leerHistorial(): RegistroCaso[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CLAVE) ?? "[]") as RegistroCaso[];
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
  const lista = [nuevo, ...leerHistorial()].slice(0, 50);
  localStorage.setItem(CLAVE, JSON.stringify(lista));
}

export function borrarRegistro(id: string): void {
  localStorage.setItem(CLAVE, JSON.stringify(leerHistorial().filter((r) => r.id !== id)));
}

export function obtenerRegistro(id: string): RegistroCaso | undefined {
  return leerHistorial().find((r) => r.id === id);
}
