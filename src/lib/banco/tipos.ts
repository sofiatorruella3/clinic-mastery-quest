import type { Dificultad } from "@/lib/simulacion-tipos";

/** [nombre, claves separadas por "|", respuesta/hallazgo, esencial (1)] */
export type Item = [string, string, string, 1?];
/** [nombre, claves separadas por "|"] */
export type Clave = [string, string];

export type CasoBanco = {
  id: string;
  aparato: string;
  dificultad: Dificultad;
  titulo: string;
  ambito: string;
  /** Lo que dice el paciente cuando le preguntan qué le pasa */
  motivo: string;
  paciente: { nombre: string; edad: string; sexo: string; ocupacion: string; apariencia: string };
  vitales: string;
  dx: string;
  dxClaves: string;
  difs: Clave[];
  anam: Item[];
  ex: Item[];
  est: Item[];
  trat: Clave[];
  seg: Clave[];
  evitar: string[];
  guias: string[];
};
