import { createServerClient } from '@/lib/supabase/server';
import { getLLMProvider } from '@/lib/llm';
import type { LLMMessage } from '@/lib/llm/provider';
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit';

const KEEPALIVE_INTERVAL_MS = 15_000;

const SYSTEM_PROMPT = `You are the AI Classroom setup assistant. Your job is to deeply understand what a user wants to learn through a warm, conversational, multi-turn dialogue.

Your goals across the conversation:
1. Understand the TOPIC they want to learn (ask if vague)
2. Understand their CURRENT LEVEL (complete beginner / some exposure / intermediate / advanced)
3. Understand their WHY — their motivation and end goal
4. Understand their PREFERRED STYLE — do they like stories and examples, step-by-step logic, visual analogies, or deep theory?
5. Understand their TIME HORIZON — weeks, months?
6. Confirm your understanding before finalising

Rules:
- Ask ONE focused question at a time — never bombard
- Be warm, curious, and encouraging
- After 4–6 exchanges you should have enough to generate the classroom summary
- When ready, respond with a JSON block in this EXACT format (no other text after it):

\`\`\`json
{
  "ready": true,
  "title": "<short classroom title, max 60 chars>",
  "topic_summary": "<2–3 sentence summary of exactly what will be learned, at what level, why>"
}
\`\`\`

Start by warmly greeting the user and asking what they want to learn.`;

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rl = await checkRateLimit(user.id, 'intake');
  if (!rl.allowed) return rateLimitResponse(rl.reset);

  const { messages }: { messages: LLMMessage[] } = await request.json();

  const fullMessages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  const encoder = new TextEncoder();
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      keepAliveTimer = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, KEEPALIVE_INTERVAL_MS);

      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      await getLLMProvider().stream({
        messages: fullMessages,
        temperature: 0.7,
        maxTokens: 1024,
        onToken: (token) => send('token', JSON.stringify({ token })),
        onDone: () => {
          send('done', '{}');
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          controller.close();
        },
        onError: (error) => {
          send('error', JSON.stringify({ message: error.message }));
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          controller.close();
        },
      });
    },
    cancel() {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
