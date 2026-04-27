import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLLMProvider } from '@/lib/llm';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  type SessionWithClassroom = { classroom_id: string; classrooms: { title: string } };
  const { data: sessionRaw } = await supabase
    .from('sessions').select('classroom_id, classrooms(title)')
    .eq('id', id).eq('user_id', user.id).single();
  if (!sessionRaw) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const session = sessionRaw as unknown as SessionWithClassroom;
  const classroom = session.classrooms;

  // Fetch last 20 messages to summarise
  const { data: messages } = await supabase.from('messages').select('author, content')
    .eq('session_id', id).order('created_at', { ascending: false }).limit(20);
  const transcript = (messages ?? []).reverse()
    .map((m) => `[${m.author}]: ${m.content}`).join('\n');

  const summary = await getLLMProvider().complete({
    messages: [
      {
        role: 'system',
        content: `You are summarising a segment of a learning session about "${classroom.title}". Produce a dense 3–5 sentence summary of the key concepts, questions, and insights from this exchange. This summary will be injected into future LLM calls as context — be precise and information-dense.`,
      },
      { role: 'user', content: transcript },
    ],
    temperature: 0.3, maxTokens: 300,
  });

  // Save summary into session_state
  const { data: stateRecord } = await supabase.from('session_state').insert({
    session_id: id,
    context_summary: summary,
  }).select().single();

  return NextResponse.json({ summary, state_id: stateRecord?.id });
}
