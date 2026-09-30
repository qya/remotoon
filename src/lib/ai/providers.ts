// Browser-side LLM clients with streaming support.
//
// Requests go directly from the browser to the selected provider using the
// user's own API key (BYOK). Nothing is proxied through a Remotoon server.

export type AIProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'groq'
  | 'ollama'
  | 'custom';

export type ProviderProtocol = 'openai' | 'anthropic' | 'gemini';

export interface ProviderMeta {
  id: AIProviderId;
  label: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string;
  defaultModel: string;
  suggestedModels: string[];
  needsKey: boolean;
  keyUrl?: string;
  description: string;
  baseUrlEditable: boolean;
}

// Model names change often. These are suggestions only; the settings modal
// can fetch the live model list from each provider.
export const PROVIDERS: Record<AIProviderId, ProviderMeta> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-5.5',
    suggestedModels: ['gpt-5.5', 'gpt-5.4-mini', 'gpt-4.1', 'gpt-4o'],
    needsKey: true,
    keyUrl: 'https://platform.openai.com/api-keys',
    description: 'GPT models via the OpenAI API',
    baseUrlEditable: false,
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    protocol: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-5',
    suggestedModels: ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5'],
    needsKey: true,
    keyUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude models, strong at code',
    baseUrlEditable: false,
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    protocol: 'gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    suggestedModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-lite'],
    needsKey: true,
    keyUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Fast and generous free tier',
    baseUrlEditable: false,
  },
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    protocol: 'openai',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-sonnet-4.5',
    suggestedModels: ['anthropic/claude-sonnet-4.5', 'openai/gpt-5.5', 'google/gemini-2.5-pro', 'deepseek/deepseek-chat'],
    needsKey: true,
    keyUrl: 'https://openrouter.ai/keys',
    description: 'One key, hundreds of models',
    baseUrlEditable: false,
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    protocol: 'openai',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'openai/gpt-oss-120b',
    suggestedModels: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile'],
    needsKey: true,
    keyUrl: 'https://console.groq.com/keys',
    description: 'Very fast inference',
    baseUrlEditable: false,
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama (local)',
    protocol: 'openai',
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5-coder:14b',
    suggestedModels: ['qwen2.5-coder:14b', 'qwen2.5-coder:7b', 'llama3.1:8b'],
    needsKey: false,
    description: 'Runs on your machine. Start with OLLAMA_ORIGINS=* ollama serve',
    baseUrlEditable: true,
  },
  custom: {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    protocol: 'openai',
    defaultBaseUrl: 'http://localhost:1234/v1',
    defaultModel: '',
    suggestedModels: [],
    needsKey: false,
    description: 'LM Studio, vLLM, LiteLLM, any /chat/completions endpoint',
    baseUrlEditable: true,
  },
};

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ProviderConfig {
  provider: AIProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature?: number | null;
  maxTokens?: number;
}

export interface StreamRequest {
  config: ProviderConfig;
  system: string;
  messages: ChatTurn[];
  signal?: AbortSignal;
  onDelta?: (delta: string, fullText: string) => void;
}

export class AIProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AIProviderError';
    this.status = status;
  }
}

const trimSlash = (url: string) => url.replace(/\/+$/, '');

// Pulls a human-readable message out of a provider's JSON error payload.
const readErrorMessage = async (response: Response): Promise<string> => {
  const raw = await response.text().catch(() => '');
  try {
    const json = JSON.parse(raw);
    const msg =
      json?.error?.message ??
      json?.error?.error?.message ??
      json?.message ??
      (typeof json?.error === 'string' ? json.error : null) ??
      json?.[0]?.error?.message;
    if (msg) return String(msg);
  } catch {
    // not JSON
  }
  return raw.slice(0, 300) || response.statusText || `HTTP ${response.status}`;
};

// Generic Server-Sent-Events reader. Invokes `onEvent` with each `data:`
// payload (event name included when present).
async function readSSE(
  response: Response,
  onEvent: (data: string, event: string | null) => void,
  signal?: AbortSignal,
) {
  if (!response.body) throw new AIProviderError('Streaming is not supported by this response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent: string | null = null;
  let dataLines: string[] = [];

  const flush = () => {
    if (dataLines.length > 0) {
      onEvent(dataLines.join('\n'), currentEvent);
    }
    dataLines = [];
    currentEvent = null;
  };

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '');
        buffer = buffer.slice(newlineIndex + 1);
        if (line === '') {
          flush();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).replace(/^ /, ''));
        } else if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        }
      }
    }
    if (buffer.trim().startsWith('data:')) {
      dataLines.push(buffer.trim().slice(5).replace(/^ /, ''));
    }
    flush();
  } finally {
    reader.releaseLock();
  }
}

