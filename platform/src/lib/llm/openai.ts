import OpenAI from 'openai';
import type { LLMProvider, LLMStreamOptions, LLMCompleteOptions, LLMMessage } from './provider';

const TIMEOUT_MS = 45_000;

function toOpenAIMessages(messages: LLMMessage[]) {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async stream({ messages, temperature = 0.7, maxTokens = 2048, onToken, onDone, onError }: LLMStreamOptions) {
    const timer = setTimeout(() => onError(new Error('LLM request timed out')), TIMEOUT_MS);
    try {
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: maxTokens,
        temperature,
        messages: toOpenAIMessages(messages),
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
      model: 'gpt-4o',
      max_tokens: maxTokens,
      temperature,
      messages: toOpenAIMessages(messages),
    });
    return response.choices[0]?.message?.content ?? '';
  }
}
