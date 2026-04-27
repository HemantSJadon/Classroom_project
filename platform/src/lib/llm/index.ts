import type { LLMProvider } from './provider';

let _provider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (_provider) return _provider;

  const name = (process.env.LLM_PROVIDER ?? 'anthropic').toLowerCase();

  switch (name) {
    case 'anthropic': {
      const { AnthropicProvider } = require('./anthropic');
      _provider = new AnthropicProvider();
      break;
    }
    case 'openai': {
      const { OpenAIProvider } = require('./openai');
      _provider = new OpenAIProvider();
      break;
    }
    case 'deepseek': {
      const { DeepSeekProvider } = require('./deepseek');
      _provider = new DeepSeekProvider();
      break;
    }
    case 'groq': {
      const { GroqProvider } = require('./groq');
      _provider = new GroqProvider();
      break;
    }
    default:
      throw new Error(`Unknown LLM_PROVIDER: "${name}". Valid values: anthropic | openai | deepseek | groq`);
  }

  return _provider!;
}

export type { LLMProvider, LLMMessage, LLMStreamOptions, LLMCompleteOptions } from './provider';
