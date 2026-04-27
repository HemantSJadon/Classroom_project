'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import SessionTimer from './SessionTimer';
import InactivityBanner from './InactivityBanner';
import MessageBubble, { type ChatMessage } from './MessageBubble';
import { useSSEStream } from '@/lib/session/useSSEStream';
import { saveLocalSessionDraft } from '@/lib/session/state';
import { shouldSummarise } from '@/lib/context/manager';

interface Session {
  id: string;
  planned_duration_minutes: number | null;
  status: string;
}

interface Props {
  session: Session;
  initialMessages: ChatMessage[];
  classroomId: string;
  classroomTitle: string;
  onEnd: () => void;
}

export default function SessionView({ session, initialMessages, classroomId, classroomTitle, onEnd }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isReexplaining, setIsReexplaining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ending, setEnding] = useState(false);
  const turnIndexRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { stream } = useSSEStream();
  const { stream: streamColearners } = useSSEStream();
  const { stream: streamReexplain } = useSSEStream();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Auto-save state every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const lastMsg = messages[messages.length - 1];
      await fetch(`/api/sessions/${session.id}/state`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scroll_position: scrollRef.current?.scrollTop ?? 0, last_message_id: lastMsg?.id ?? null }),
      });
      saveLocalSessionDraft(classroomId, { sessionId: session.id, classroomId, lastMessageId: lastMsg?.id ?? null });
    }, 30_000);
    return () => clearInterval(interval);
  }, [session.id, classroomId, messages]);

  const addMessage = useCallback((msg: ChatMessage) =>
    setMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg]), []);

  const updateStreaming = useCallback((id: string, token: string) =>
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: m.content + token } : m)), []);

  async function sendMessage() {
    if (!input.trim() || isSending) return;
    const content = input.trim();
    setInput('');
    setIsSending(true);

    const tempUserId = `temp_${Date.now()}`;
    addMessage({ id: tempUserId, author: 'You', author_type: 'user', content, content_type: 'text' });

    const instrId = `instr_${Date.now()}`;
    addMessage({ id: instrId, author: 'Instructor', author_type: 'instructor', content: '', content_type: 'text', streaming: true });

    let instructorMessageId = '';
    let totalMessages = 0;

    try {
      await stream(`/api/sessions/${session.id}/chat`, { content }, {
        onEvent: (event, data) => {
          if (event === 'user_saved' && data.id) {
            setMessages((prev) => prev.map((m) => m.id === tempUserId ? { ...m, id: data.id } : m));
          }
        },
        onToken: (token) => updateStreaming(instrId, token),
        onDone: (data) => {
          instructorMessageId = data.instructor_message_id;
          totalMessages = parseInt(data.total_messages ?? '0', 10);
          setMessages((prev) => prev.map((m) => m.id === instrId
            ? { ...m, id: instructorMessageId || m.id, streaming: false }
            : m));
        },
      });

      // Trigger rolling summary if needed
      if (shouldSummarise(totalMessages)) {
        fetch(`/api/sessions/${session.id}/summarise`, { method: 'POST' }).catch(() => {});
      }

      // Trigger co-learner questions
      if (instructorMessageId) {
        const turn = turnIndexRef.current++;
        const placeholders: ChatMessage[] = [];

        await streamColearners(`/api/sessions/${session.id}/colearners`, {
          instructor_message_id: instructorMessageId, turn_index: turn,
        }, {
          onEvent: (event, data) => {
            if (event === 'persona_start') {
              const ph: ChatMessage = { id: `cl_${data.persona_id}`, author: data.persona_name, author_type: 'colearner', content: '', content_type: 'question', streaming: true };
              placeholders.push(ph);
              addMessage(ph);
            } else if (event === 'persona_done') {
              setMessages((prev) => prev.map((m) =>
                m.id === `cl_${data.persona_id}` ? { ...m, id: data.message_id || m.id, streaming: false } : m));
            }
          },
          onToken: (token, raw) => {
            const ph = placeholders.find((p) => p.id === `cl_${raw.persona_id}`);
            if (ph) updateStreaming(ph.id, token);
          },
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsSending(false);
    }
  }

  async function handleReexplain(messageId: string, depth: string) {
    setIsReexplaining(true);
    const rId = `reexplain_${Date.now()}`;
    addMessage({ id: rId, author: 'Instructor', author_type: 'instructor', content: '', content_type: 'text', streaming: true, metadata: { depth, reexplain: true } });

    try {
      await streamReexplain(`/api/sessions/${session.id}/reexplain`, { message_id: messageId, depth }, {
        onToken: (token) => updateStreaming(rId, token),
        onDone: (data) => setMessages((prev) => prev.map((m) =>
          m.id === rId ? { ...m, id: data.message_id || m.id, streaming: false } : m)),
      });
    } finally {
      setIsReexplaining(false);
    }
  }

  const handlePause = useCallback(async () => {
    if (isPaused) return;
    setIsPaused(true);
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paused' }),
    });
  }, [isPaused, session.id]);

  async function handleEnd() {
    setEnding(true);
    await fetch(`/api/sessions/${session.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    onEnd();
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium text-gray-200 truncate max-w-xs">{classroomTitle}</span>
        </div>
        <div className="flex items-center gap-4">
          {session.planned_duration_minutes && (
            <SessionTimer durationMinutes={session.planned_duration_minutes} onExpired={handleEnd} />
          )}
          <button onClick={handleEnd} disabled={ending}
            className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-red-600 text-gray-400 hover:text-red-400 text-sm transition-colors disabled:opacity-50">
            {ending ? 'Ending…' : 'End Session'}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-16 space-y-2">
            <p className="text-base font-medium text-gray-400">Session started</p>
            <p>Ask a question or request an explanation to begin.</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} sessionId={session.id}
            onReexplain={handleReexplain} isReexplaining={isReexplaining} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-800 flex gap-3 flex-shrink-0">
        <textarea value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Ask a question, request an explanation, or explore an idea…"
          disabled={isSending} rows={1}
          className="flex-1 resize-none rounded-xl bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none px-4 py-2.5 text-sm disabled:opacity-50" />
        <button onClick={sendMessage} disabled={isSending || !input.trim()}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors">
          {isSending ? '…' : 'Send'}
        </button>
      </div>

      <InactivityBanner onPause={handlePause} />
    </div>
  );
}
