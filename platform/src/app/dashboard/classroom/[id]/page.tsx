import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

type Props = { params: Promise<{ id: string }> };

export default async function ClassroomPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: classroom } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .single();

  if (!classroom) notFound();

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Classrooms
        </Link>
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{classroom.title}</h1>
        {classroom.topic_summary && (
          <p className="text-gray-400">{classroom.topic_summary}</p>
        )}
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center space-y-3">
        <p className="text-gray-400 text-sm">Session engine coming in Phase 2</p>
        <button className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors">
          Start Session
        </button>
      </div>
    </div>
  );
}
