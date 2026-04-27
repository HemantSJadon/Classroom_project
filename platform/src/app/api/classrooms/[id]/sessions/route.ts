import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify classroom ownership
  const { data: classroom } = await supabase
    .from('classrooms').select('id, title')
    .eq('id', id).eq('user_id', user.id).neq('status', 'deleted').single();
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: sessions } = await supabase
    .from('sessions').select('id, status, planned_duration_minutes, started_at, ended_at, recap_shown')
    .eq('classroom_id', id).eq('user_id', user.id)
    .order('started_at', { ascending: false });

  // Get message counts per session
  const sessionIds = (sessions ?? []).map((s) => s.id);
  const counts: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: msgCounts } = await supabase
      .from('messages').select('session_id')
      .in('session_id', sessionIds);
    (msgCounts ?? []).forEach((m) => {
      counts[m.session_id] = (counts[m.session_id] ?? 0) + 1;
    });
  }

  const enriched = (sessions ?? []).map((s) => ({ ...s, message_count: counts[s.id] ?? 0 }));
  return NextResponse.json({ classroom, sessions: enriched });
}
