import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, LLMStreamOptions, LLMCompleteOptions, LLMMessage } from './provider';

const TIMEOUT_MS = 45_000;

function toAnthropicMessages(messages: LLMMessage[]) {
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const turns = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  return { system, turns };
}

export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async stream({ messages, temperature = 0.7, maxTokens = 2048, onToken, onDone, onError }: LLMStreamOptions) {
    const { system, turns } = toAnthropicMessages(messages);
    const timer = setTimeout(() => onError(new Error('LLM request timed out')), TIMEOUT_MS);
    try {
      const stream = await this.client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        temperature,
        system,
        messages: turns,
      });
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          onToken(chunk.delta.text);
        }
      }
      clearTimeout(timer);
      onDone();
    } catch (err) {
      clearTimeout(timer);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async complete({ messages, temperature = 0.7, maxTokens = 2048 }: LLMCompleteOptions): Promise<string> {
    const { system, turns } = toAnthropicMessages(messages);
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      temperature,
      system,
      messages: turns,
    });
    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  }
}