async function streamOpenAI(req: StreamRequest): Promise<string> {
  const { config, system, messages, signal, onDelta } = req;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Remotoon';
  }

  const body: Record<string, unknown> = {
    model: config.model,
    stream: true,
    messages: [{ role: 'system', content: system }, ...messages],
  };
  if (typeof config.temperature === 'number') body.temperature = config.temperature;

  const response = await fetch(`${trimSlash(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw new AIProviderError(await readErrorMessage(response), response.status);
  }

  let full = '';
  await readSSE(response, (data) => {
    if (data === '[DONE]') return;
    try {
      const json = JSON.parse(data);
      if (json.error) throw new AIProviderError(json.error.message ?? 'Stream error');
      const delta: string = json.choices?.[0]?.delta?.content ?? '';
      if (delta) {
        full += delta;
        onDelta?.(delta, full);
      }
    } catch (e) {
      if (e instanceof AIProviderError) throw e;
    }
  }, signal);
  return full;
}

async function streamAnthropic(req: StreamRequest): Promise<string> {
  const { config, system, messages, signal, onDelta } = req;
  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: config.maxTokens ?? 8192,
    system,
    stream: true,
    messages,
  };
  if (typeof config.temperature === 'number') body.temperature = config.temperature;

  const response = await fetch(`${trimSlash(config.baseUrl)}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      // Required for calling the API straight from a browser (BYOK apps).
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw new AIProviderError(await readErrorMessage(response), response.status);
  }

  let full = '';
  await readSSE(response, (data, event) => {
    try {
      const json = JSON.parse(data);
      if (event === 'error' || json.type === 'error') {
        throw new AIProviderError(json.error?.message ?? 'Anthropic stream error');
      }
      if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
        full += json.delta.text;
        onDelta?.(json.delta.text, full);
      }
    } catch (e) {
      if (e instanceof AIProviderError) throw e;
    }
  }, signal);
  return full;
}

async function streamGemini(req: StreamRequest): Promise<string> {
  const { config, system, messages, signal, onDelta } = req;
  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: system }] },
    contents: messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  };
  if (typeof config.temperature === 'number') {
    body.generationConfig = { temperature: config.temperature };
  }

  const model = encodeURIComponent(config.model);
  const response = await fetch(
    `${trimSlash(config.baseUrl)}/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: JSON.stringify(body),
      signal,
    },
  );
  if (!response.ok) {
    throw new AIProviderError(await readErrorMessage(response), response.status);
  }

  let full = '';
  await readSSE(response, (data) => {
    try {
      const json = JSON.parse(data);
      if (json.error) throw new AIProviderError(json.error.message ?? 'Gemini stream error');
      const parts: Array<{ text?: string; thought?: boolean }> = json.candidates?.[0]?.content?.parts ?? [];
      const delta = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('');
      if (delta) {
        full += delta;
        onDelta?.(delta, full);
      }
    } catch (e) {
      if (e instanceof AIProviderError) throw e;
    }
  }, signal);
  return full;
}

export async function streamChat(req: StreamRequest): Promise<string> {
  const meta = PROVIDERS[req.config.provider];
  if (!meta) throw new AIProviderError(`Unknown provider: ${req.config.provider}`);
  if (meta.needsKey && !req.config.apiKey) {
    throw new AIProviderError(`Add your ${meta.label} API key in AI settings.`);
  }
  if (!req.config.model) throw new AIProviderError('Choose a model in AI settings.');

  try {
    switch (meta.protocol) {
      case 'anthropic':
        return await streamAnthropic(req);
      case 'gemini':
        return await streamGemini(req);
      default:
        return await streamOpenAI(req);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof AIProviderError) throw error;
    // fetch() network failures (CORS, offline, local server not running)
    const message = error instanceof Error ? error.message : String(error);
    throw new AIProviderError(
      meta.id === 'ollama' || meta.id === 'custom'
        ? `Could not reach ${req.config.baseUrl}. Is the server running and allowing browser (CORS) requests? (${message})`
        : `Network error talking to ${meta.label}: ${message}`,
    );
  }
}

// Lists models available to the key. Used by the settings "Fetch" button.
export async function listModels(config: ProviderConfig): Promise<string[]> {
  const meta = PROVIDERS[config.provider];
  const base = trimSlash(config.baseUrl);

  let response: Response;
  if (meta.protocol === 'anthropic') {
    response = await fetch(`${base}/models?limit=100`, {
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
    });
  } else if (meta.protocol === 'gemini') {
    response = await fetch(`${base}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': config.apiKey },
    });
  } else {
    const headers: Record<string, string> = {};
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
    response = await fetch(`${base}/models`, { headers });
  }

  if (!response.ok) {
    throw new AIProviderError(await readErrorMessage(response), response.status);
  }
  const json = await response.json();

  if (meta.protocol === 'gemini') {
    const models: Array<{ name: string; supportedGenerationMethods?: string[] }> = json.models ?? [];
    return models
      .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
      .map((m) => String(m.name).replace(/^models\//, ''));
  }
  const data: Array<{ id: string }> = json.data ?? [];
  return data.map((m) => String(m.id)).sort();
}
