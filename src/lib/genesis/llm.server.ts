/**
 * Server-side LLM provider abstraction. The browser never talks to a model
 * provider directly — requests always go Browser -> server function -> provider.
 *
 * Configuration is environment-driven:
 *   NVIDIA_API_KEY, NVIDIA_MODEL, NVIDIA_BASE_URL
 */

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmResult {
  text: string;
  model: string;
  tokens: number | null;
}

export interface LLMProvider {
  readonly id: string;
  readonly model: string;
  generate(messages: LlmMessage[], opts?: { temperature?: number; maxTokens?: number }): Promise<LlmResult>;
  generateStructured<T>(
    messages: LlmMessage[],
    parse: (raw: unknown) => T,
    opts?: { temperature?: number; maxTokens?: number },
  ): Promise<{ value: T; raw: LlmResult }>;
}

export class NvidiaProvider implements LLMProvider {
  readonly id = "nvidia-nim";
  constructor(
    private apiKey: string,
    readonly model: string,
    private baseUrl: string,
  ) {}

  async generate(
    messages: LlmMessage[],
    opts: { temperature?: number; maxTokens?: number } = {},
  ): Promise<LlmResult> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 1400,
        stream: false,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new LlmError(
        res.status === 401
          ? "AI provider rejected the configured credentials."
          : res.status === 429
            ? "AI provider is rate limiting requests."
            : "AI provider unavailable.",
        res.status,
        detail.slice(0, 500),
      );
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    if (!text) throw new LlmError("AI provider returned an empty response.", 502);
    return { text, model: this.model, tokens: json.usage?.total_tokens ?? null };
  }

  async generateStructured<T>(
    messages: LlmMessage[],
    parse: (raw: unknown) => T,
    opts: { temperature?: number; maxTokens?: number } = {},
  ): Promise<{ value: T; raw: LlmResult }> {
    const raw = await this.generate(
      [
        ...messages,
        {
          role: "system",
          content:
            "Respond with a single valid JSON object only. No markdown fences, no prose, no explanation outside the JSON.",
        },
      ],
      opts,
    );
    const value = parse(extractJson(raw.text));
    return { value, raw };
  }
}

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new LlmError("AI response was not valid structured output.", 422);
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new LlmError("AI response was not valid structured output.", 422);
  }
}

export interface ProviderConfig {
  configured: boolean;
  model: string;
  baseUrl: string;
}

export function readProviderConfig(): ProviderConfig {
  const key = process.env["NVIDIA_API_KEY"];
  return {
    configured: Boolean(key),
    model: process.env["NVIDIA_MODEL"] ?? "meta/llama-3.3-70b-instruct",
    baseUrl: process.env["NVIDIA_BASE_URL"] ?? "https://integrate.api.nvidia.com/v1",
  };
}

/** Returns null when the provider is not configured — callers fall back to demo mode. */
export function getProvider(): LLMProvider | null {
  const key = process.env["NVIDIA_API_KEY"];
  if (!key) return null;
  const cfg = readProviderConfig();
  return new NvidiaProvider(key, cfg.model, cfg.baseUrl);
}
