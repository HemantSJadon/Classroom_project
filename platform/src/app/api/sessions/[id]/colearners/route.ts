import { createServerClient } from '@/lib/supabase/server';
import { getLLMProvider } from '@/lib/llm';
import { DEFAULT_PERSONAS } from '@/lib/personas/definitions';
import { buildCoLearnerPrompt, pickCoLearnersForTurn } from '@/lib/prompts/colearner';

type Params = { params: Promise<{ id: string }> };
const KEEPALIVE_MS = 15_000;

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  const { instructor_message_id, turn_index } = await request.json();

  type SessionWithClassroom = { classroom_id: string; classrooms: { title: string; persona_definitions: unknown } };
  const { data: sessionRaw } = await supabase
    .from('sessions').select('classroom_id, classrooms(title, persona_definitions)')
    .eq('id', id).eq('user_id', user.id).single();
  if (!sessionRaw) return new Response('Not found', { status: 404 });
  const session = sessionRaw as unknown as SessionWithClassroom;
  const classroom = session.classrooms;
  const personas = (Array.isArray(classroom.persona_definitions) && classroom.persona_definitions.length > 0)
    ? classroom.persona_definitions as typeof DEFAULT_PERSONAS
    : DEFAULT_PERSONAS;

  // Fetch instructor message for context
  const { data: instrMsg } = await supabase.from('messages').select('content')
    .eq('id', instructor_message_id).single();
  const lastExchange = instrMsg?.content ?? '';

  const selected = pickCoLearnersForTurn(personas, turn_index ?? 0);
  const encoder = new TextEncoder();
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      keepAliveTimer = setInterval(() => controller.enqueue(encoder.encode(': keepalive\n\n')), KEEPALIVE_MS);

      const send = (event: string, data: string) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));

      for (const persona of selected) {
        let accumulated = '';
        send('persona_start', JSON.stringify({ persona_id: persona.id, persona_name: persona.name }));

        await getLLMProvider().stream({
          messages: [
            { role: 'system', content: buildCoLearnerPrompt(persona, classroom.title, lastExchange) },
            { role: 'user', content: 'Generate your question or reaction now.' },
          ],
          temperature: 0.85, maxTokens: 150,
          onToken: (token) => { accumulated += token; send('token', JSON.stringify({ token, persona_id: persona.id })); },
          onDone: async () => {
            const { data: msg } = await supabase.from('messages').insert({
              session_id: id,
              classroom_id: session.classroom_id,
              author: persona.name,
              author_type: 'colearner',
              content: accumulated,
              content_type: 'question',
              parent_message_id: instructor_message_id ?? null,
            }).select().single();
            send('persona_done', JSON.stringify({ persona_id: persona.id, message_id: msg?.id }));
          },
          onError: (err) => send('error', JSON.stringify({ persona_id: persona.id, message: err.message })),
        });
      }

      send('done', '{}');
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      controller.close();
    },
    cancel() { if (keepAliveTimer) clearInterval(keepAliveTimer); },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
