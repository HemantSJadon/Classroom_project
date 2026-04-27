import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// POST — start a new session for a classroom
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { classroom_id, planned_duration_minutes } = await request.json();

  if (!classroom_id) return NextResponse.json({ error: 'classroom_id required' }, { status: 400 });

  // Verify the classroom belongs to this user
  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('id', classroom_id)
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .single();

  if (!classroom) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

  // Guard against duplicate active sessions (race condition prevention)
  const { data: existing } = await supabase
    .from('sessions')
    .select('id')
    .eq('classroom_id', classroom_id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (existing) return NextResponse.json({ session: existing });

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      classroom_id,
      user_id: user.id,
      status: 'active',
      planned_duration_minutes: planned_duration_minutes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ session: data }, { status: 201 });
}
