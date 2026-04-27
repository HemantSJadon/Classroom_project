import { createServerClient } from '@/lib/supabase/server';
import { getLLMProvider } from '@/lib/llm';
import { buildReexplainPrompt } from '@/lib/prompts/instructor';

type Params = { params: Promise<{ id: string }> };
const KEEPALIVE_MS = 15_000;

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  const { message_id, depth } = await request.json();
  if (!message_id || !depth) return new Response('message_id and depth required', { status: 400 });

  type SessionWithClassroom = { classroom_id: string; classrooms: { title: string; topic_summary: string | null } };
  const { data: sessionRaw } = await supabase
    .from('sessions').select('classroom_id, classrooms(title, topic_summary)')
    .eq('id', id).eq('user_id', user.id).single();
  if (!sessionRaw) return new Response('Not found', { status: 404 });
  const session = sessionRaw as unknown as SessionWithClassroom;

  const { data: original } = await supabase.from('messages').select('content').eq('id', message_id).single();
  if (!original) return new Response('Message not found', { status: 404 });

  const classroom = session.classrooms;
  const depthInstruction = buildReexplainPrompt(depth);

  const encoder = new TextEncoder();
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  let accumulated = '';

  const stream = new ReadableStream({
    async start(controller) {
      keepAliveTimer = setInterval(() => controller.enqueue(encoder.encode(': keepalive\n\n')), KEEPALIVE_MS);

      const send = (event: string, data: string) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));

      await getLLMProvider().stream({
        messages: [
          {
            role: 'system',
            content: `You are an expert instructor on "${classroom.title}". ${depthInstruction}`,
          },
          {
            role: 'user',
            content: `Re-explain the following concept at the requested level:\n\n${original.content}`,
          },
        ],
        temperature: 0.6, maxTokens: 800,
        onToken: (token) => { accumulated += token; send('token', JSON.stringify({ token })); },
        onDone: async () => {
          const { data: msg } = await supabase.from('messages').insert({
            session_id: id,
            classroom_id: session.classroom_id,
            author: 'Instructor',
            author_type: 'instructor',
            content: accumulated,
            content_type: 'text',
            parent_message_id: message_id,
            metadata: { depth, reexplain: true },
          }).select().single();
          send('done', JSON.stringify({ message_id: msg?.id }));
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
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
