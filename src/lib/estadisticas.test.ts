import { describe, expect, it } from "vitest";

import { calcularEstadisticas } from "./estadisticas";
import type { RegistroCaso } from "./historial";

function crearRegistro(overrides: Partial<RegistroCaso> & { puntaje: number; bancoId?: string }): RegistroCaso {
  const { puntaje, bancoId = "cv-baja", ...rest } = overrides;
  return {
    id: crypto.randomUUID(),
    fecha: "2026-11-22T18:00:00.000Z",
    aparato: "cardiovascular",
    aparatoNombre: "Cardiovascular",
    dificultad: "baja",
    caso: {
      bancoId,
      titulo: "Caso",
      ambito: "Guardia",
      motivoConsulta: "Dolor",
      paciente: { nombre: "Juan", edad: "50", sexo: "masculino", ocupacion: "docente", apariencia: "regular" },
      signosVitales: "TA 120/80",
      guionOculto: {
        diagnosticoFinal: "IAM",
        historiaCompleta: "",
        hallazgosExamenFisico: "",
        resultadosEstudios: "",
        conductaEsperada: "",
        diferenciales: "",
        personalidad: "",
      },
    },
    respuestas: {
      anamnesis: "",
      examenFisico: [],
      estudios: [],
      diagnostico: "",
      tratamiento: "",
      seguimiento: "",
    },
    feedback: {
      puntajeGlobal: puntaje,
      diagnosticoCorrecto: "IAM",
      resumenGlobal: "",
      etapas: [],
      guiasUtilizadas: [],
      proximosPasos: [],
    },
    ...rest,
  };
}

describe("calcularEstadisticas", () => {
  it("maneja historial vacío", () => {
    const e = calcularEstadisticas([]);
    expect(e.total).toBe(0);
    expect(e.promedioGlobal).toBe(0);
    expect(e.porAparato).toEqual([]);
  });

  it("calcula promedios globales, por aparato y por dificultad", () => {
    const lista = [
      crearRegistro({ aparato: "cardiovascular", aparatoNombre: "Cardiovascular", dificultad: "baja", puntaje: 80, bancoId: "cv-1" }),
      crearRegistro({ aparato: "cardiovascular", aparatoNombre: "Cardiovascular", dificultad: "dificil", puntaje: 60, bancoId: "cv-1" }),
      crearRegistro({ aparato: "respiratorio", aparatoNombre: "Respiratorio", dificultad: "baja", puntaje: 100, bancoId: "resp-1" }),
    ];
    const e = calcularEstadisticas(lista);
    expect(e.total).toBe(3);
    expect(e.casosUnicos).toBe(2);
    expect(e.promedioGlobal).toBe(80);
    expect(e.mejorPuntaje).toBe(100);
    // Ordenado de menor a mayor promedio para detectar áreas a reforzar
    expect(e.porAparato[0]?.id).toBe("cardiovascular");
    expect(e.porAparato[0]?.promedio).toBe(70);
    expect(e.porAparato[1]?.id).toBe("respiratorio");
    expect(e.porAparato[1]?.promedio).toBe(100);
    expect(e.porDificultad.map((d) => d.id)).toEqual(["baja", "dificil"]);
  });
});
