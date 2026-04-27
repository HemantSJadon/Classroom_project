import { createServerClient } from '@/lib/supabase/server';
import { getLLMProvider } from '@/lib/llm';
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit';

type Params = { params: Promise<{ id: string }> };
const KEEPALIVE_MS = 15_000;

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const rl = await checkRateLimit(user.id, 'recap');
  if (!rl.allowed) return rateLimitResponse(rl.reset);

  // Fetch the session and verify ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('*, classrooms(title, topic_summary)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!session) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  // Fetch the last 30 messages from this session
  const { data: messages } = await supabase
    .from('messages')
    .select('author, author_type, content, content_type, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true })
    .limit(30);

  const classroom = (session as { classrooms: { title: string; topic_summary: string | null } }).classrooms;

  const transcript = (messages ?? [])
    .map((m) => `[${m.author}]: ${m.content}`)
    .join('\n');

  const systemPrompt = `You are generating a concise, warm recap of a completed learning session.
Topic: ${classroom.title}
${classroom.topic_summary ? `Summary: ${classroom.topic_summary}` : ''}

Write a recap that:
- Summarises the key concepts discussed
- Notes any questions that were raised and answered
- Highlights insights or breakthroughs
- Sets the stage for the next session (what to continue or explore)
- Is 3–5 short paragraphs, warm and encouraging in tone`;

  const userMessage = `Here is the session transcript:\n\n${transcript || '(No messages in this session yet)'}`;

  const encoder = new TextEncoder();
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      keepAliveTimer = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, KEEPALIVE_MS);

      const send = (event: string, data: string) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));

      await getLLMProvider().stream({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.5,
        maxTokens: 800,
        onToken: (token) => send('token', JSON.stringify({ token })),
        onDone: () => {
          send('done', '{}');
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          controller.close();
        },
        onError: (err) => {
          send('error', JSON.stringify({ message: err.message }));
          if (keepAliveTimer) clearInterval(keepAliveTimer);
          controller.close();
        },
      });
    },
    cancel() { if (keepAliveTimer) clearInterval(keepAliveTimer); },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
