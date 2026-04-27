import type { LLMMessage } from '@/lib/llm/provider';

const MAX_CONTEXT_TOKENS = 6_000;
const CHARS_PER_TOKEN = 4; // rough approximation
const MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN;
const RECENT_MESSAGES_LIMIT = 10;

export interface ContextInput {
  topicDefinition: string;
  personaDefinitions: string;
  rollingSummary: string | null;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export function buildContextMessages(input: ContextInput): LLMMessage[] {
  const { topicDefinition, personaDefinitions, rollingSummary, recentMessages } = input;

  const systemParts = [
    `## Learning Topic\n${topicDefinition}`,
    `## Co-Learner Personas\n${personaDefinitions}`,
  ];

  if (rollingSummary) {
    systemParts.push(`## Session History Summary\n${rollingSummary}`);
  }

  let systemContent = systemParts.join('\n\n');

  // Hard cap: truncate system prompt if it exceeds the token budget
  if (systemContent.length > MAX_CONTEXT_CHARS * 0.6) {
    systemContent = systemContent.slice(0, Math.floor(MAX_CONTEXT_CHARS * 0.6));
  }

  const messages: LLMMessage[] = [{ role: 'system', content: systemContent }];

  // Inject only the last N messages to stay within token budget
  const recent = recentMessages.slice(-RECENT_MESSAGES_LIMIT);
  for (const msg of recent) {
    messages.push({ role: msg.role, content: msg.content });
  }

  return messages;
}

export function shouldSummarise(messageCount: number): boolean {
  return messageCount > 0 && messageCount % 20 === 0;
}
