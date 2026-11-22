import { describe, expect, it } from "vitest";

import { validarListaHistorial } from "./historial";

const registroValido = {
  id: "abc-123",
  fecha: "2026-11-22T18:00:00.000Z",
  aparato: "cardiovascular",
  aparatoNombre: "Cardiovascular",
  dificultad: "baja",
  caso: {
    bancoId: "cv-baja",
    titulo: "Dolor precordial",
    ambito: "Guardia",
    motivoConsulta: "Me duele el pecho",
    paciente: {
      nombre: "Roberto",
      edad: "58",
      sexo: "masculino",
      ocupacion: "taxista",
      apariencia: "sudoroso",
    },
    signosVitales: "TA 150/95",
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
    diagnostico: "IAM",
    tratamiento: "",
    seguimiento: "",
  },
  feedback: {
    puntajeGlobal: 80,
    diagnosticoCorrecto: "IAM",
    resumenGlobal: "Muy bien",
    etapas: [],
    guiasUtilizadas: ["SAC"],
    proximosPasos: [],
  },
};

describe("validarListaHistorial", () => {
  it("acepta un array válido y descarta entradas corruptas sin fallar", () => {
    const res = validarListaHistorial([registroValido, { corrupto: true }, null, "texto"]);
    expect(res).toHaveLength(1);
    expect(res[0]?.id).toBe("abc-123");
  });

  it("acepta el formato versionado con { version, registros }", () => {
    const res = validarListaHistorial({ version: 1, registros: [registroValido] });
    expect(res).toHaveLength(1);
  });

  it("devuelve lista vacía si el dato no es válido", () => {
    expect(validarListaHistorial(null)).toEqual([]);
    expect(validarListaHistorial("basura")).toEqual([]);
    expect(validarListaHistorial({})).toEqual([]);
  });
});
