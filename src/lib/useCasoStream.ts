import { useCallback, useRef, useState } from "react";

import type { CasoParcial } from "@/components/GeneracionCaso";
import type { Caso } from "@/lib/simulacion-tipos";

export function useCasoStream() {
  const [parcial, setParcial] = useState<CasoParcial | null>(null);
  const [caso, setCaso] = useState<Caso | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const enCurso = useRef(false);

  const generar = useCallback(async (aparato: string, dificultad: string) => {
    if (enCurso.current) return;
    enCurso.current = true;
    setGenerando(true);
    setError(null);
    setParcial(null);
    setCaso(null);

    try {
      const res = await fetch("/api/caso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aparato, dificultad }),
      });
      if (!res.ok || !res.body) throw new Error("No se pudo generar el caso");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lineas = buffer.split("\n");
        buffer = lineas.pop() ?? "";
        for (const linea of lineas) {
          if (!linea.trim()) continue;
          let dato: Record<string, unknown>;
          try {
            dato = JSON.parse(linea) as Record<string, unknown>;
          } catch {
            continue;
          }
          if (dato["__error"]) throw new Error(String(dato["__error"]));
          if (dato["__final"]) {
            setCaso(dato["__final"] as Caso);
          } else {
            setParcial(dato as CasoParcial);
          }
        }
      }
    } catch (e) {
      setError((e as Error)?.message ?? "Ocurrió un problema al crear la simulación.");
    } finally {
      setGenerando(false);
      enCurso.current = false;
    }
  }, []);

  const cargar = useCallback((c: Caso) => {
    setError(null);
    setCaso(c);
  }, []);

  const reiniciar = useCallback(() => {
    enCurso.current = false;
  }, []);

  return { parcial, caso, error, generando, generar, cargar, reiniciar };
}
