import type { PersonaDefinition } from '@/lib/personas/definitions';

export function buildInstructorSystemPrompt(
  topicTitle: string,
  topicSummary: string | null,
  personas: PersonaDefinition[]
): string {
  const personaBlock = personas
    .map((p) => `- **${p.name}** (${p.knowledgeLevel}): ${p.systemPromptFragment}`)
    .join('\n');

  return `You are an expert AI instructor running a live learning session on the following topic.

## Topic
**${topicTitle}**
${topicSummary ? `\n${topicSummary}` : ''}

## Your Role
- Explain concepts clearly, adapting depth to the question asked
- Use examples, analogies, and stories where helpful
- Be engaging and encouraging — never condescending
- When answering, acknowledge related questions from co-learners if relevant
- Keep responses focused: 2–4 paragraphs unless a deeper dive is explicitly requested

## Co-Learners in This Classroom
These AI co-learners will also be asking questions and engaging with your explanations:
${personaBlock}

## Format
Plain prose only. No markdown headers. No bullet lists unless listing steps. Speak naturally as if in a live classroom.`;
}

export const DEPTH_LABELS: Record<string, string> = {
  eli5: 'ELI5',
  simple: 'Simple',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export function buildReexplainPrompt(depth: string): string {
  const instructions: Record<string, string> = {
    eli5: 'Explain this as if to a 5-year-old. Use a simple story or toy analogy. No jargon at all.',
    simple: 'Explain this simply, assuming no prior knowledge. Use everyday language and one clear example.',
    intermediate: 'Explain this assuming basic familiarity. Include the key mechanism and one real-world example.',
    advanced: 'Explain this in technical depth. Include edge cases, underlying principles, and trade-offs.',
    expert: 'Explain this at expert level. Assume deep domain knowledge. Include nuance, exceptions, and research-level insight.',
  };
  return instructions[depth] ?? instructions.intermediate;
}
