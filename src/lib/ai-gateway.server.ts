import { createOpenAI } from "@ai-sdk/openai";

/**
 * Captura y reenvía el header X-Lovable-AIG-Run-ID entre llamadas del gateway.
 */
export function createLovableAiGatewayRunIdFetch(initialRunId?: string | null) {
  let runId: string | null = initialRunId ?? null;

  const wrapped: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
    const response = await fetch(input as RequestInfo, { ...init, headers });
    const returned = response.headers.get("X-Lovable-AIG-Run-ID");
    if (returned) runId = returned;
    return response;
  };

  return {
    fetch: wrapped,
    get runId() {
      return runId;
    },
  };
}

export function getLovableApiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta LOVABLE_API_KEY");
  return key;
}

export function createResponsesModel() {
  const key = getLovableApiKey();
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch,
  });
  return { model: lovable.responses("openai/gpt-6-astra"), runIdFetch };
}

export const razonamiento = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;
