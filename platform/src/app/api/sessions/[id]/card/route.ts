import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLLMProvider } from '@/lib/llm';

type CardType = 'concept' | 'summary' | 'insight';
type Params = { params: Promise<{ id: string }> };

const CARD_PROMPTS: Record<CardType, string> = {
  concept: 'Extract the most important CONCEPT from the recent discussion. Give it a title, a 2-sentence definition, and 2-3 key attributes.',
  summary: 'Write a SUMMARY card of what has been discussed so far. Cover the main points, key takeaways, and any open questions.',
  insight: 'Identify a surprising INSIGHT, non-obvious connection, or "aha moment" from the recent discussion. Explain why it matters.',
};

const CARD_SCHEMA = `Return ONLY valid JSON matching exactly:
{"type":"<type>","title":"<short title>","body":"<2-3 sentences>","tags":["<tag1>","<tag2>"]}`;

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { card_type = 'concept' }: { card_type: CardType } = await request.json();

  type SessionRow = { classroom_id: string; classrooms: { title: string } };
  const { data: raw } = await supabase
    .from('sessions').select('classroom_id, classrooms(title)')
    .eq('id', id).eq('user_id', user.id).single();
  if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const session = raw as unknown as SessionRow;

  const { data: msgs } = await supabase.from('messages').select('author, content')
    .eq('session_id', id).order('created_at', { ascending: false }).limit(8);
  const context = (msgs ?? []).reverse().map((m) => `[${m.author}]: ${m.content}`).join('\n');

  const raw_json = await getLLMProvider().complete({
    messages: [
      {
        role: 'system',
        content: `Topic: "${session.classrooms.title}". ${CARD_PROMPTS[card_type]}\n\n${CARD_SCHEMA}`,
      },
      { role: 'user', content: `Recent discussion:\n${context}\n\nGenerate the ${card_type} card JSON.` },
    ],
    temperature: 0.4, maxTokens: 300,
  });

  let card: { type: string; title: string; body: string; tags: string[] };
  try {
    const cleaned = raw_json.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    card = JSON.parse(cleaned);
    card.type = card_type;
  } catch {
    return NextResponse.json({ error: 'Failed to parse card JSON' }, { status: 500 });
  }

  const { data: msg } = await supabase.from('messages').insert({
    session_id: id,
    classroom_id: session.classroom_id,
    author: 'Instructor',
    author_type: 'instructor',
    content: JSON.stringify(card),
    content_type: 'card',
    metadata: { card_type },
  }).select().single();

  return NextResponse.json({ message: msg, card });
}
