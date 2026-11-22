import { describe, expect, it } from "vitest";

import { afirma, BANCO, buscarCaso, coincide, elegirCaso, evaluar, responderPaciente } from "./motor";

const entradaVacia = {
  anamnesisIds: [] as string[],
  examenFisico: [],
  estudios: [],
  diagnostico: "",
  tratamiento: "",
  seguimiento: "",
};

describe("afirma (detección de negaciones)", () => {
  it("cuenta menciones afirmativas", () => {
    expect(afirma("Infarto agudo de miocardio", "infarto|iam")).toBe(true);
    expect(afirma("Indicaría aspirina y heparina", "aspirina")).toBe(true);
  });

  it("ignora menciones negadas", () => {
    expect(afirma("no creo que sea un infarto", "infarto|iam")).toBe(false);
    expect(afirma("descarto infarto", "infarto")).toBe(false);
    expect(afirma("sin aspirina", "aspirina")).toBe(false);
    expect(afirma("evitar AINEs", "aine")).toBe(false);
  });

  it("la negación no arrastra a otra cláusula ni a otra afirmación", () => {
    expect(afirma("No es una angina sino un infarto", "infarto")).toBe(true);
    expect(afirma("No es infarto, es una pericarditis", "pericarditis")).toBe(true);
    expect(afirma("sin contraindicaciones dar aspirina", "aspirina")).toBe(true);
  });

  it("es consistente con coincide cuando no hay negación", () => {
    for (const [texto, claves] of [
      ["ECG y troponina", "ecg|electro"],
      ["hemograma completo", "hemograma"],
    ] as const) {
      expect(afirma(texto, claves)).toBe(coincide(texto, claves));
    }
  });
});

describe("evaluar", () => {
  const caso = buscarCaso("cv-baja")!;

  it("el caso de ejemplo existe", () => {
    expect(caso).toBeDefined();
  });

  it("da puntaje de diagnóstico al diagnóstico correcto", () => {
    const f = evaluar(caso, { ...entradaVacia, diagnostico: "Infarto agudo de miocardio con elevación del ST" });
    expect(f.etapas.find((e) => e.etapa === "Diagnóstico presuntivo")!.puntaje).toBeGreaterThanOrEqual(70);
  });

  it("no da puntaje de diagnóstico si el diagnóstico correcto está negado", () => {
    const f = evaluar(caso, { ...entradaVacia, diagnostico: "no es un infarto, es una pericarditis" });
    const dx = f.etapas.find((e) => e.etapa === "Diagnóstico presuntivo")!;
    expect(dx.errores.length).toBeGreaterThan(0);
    expect(dx.puntaje).toBeLessThan(70);
  });

  it("penaliza conductas peligrosas definidas en el caso", () => {
    const disec = buscarCaso("cv-dificil")!;
    expect(disec.peligros?.length).toBeGreaterThan(0);
    const limpio = evaluar(disec, { ...entradaVacia, tratamiento: "control del dolor y betabloqueo, cirugía cardiovascular" });
    const peligroso = evaluar(disec, { ...entradaVacia, tratamiento: "control del dolor, heparina y aspirina" });
    const tl = limpio.etapas.find((e) => e.etapa === "Tratamiento")!;
    const tp = peligroso.etapas.find((e) => e.etapa === "Tratamiento")!;
    expect(tp.errores.length).toBeGreaterThan(0);
    expect(tl.errores.length).toBe(0);
  });

  it("no penaliza una conducta peligrosa si el alumno la descarta", () => {
    const disec = buscarCaso("cv-dificil")!;
    const f = evaluar(disec, { ...entradaVacia, tratamiento: "no indicar heparina ni aspirina hasta descartar disección" });
    expect(f.etapas.find((e) => e.etapa === "Tratamiento")!.errores).toHaveLength(0);
  });

  it("penaliza pedir estudios en exceso", () => {
    const muchos = Array.from({ length: 20 }, (_, i) => ({ pedido: `estudio ${i}`, hallazgo: "" }));
    const f = evaluar(caso, { ...entradaVacia, estudios: muchos });
    expect(f.etapas.find((e) => e.etapa === "Estudios complementarios")!.aEvitar.length).toBeGreaterThan(0);
  });

  it("el puntaje global está entre 0 y 100", () => {
    for (const b of BANCO) {
      const f = evaluar(b, { ...entradaVacia, diagnostico: b.dx, tratamiento: b.trat.map((t) => t[0]).join(", ") });
      expect(f.puntajeGlobal).toBeGreaterThanOrEqual(0);
      expect(f.puntajeGlobal).toBeLessThanOrEqual(100);
    }
  });
});

describe("integridad del banco de casos", () => {
  it("hay casos y los ids son únicos", () => {
    expect(BANCO.length).toBeGreaterThan(0);
    const ids = BANCO.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos los casos tienen los campos obligatorios", () => {
    for (const b of BANCO) {
      const ctx = `caso ${b.id}`;
      expect(b.titulo, ctx).toBeTruthy();
      expect(b.motivo, ctx).toBeTruthy();
      expect(b.dx, ctx).toBeTruthy();
      expect(b.dxClaves, ctx).toBeTruthy();
      expect(b.anam.length, ctx).toBeGreaterThan(0);
      expect(b.ex.length, ctx).toBeGreaterThan(0);
      expect(b.est.length, ctx).toBeGreaterThan(0);
      expect(b.trat.length, ctx).toBeGreaterThan(0);
      expect(b.seg.length, ctx).toBeGreaterThan(0);
      expect(b.guias.length, ctx).toBeGreaterThan(0);
      expect(["baja", "moderada", "dificil"], ctx).toContain(b.dificultad);
    }
  });

  it("los items de anamnesis, examen y estudios tienen nombre, claves y texto", () => {
    for (const b of BANCO) {
      for (const it of [...b.anam, ...b.ex, ...b.est]) {
        expect(it[0], `caso ${b.id}`).toBeTruthy();
        expect(it[1], `caso ${b.id} / ${it[0]}`).toBeTruthy();
        expect(it[2], `caso ${b.id} / ${it[0]}`).toBeTruthy();
      }
    }
  });

  it("los peligros tienen descripción y claves", () => {
    for (const b of BANCO) {
      for (const p of b.peligros ?? []) {
        expect(p[0], `caso ${b.id}`).toBeTruthy();
        expect(p[1], `caso ${b.id}`).toBeTruthy();
      }
    }
  });

  it("el diagnóstico escrito en el caso coincide con sus propias claves", () => {
    const fallan = BANCO.filter((b) => !afirma(b.dx, b.dxClaves)).map((b) => b.id);
    expect(fallan).toEqual([]);
  });

  it("cada aparato de la interfaz tiene al menos un caso", () => {
    const aparatos = new Set(BANCO.map((b) => b.aparato));
    expect(aparatos.size).toBeGreaterThanOrEqual(13);
  });

  it("elegirCaso respeta aparato y dificultad cuando existen", () => {
    const c = elegirCaso("cardiovascular", "baja");
    expect(c?.aparato).toBe("cardiovascular");
    expect(c?.dificultad).toBe("baja");
  });

  it("el paciente siempre responde algo", () => {
    const b = BANCO[0]!;
    expect(responderPaciente(b, "xyzzy qwerty").texto.length).toBeGreaterThan(0);
  });
});
