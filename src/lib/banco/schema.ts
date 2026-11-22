import { z } from "zod";

const itemSchema = z.union([
  z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
  z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.literal(1).optional()]),
]);

const claveSchema = z.tuple([z.string().min(1), z.string().min(1)]);

export const casoBancoSchema = z.object({
  id: z.string().min(1),
  aparato: z.string().min(1),
  dificultad: z.enum(["baja", "moderada", "dificil"]),
  titulo: z.string().min(1),
  ambito: z.string().min(1),
  motivo: z.string().min(1),
  paciente: z.object({
    nombre: z.string().min(1),
    edad: z.string().min(1),
    sexo: z.string().min(1),
    ocupacion: z.string().min(1),
    apariencia: z.string().min(1),
  }),
  vitales: z.string().min(1),
  dx: z.string().min(1),
  dxClaves: z.string().min(1),
  difs: z.array(claveSchema),
  anam: z.array(itemSchema).min(1),
  charla: z.array(itemSchema).optional(),
  personalidad: z.enum(["verboso", "laconico", "ansioso", "despistado"]).optional(),
  ex: z.array(itemSchema).min(1),
  est: z.array(itemSchema).min(1),
  trat: z.array(claveSchema).min(1),
  seg: z.array(claveSchema).min(1),
  evitar: z.array(z.string().min(1)),
  peligros: z.array(claveSchema).optional(),
  guias: z.array(z.string().min(1)).min(1),
});
