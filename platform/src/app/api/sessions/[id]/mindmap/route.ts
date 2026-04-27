import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLLMProvider } from '@/lib/llm';
import { MINDMAP_INSTRUCTIONS, type MindMapData } from '@/lib/mindmap/types';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  type SessionRow = { classroom_id: string; classrooms: { title: string } };
  const { data: raw } = await supabase
    .from('sessions').select('classroom_id, classrooms(title)')
    .eq('id', id).eq('user_id', user.id).single();
  if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const session = raw as unknown as SessionRow;

  // Fetch last 10 messages for context
  const { data: msgs } = await supabase.from('messages').select('author, content')
    .eq('session_id', id).order('created_at', { ascending: false }).limit(10);
  const context = (msgs ?? []).reverse().map((m) => `[${m.author}]: ${m.content}`).join('\n');

  const raw_json = await getLLMProvider().complete({
    messages: [
      { role: 'system', content: `You are generating a mind map for the topic: "${session.classrooms.title}".\n\n${MINDMAP_INSTRUCTIONS}` },
      { role: 'user', content: `Recent session exchange:\n${context}\n\nGenerate the mind map JSON now.` },
    ],
    temperature: 0.4, maxTokens: 600,
  });

  let mindmap: MindMapData;
  try {
    const cleaned = raw_json.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    mindmap = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: 'Failed to parse mind map JSON' }, { status: 500 });
  }

  const { data: msg } = await supabase.from('messages').insert({
    session_id: id,
    classroom_id: session.classroom_id,
    author: 'Instructor',
    author_type: 'instructor',
    content: JSON.stringify(mindmap),
    content_type: 'mindmap',
    metadata: { generated: true },
  }).select().single();

  return NextResponse.json({ message: msg, mindmap });
}
