export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMStreamOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface LLMCompleteOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  readonly name: string;
  stream(options: LLMStreamOptions): Promise<void>;
  complete(options: LLMCompleteOptions): Promise<string>;
}
