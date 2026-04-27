import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('id, title, topic_summary, status, updated_at')
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('updated_at', { ascending: false });

  return <DashboardClient initialClassrooms={classrooms ?? []} />;
}
