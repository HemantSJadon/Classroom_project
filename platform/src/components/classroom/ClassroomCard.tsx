'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Classroom {
  id: string;
  title: string;
  topic_summary: string | null;
  status: 'active' | 'archived' | 'deleted';
  updated_at: string;
}

interface Props {
  classroom: Classroom;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ClassroomCard({ classroom, onArchive, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const lastActive = new Date(classroom.updated_at).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  });

  return (
    <div className="relative rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-gray-100 leading-snug">{classroom.title}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            classroom.status === 'active'
              ? 'bg-green-900/60 text-green-300'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {classroom.status}
          </span>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none w-6 h-6 flex items-center justify-center rounded"
          >
            ⋮
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute right-4 top-10 z-10 rounded-lg border border-gray-700 bg-gray-800 shadow-xl text-sm overflow-hidden">
          <button
            onClick={() => { setMenuOpen(false); onArchive(classroom.id); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-300"
          >
            Archive
          </button>
          <button
            onClick={() => { setMenuOpen(false); onDelete(classroom.id); }}
            className="w-full text-left px-4 py-2 hover:bg-gray-700 text-red-400"
          >
            Delete
          </button>
        </div>
      )}

      {classroom.topic_summary && (
        <p className="text-sm text-gray-400 line-clamp-2">{classroom.topic_summary}</p>
      )}

      <div className="text-xs text-gray-500">Last active: {lastActive}</div>

      <Link
        href={`/dashboard/classroom/${classroom.id}`}
        className="block w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium text-center transition-colors"
      >
        Open Classroom
      </Link>
    </div>
  );
}
