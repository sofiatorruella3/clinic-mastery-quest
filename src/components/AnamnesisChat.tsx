import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import type { Caso } from "@/lib/simulacion-tipos";

export function textoDeMensaje(m: UIMessage) {
  return m.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join(" ")
    .trim();
}

export function AnamnesisChat({
  caso,
  onTranscripcion,
}: {
  caso: Caso;
  onTranscripcion: (texto: string) => void;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/anamnesis",
        body: { caso },
      }),
    [caso],
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const texto = messages
      .map(
        (m) =>
          `${m.role === "user" ? "Estudiante" : "Paciente"}: ${textoDeMensaje(m)}`,
      )
      .filter((l) => l.split(": ")[1])
      .join("\n");
    onTranscripcion(texto);
  }, [messages, onTranscripcion]);

  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status]);

  return (
    <div className="card-clinica flex h-[min(62vh,560px)] flex-col overflow-hidden">
      <div className="border-b border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">
        Consultorio · hablás directamente con {caso.paciente.nombre}
      </div>
      <Conversation className="flex-1">
        <ConversationContent className="gap-4">
          {messages.length === 0 && (
            <div className="mx-auto max-w-md py-10 text-center text-sm text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">
                {caso.paciente.nombre} entra al consultorio.
              </p>
              <p>
                Presentate y empezá la entrevista. El paciente solo responde lo que le
                preguntás.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                <MessageResponse>{textoDeMensaje(m)}</MessageResponse>
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <Shimmer className="px-1 text-sm">El paciente piensa...</Shimmer>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-3">
        <PromptInput
          onSubmit={(message, event) => {
            const texto = message.text?.trim();
            if (!texto || status === "streaming" || status === "submitted") return;
            sendMessage({ text: texto });
            event.currentTarget.reset();
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            autoFocus
            placeholder="¿Qué le preguntás al paciente?"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
