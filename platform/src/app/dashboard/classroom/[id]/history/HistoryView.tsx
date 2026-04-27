'use client';

import { useState } from 'react';

interface Session {
  id: string;
  status: string;
  planned_duration_minutes: number | null;
  started_at: string;
  ended_at: string | null;
  message_count: number;
}

interface Props {
  classroomId: string;
  sessions: Session[];
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return 'In progress';
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-900/60 text-green-300',
  paused: 'bg-yellow-900/60 text-yellow-300',
  active: 'bg-indigo-900/60 text-indigo-300',
};

export default function HistoryView({ sessions }: Props) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [msgCache, setMsgCache] = useState<Record<string, { author: string; content: string; content_type: string }[]>>({});

  const filtered = sessions.filter((s) =>
    search === '' || new Date(s.started_at).toLocaleDateString().includes(search)
  );

  async function toggleSession(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (msgCache[id]) return;
    const res = await fetch(`/api/sessions/${id}`);
    const data = await res.json();
    setMsgCache((prev) => ({ ...prev, [id]: data.messages ?? [] }));
  }

  if (sessions.length === 0) {
    return <p className="text-gray-500 text-sm">No sessions yet for this classroom.</p>;
  }

  return (
    <div className="space-y-4">
      <input
        value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter by date…"
        className="w-full max-w-xs px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
      />
      <div className="space-y-2">
        {filtered.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
            <button
              onClick={() => toggleSession(s.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm font-mono w-5">#{sessions.length - i}</span>
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {new Date(s.started_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    <span className="text-gray-500 font-normal ml-2 text-xs">
                      {new Date(s.started_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDuration(s.started_at, s.ended_at)} · {s.message_count} messages
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] ?? 'bg-gray-700 text-gray-400'}`}>
                  {s.status}
                </span>
                <span className="text-gray-600 text-sm">{expanded === s.id ? '↑' : '↓'}</span>
              </div>
            </button>

            {expanded === s.id && (
              <div className="border-t border-gray-800 px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
                {!msgCache[s.id] ? (
                  <p className="text-sm text-gray-500 animate-pulse">Loading messages…</p>
                ) : msgCache[s.id].length === 0 ? (
                  <p className="text-sm text-gray-500">No messages in this session.</p>
                ) : (
                  msgCache[s.id]
                    .filter((m) => m.content_type === 'text')
                    .map((m, j) => (
                      <div key={j} className="text-sm">
                        <span className="font-medium text-indigo-400">{m.author}: </span>
                        <span className="text-gray-300 line-clamp-2">{m.content}</span>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
