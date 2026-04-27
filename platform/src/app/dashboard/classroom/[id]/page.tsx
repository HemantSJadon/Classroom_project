import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ClassroomClient from './ClassroomClient';

type Props = { params: Promise<{ id: string }> };

export default async function ClassroomPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('id, title, topic_summary')
    .eq('id', id)
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .single();

  if (!classroom) notFound();

  // Most recent non-active session (for recap)
  const { data: previousSession } = await supabase
    .from('sessions')
    .select('id, planned_duration_minutes, status, ended_at, recap_content, recap_shown')
    .eq('classroom_id', id)
    .eq('user_id', user.id)
    .neq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="h-full">
      <ClassroomClient
        classroom={classroom}
        previousSession={previousSession ?? null}
      />
    </div>
  );
}
