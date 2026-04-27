'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import SessionTimer from './SessionTimer';
import InactivityBanner from './InactivityBanner';
import { saveLocalSessionDraft } from '@/lib/session/state';

interface Message {
  id: string;
  author: string;
  author_type: string;
  content: string;
  content_type: string;
  created_at: string;
}

interface Session {
  id: string;
  planned_duration_minutes: number | null;
  status: string;
}

interface Props {
  session: Session;
  initialMessages: Message[];
  classroomId: string;
  classroomTitle: string;
  onEnd: () => void;
}

export default function SessionView({ session, initialMessages, classroomId, classroomTitle, onEnd }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [ending, setEnding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist state to DB every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const lastMsg = messages[messages.length - 1];
      await fetch(`/api/sessions/${session.id}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scroll_position: scrollRef.current?.scrollTop ?? 0,
          last_message_id: lastMsg?.id ?? null,
        }),
      });
      saveLocalSessionDraft(classroomId, {
        sessionId: session.id,
        classroomId,
        lastMessageId: lastMsg?.id ?? null,
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, [session.id, classroomId, messages]);

  const handlePause = useCallback(async () => {
    if (isPaused) return;
    setIsPaused(true);
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paused' }),
    });
  }, [isPaused, session.id]);

  async function handleEnd() {
    setEnding(true);
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    onEnd();
  }

  async function handleTimerExpired() {
    await handleEnd();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');

    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      author: 'You',
      author_type: 'user',
      content,
      content_type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-gray-200 truncate max-w-xs">{classroomTitle}</span>
        </div>
        <div className="flex items-center gap-4">
          {session.planned_duration_minutes && (
            <SessionTimer
              durationMinutes={session.planned_duration_minutes}
              onExpired={handleTimerExpired}
            />
          )}
          <button
            onClick={handleEnd}
            disabled={ending}
            className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-red-600 text-gray-400 hover:text-red-400 text-sm transition-colors disabled:opacity-50"
          >
            {ending ? 'Ending…' : 'End Session'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-12">
            Session started. Ask a question or request an explanation to begin.
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.author_type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.author_type !== 'user' && (
              <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {msg.author[0]}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.author_type === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {msg.author_type !== 'user' && (
                <p className="text-xs font-semibold text-indigo-300 mb-1">{msg.author}</p>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800 flex gap-3 flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question, request an explanation, or explore an idea…"
          rows={1}
          className="flex-1 resize-none rounded-xl bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none px-4 py-2.5 text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          Send
        </button>
      </div>

      <InactivityBanner onPause={handlePause} />
    </div>
  );
}
