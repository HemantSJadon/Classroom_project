import { createServerClient } from '@/lib/supabase/server';
import { getLLMProvider } from '@/lib/llm';
import { buildContextMessages } from '@/lib/context/manager';
import { buildInstructorSystemPrompt } from '@/lib/prompts/instructor';
import { DEFAULT_PERSONAS, personasToSystemPrompt } from '@/lib/personas/definitions';
import { checkRateLimit, rateLimitResponse } from '@/lib/ratelimit';

type Params = { params: Promise<{ id: string }> };
const KEEPALIVE_MS = 15_000;

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  const rl = await checkRateLimit(user.id, 'chat');
  if (!rl.allowed) return rateLimitResponse(rl.reset);

  const { content } = await request.json();
  if (!content?.trim()) return new Response('content required', { status: 400 });

  // Fetch session + classroom (typed via cast; join is not in DB schema type)
  type SessionWithClassroom = { id: string; classroom_id: string; classrooms: { title: string; topic_summary: string | null; persona_definitions: unknown } };
  const { data: sessionRaw } = await supabase
    .from('sessions').select('id, classroom_id, classrooms(title, topic_summary, persona_definitions)')
    .eq('id', id).eq('user_id', user.id).single();
  if (!sessionRaw) return new Response('Not found', { status: 404 });
  const session = sessionRaw as unknown as SessionWithClassroom;
  const classroom = session.classrooms;
  const personas = (Array.isArray(classroom.persona_definitions) && classroom.persona_definitions.length > 0)
    ? classroom.persona_definitions as typeof DEFAULT_PERSONAS
    : DEFAULT_PERSONAS;

  // Save user message
  const { data: userMsg } = await supabase.from('messages').insert({
    session_id: id, classroom_id: session.classroom_id,
    author: 'You', author_type: 'user', content: content.trim(), content_type: 'text',
  }).select().single();

  // Fetch recent messages for context
  const { data: recentMsgs } = await supabase.from('messages').select('author_type, content')
    .eq('session_id', id).order('created_at', { ascending: false }).limit(20);
  const reversed = (recentMsgs ?? []).reverse();

  // Fetch rolling summary from latest session state
  const { data: stateSnap } = await supabase.from('session_state').select('context_summary')
    .eq('session_id', id).order('saved_at', { ascending: false }).limit(1).maybeSingle();

  const contextMessages = buildContextMessages({
    topicDefinition: `${classroom.title}${classroom.topic_summary ? ': ' + classroom.topic_summary : ''}`,
    personaDefinitions: personasToSystemPrompt(personas),
    rollingSummary: stateSnap?.context_summary ?? null,
    recentMessages: reversed.map((m) => ({
      role: m.author_type === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  });

  // Override system prompt with full instructor prompt
  contextMessages[0].content = buildInstructorSystemPrompt(classroom.title, classroom.topic_summary, personas);

  const encoder = new TextEncoder();
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  let accumulated = '';

  const stream = new ReadableStream({
    async start(controller) {
      keepAliveTimer = setInterval(() => controller.enqueue(encoder.encode(': keepalive\n\n')), KEEPALIVE_MS);

      const send = (event: string, data: string) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));

      // Send user message id so client can reference it
      send('user_saved', JSON.stringify({ id: userMsg?.id }));

      await getLLMProvider().stream({
        messages: contextMessages,
        temperature: 0.7, maxTokens: 1024,
        onToken: (token) => { accumulated += token; send('token', JSON.stringify({ token })); },
        onDone: async () => {
          // Save instructor response
          const { data: instrMsg } = await supabase.from('messages').insert({
            session_id: id, classroom_id: session.classroom_id,
            author: 'Instructor', author_type: 'instructor',
            content: accumulated, content_type: 'text',
          }).select().single();
          send('done', JSON.stringify({ instructor_message_id: instrMsg?.id, total_messages: (recentMsgs?.length ?? 0) + 2 }));
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
