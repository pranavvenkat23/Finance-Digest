/**
 * Groq chat client (OpenAI-compatible). Free for the user with a key they create
 * once. Used for News summaries/impact, Stocks explainers, and the FinAI chat.
 *
 * All AI output is framed as educational, not advice. The app's sourced numbers
 * never come from the model; the model only explains and contextualizes.
 */

import { GROQ_API_BASE, GROQ_MODEL, GROQ_MODEL_FAST } from '@/lib/constants';
import { currentGroqKey } from '@/store/aiStore';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** Thrown when no API key is configured, so the UI can prompt the user to add one. */
export class MissingKeyError extends Error {
  constructor() {
    super('No Groq API key configured.');
    this.name = 'MissingKeyError';
  }
}

export class GroqError extends Error {}

type ChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fast?: boolean;
  signal?: AbortSignal;
};

export function hasGroqKey(): boolean {
  return !!currentGroqKey();
}

/** Send a chat completion and return the assistant's text. Never streams. */
export async function groqChat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const key = currentGroqKey();
  if (!key) throw new MissingKeyError();

  const model = opts.model ?? (opts.fast ? GROQ_MODEL_FAST : GROQ_MODEL);

  let res: Response;
  try {
    res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      signal: opts.signal,
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 700,
      }),
    });
  } catch (e) {
    throw new GroqError('Could not reach the AI service. Check your connection and try again.');
  }

  if (res.status === 401) throw new GroqError('Your AI key was rejected. Please re-enter a valid Groq key.');
  if (res.status === 429) throw new GroqError('AI rate limit reached for now. Please wait a moment and try again.');
  if (!res.ok) throw new GroqError(`AI service error (${res.status}). Please try again.`);

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new GroqError('The AI returned an empty response. Please try again.');
  return text;
}
