'use client';

import { useState } from 'react';
import IntakeChat from './IntakeChat';

export interface CreatedClassroom {
  id: string;
  title: string;
  topic_summary: string | null;
  status: 'active' | 'archived' | 'deleted';
  updated_at: string;
}

interface Props {
  onCreated: (classroom: CreatedClassroom) => void;
  onClose: () => void;
}

export default function NewClassroomModal({ onCreated, onClose }: Props) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleIntakeComplete(result: { title: string; topic_summary: string }) {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: result.title, topic_summary: result.topic_summary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create classroom');
      onCreated(data.classroom);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-[600px] rounded-2xl border border-gray-700 bg-gray-950 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-gray-100">New Classroom</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {creating ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-400">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-sm">Setting up your classroom…</span>
          </div>
        ) : (
          <>
            {error && (
              <div className="px-5 py-3 bg-red-900/40 border-b border-red-800 text-red-300 text-sm">
                {error}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <IntakeChat onComplete={handleIntakeComplete} onCancel={onClose} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
