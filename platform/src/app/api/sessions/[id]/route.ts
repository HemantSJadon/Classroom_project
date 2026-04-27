import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type SessionUpdate = Database['public']['Tables']['sessions']['Update'];
type Params = { params: Promise<{ id: string }> };

// GET — fetch session + its messages
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ session, messages: messages ?? [] });
}

// PATCH — update session status (pause | complete)
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const allowed: (keyof SessionUpdate)[] = ['status', 'ended_at', 'recap_shown', 'recap_content'];
  const updates: SessionUpdate = {};
  for (const key of allowed) {
    if (key in body) (updates as Record<string, unknown>)[key] = body[key];
  }

  if (updates.status === 'completed' || updates.status === 'paused') {
    updates.ended_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}
