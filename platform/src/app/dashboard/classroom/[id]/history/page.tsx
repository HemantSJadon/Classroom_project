import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import HistoryView from './HistoryView';

type Props = { params: Promise<{ id: string }> };

export default async function HistoryPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: classroom } = await supabase
    .from('classrooms').select('id, title')
    .eq('id', id).eq('user_id', user.id).neq('status', 'deleted').single();
  if (!classroom) notFound();

  const { data: sessions } = await supabase
    .from('sessions').select('id, status, planned_duration_minutes, started_at, ended_at')
    .eq('classroom_id', id).eq('user_id', user.id)
    .order('started_at', { ascending: false });

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const counts: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: msgCounts } = await supabase.from('messages').select('session_id').in('session_id', sessionIds);
    (msgCounts ?? []).forEach((m: { session_id: string }) => { counts[m.session_id] = (counts[m.session_id] ?? 0) + 1; });
  }

  const enriched = (sessions ?? []).map((s) => ({ ...s, message_count: counts[s.id] ?? 0 }));

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/classroom/${id}`} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← Back to Classroom
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{classroom.title}</h1>
        <p className="text-gray-400 text-sm mt-1">Session history</p>
      </div>
      <HistoryView classroomId={id} sessions={enriched} />
    </div>
  );
}
