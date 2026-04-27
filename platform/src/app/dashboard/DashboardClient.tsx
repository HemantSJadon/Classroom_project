'use client';

import { useState } from 'react';
import ClassroomCard from '@/components/classroom/ClassroomCard';
import NewClassroomModal from '@/components/classroom/NewClassroomModal';

interface Classroom {
  id: string;
  title: string;
  topic_summary: string | null;
  status: 'active' | 'archived' | 'deleted';
  updated_at: string;
}

interface Props {
  initialClassrooms: Classroom[];
}

export default function DashboardClient({ initialClassrooms }: Props) {
  const [classrooms, setClassrooms] = useState<Classroom[]>(initialClassrooms);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');

  function handleCreated(classroom: Classroom) {
    setClassrooms((prev) => [classroom, ...prev]);
    setShowModal(false);
  }

  async function handleArchive(id: string) {
    await fetch(`/api/classrooms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    setClassrooms((prev) =>
      prev.map((c) => c.id === id ? { ...c, status: 'archived' } : c)
    );
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this classroom? This cannot be undone.')) return;
    await fetch(`/api/classrooms/${id}`, { method: 'DELETE' });
    setClassrooms((prev) => prev.filter((c) => c.id !== id));
  }

  const visible = classrooms.filter((c) => c.status === filter);

  return (
    <>
      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold">Classrooms</h1>
            <div className="flex rounded-lg border border-gray-700 overflow-hidden text-sm">
              {(['active', 'archived'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 capitalize transition-colors ${
                    filter === f
                      ? 'bg-gray-700 text-gray-100'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            + New Classroom
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="text-gray-500 text-sm">
              {filter === 'active'
                ? 'No classrooms yet. Start one to begin your learning journey.'
                : 'No archived classrooms.'}
            </p>
            {filter === 'active' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                Start your first classroom
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((classroom) => (
              <ClassroomCard
                key={classroom.id}
                classroom={classroom}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
            {filter === 'active' && (
              <button
                onClick={() => setShowModal(true)}
                className="rounded-xl border-2 border-dashed border-gray-700 hover:border-indigo-500 p-5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-indigo-400 transition-colors min-h-[200px]"
              >
                <span className="text-3xl font-light">+</span>
                <span className="text-sm font-medium">New classroom</span>
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <NewClassroomModal onCreated={handleCreated} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
