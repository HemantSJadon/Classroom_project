import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

// GET — latest saved state snapshot for a session
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify session ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data } = await supabase
    .from('session_state')
    .select('*')
    .eq('session_id', id)
    .order('saved_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ state: data });
}

// POST — upsert state snapshot
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { scroll_position, last_message_id, context_summary } = await request.json();

  const { data, error } = await supabase
    .from('session_state')
    .insert({
      session_id: id,
      scroll_position: scroll_position ?? 0,
      last_message_id: last_message_id ?? null,
      context_summary: context_summary ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ state: data }, { status: 201 });
}
