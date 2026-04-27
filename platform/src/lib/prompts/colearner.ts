import type { PersonaDefinition } from '@/lib/personas/definitions';

export function buildCoLearnerPrompt(
  persona: PersonaDefinition,
  topicTitle: string,
  lastExchange: string
): string {
  return `You are ${persona.name}, a student in a live AI learning session about "${topicTitle}".

Your persona: ${persona.systemPromptFragment}

The instructor just explained the following:
---
${lastExchange}
---

Stay completely in character as ${persona.name}. Generate ONE question or reaction that ${persona.name} would naturally have RIGHT NOW based on the explanation above.

Rules:
- One sentence to two sentences maximum
- Speak in first person as ${persona.name}
- Match your persona's energy, knowledge level, and curiosity style exactly
- Do NOT introduce yourself or say your name
- Do NOT ask generic questions — react specifically to what was just explained
- Do NOT use markdown or formatting`;
}

export function pickCoLearnersForTurn(
  personas: PersonaDefinition[],
  turnIndex: number
): PersonaDefinition[] {
  // Rotate through personas: 1-2 per turn, different ones each time
  const count = turnIndex % 3 === 0 ? 2 : 1;
  const start = turnIndex % personas.length;
  const selected: PersonaDefinition[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(personas[(start + i) % personas.length]);
  }
  return selected;
}
