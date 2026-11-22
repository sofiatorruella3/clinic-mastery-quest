import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { responderPaciente } from "@/lib/banco/motor";
import type { CasoBanco } from "@/lib/banco/tipos";
import { cn } from "@/lib/utils";

type Msg = { de: "medico" | "paciente"; texto: string };

export function AnamnesisChat({
  banco,
  onTranscripcion,
  modoExamen = false,
}: {
  banco: CasoBanco;
  onTranscripcion: (texto: string, ids: string[]) => void;
  modoExamen?: boolean;
}) {
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const finRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onTranscripcion(
      mensajes.map((m) => `${m.de === "medico" ? "Estudiante" : "Paciente"}: ${m.texto}`).join("\n"),
      ids,
    );
    finRef.current?.scrollIntoView({ block: "nearest" });
  }, [mensajes, ids, onTranscripcion]);

  const enviar = () => {
    const q = texto.trim();
    if (!q) return;
    const r = responderPaciente(banco, q);
    setMensajes((p) => [...p, { de: "medico", texto: q }, { de: "paciente", texto: r.texto }]);
    setIds((p) => Array.from(new Set([...p, ...r.ids])));
    setTexto("");
  };

  return (
    <div className="card-clinica flex h-[min(62vh,560px)] flex-col overflow-hidden">
      <div className="border-b border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">
        Consultorio · el paciente responde según el tema que le preguntes
      </div>
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversación con el paciente"
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {mensajes.length === 0 && (
          <div className="mx-auto max-w-md py-10 text-center text-sm text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">Un paciente entra al consultorio.</p>
            {!modoExamen && (
              <p>Preguntá una cosa por vez: nombre, edad, qué le pasa, desde cuándo, cómo es el dolor, antecedentes, medicación...</p>
            )}
          </div>
        )}
        {mensajes.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed",
              m.de === "medico" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            )}
          >
            {m.texto}
          </div>
        ))}
        <div ref={finRef} />
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          rows={2}
          aria-label="Pregunta al paciente"
          placeholder="¿Qué le preguntás al paciente?"
          className="resize-none"
        />
        <Button onClick={enviar} disabled={!texto.trim()} aria-label="Enviar">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
