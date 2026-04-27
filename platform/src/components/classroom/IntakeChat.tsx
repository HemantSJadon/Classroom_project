'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { LLMMessage } from '@/lib/llm/provider';

interface IntakeResult {
  ready: boolean;
  title: string;
  topic_summary: string;
}

interface Props {
  onComplete: (result: IntakeResult) => void;
  onCancel: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

function parseIntakeResult(text: string): IntakeResult | null {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed.ready && parsed.title && parsed.topic_summary) return parsed;
  } catch {}
  return null;
}

export default function IntakeChat({ onComplete, onCancel }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startIntake = useCallback(async () => {
    setIsStreaming(true);
    setMessages([{ role: 'assistant', content: '', streaming: true }]);

    abortRef.current = new AbortController();
    let accumulated = '';

    const res = await fetch('/api/classrooms/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
      signal: abortRef.current.signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const { token } = JSON.parse(line.slice(6));
            accumulated += token;
            setMessages([{ role: 'assistant', content: accumulated, streaming: true }]);
          } catch {}
        }
        if (line.startsWith('event: done')) {
          setMessages([{ role: 'assistant', content: accumulated }]);
          setIsStreaming(false);
        }
      }
    }
  }, []);

  useEffect(() => { startIntake(); }, [startIntake]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, { role: 'assistant', content: '', streaming: true }]);
    setInput('');
    setIsStreaming(true);

    const llmMessages: LLMMessage[] = nextMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    abortRef.current = new AbortController();
    let accumulated = '';

    const res = await fetch('/api/classrooms/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: llmMessages }),
      signal: abortRef.current.signal,
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const { token } = JSON.parse(line.slice(6));
            accumulated += token;
            setMessages([...nextMessages, { role: 'assistant', content: accumulated, streaming: true }]);
          } catch {}
        }
        if (line.startsWith('event: done')) {
          const finalMessage: ChatMessage = { role: 'assistant', content: accumulated };
          setMessages([...nextMessages, finalMessage]);
          setIsStreaming(false);
          const result = parseIntakeResult(accumulated);
          if (result) onComplete(result);
        }
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {msg.content || (msg.streaming ? <span className="animate-pulse">…</span> : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-800 flex gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your reply…"
          disabled={isStreaming}
          rows={1}
          className="flex-1 resize-none rounded-xl bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none px-4 py-2.5 text-sm disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          Send
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
