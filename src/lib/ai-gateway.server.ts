import { createOpenAI } from "@ai-sdk/openai";

/**
 * Proveedor de IA del simulador.
 * Usa la clave propia de OpenAI del usuario (OPENAI_API_KEY),
 * así el uso se factura directo a su cuenta de OpenAI
 * y no consume créditos de Lovable.
 */
export function createResponsesModel() {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("Falta configurar OPENAI_API_KEY");
  const openai = createOpenAI({ apiKey: key });
  return { model: openai.responses("gpt-5-mini") };
}

export const razonamiento = {
  openai: {
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;
