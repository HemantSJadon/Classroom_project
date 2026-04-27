import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const ALLOWED = ['preferred_depth', 'colearner_intensity', 'language_style', 'learning_pace'] as const;

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();

  // Return defaults if no row exists yet
  const defaults = {
    preferred_depth: 'intermediate',
    colearner_intensity: 'medium',
    language_style: 'conversational',
    learning_pace: 'medium',
  };

  return NextResponse.json({ preferences: data ?? { ...defaults, user_id: user.id } });
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const payload: {
    user_id: string;
    preferred_depth?: string;
    colearner_intensity?: string;
    language_style?: string;
    learning_pace?: string;
  } = { user_id: user.id };
  for (const key of ALLOWED) {
    if (key in body && typeof body[key] === 'string') payload[key] = body[key];
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preferences: data });
}
