import OpenAI from 'openai';
import type { LLMProvider, LLMStreamOptions, LLMCompleteOptions, LLMMessage } from './provider';

const TIMEOUT_MS = 45_000;

// Groq is OpenAI-compatible
function toMessages(messages: LLMMessage[]) {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export class GroqProvider implements LLMProvider {
  readonly name = 'groq';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async stream({ messages, temperature = 0.7, maxTokens = 2048, onToken, onDone, onError }: LLMStreamOptions) {
    const timer = setTimeout(() => onError(new Error('LLM request timed out')), TIMEOUT_MS);
    try {
      const stream = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: maxTokens,
        temperature,
        messages: toMessages(messages),
        stream: true,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) onToken(delta);
      }
      clearTimeout(timer);
      onDone();
    } catch (err) {
      clearTimeout(timer);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async complete({ messages, temperature = 0.7, maxTokens = 2048 }: LLMCompleteOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: maxTokens,
      temperature,
      messages: toMessages(messages),
    });
    return response.choices[0]?.message?.content ?? '';
  }
}
