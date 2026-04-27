'use client';

import { useState, useCallback } from 'react';
import SessionSetup from '@/components/session/SessionSetup';
import SessionView from '@/components/session/SessionView';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import type { ChatMessage } from '@/components/session/MessageBubble';

interface Classroom {
  id: string;
  title: string;
  topic_summary: string | null;
}

interface SessionData {
  id: string;
  planned_duration_minutes: number | null;
  status: string;
  ended_at: string | null;
  recap_content: string | null;
  recap_shown: boolean;
}

interface Props {
  classroom: Classroom;
  previousSession: SessionData | null;
}

type View = 'setup' | 'session' | 'ended';

interface ActiveSession {
  id: string;
  planned_duration_minutes: number | null;
  status: string;
}

export default function ClassroomClient({ classroom, previousSession }: Props) {
  const [view, setView] = useState<View>('setup');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(async (durationMinutes: number | null) => {
    setError(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classroom_id: classroom.id,
          planned_duration_minutes: durationMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to start session');

      // Fetch existing messages if resuming
      const msgRes = await fetch(`/api/sessions/${data.session.id}`);
      const msgData = await msgRes.json();

      setActiveSession(data.session);
      setMessages(msgData.messages ?? []);
      setView('session');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }, [classroom.id]);

  const handleEnd = useCallback(() => {
    setActiveSession(null);
    setMessages([]);
    setView('ended');
  }, []);

  if (view === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
        <div className="space-y-2">
          <p className="text-xl font-semibold text-gray-100">Session complete</p>
          <p className="text-gray-400 text-sm">Great work. Your progress has been saved.</p>
        </div>
        <button
          onClick={() => setView('setup')}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Start another session
        </button>
      </div>
    );
  }

  if (view === 'session' && activeSession) {
    return (
      <div className="h-full flex flex-col">
        <ErrorBoundary>
          <SessionView
            session={activeSession}
            initialMessages={messages}
            classroomId={classroom.id}
            classroomTitle={classroom.title}
            onEnd={handleEnd}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="px-4 py-2 bg-red-900/40 border-b border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}
      <SessionSetup
        classroomId={classroom.id}
        classroomTitle={classroom.title}
        previousSession={previousSession}
        onStart={handleStart}
      />
    </div>
  );
}
