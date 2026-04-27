'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  sessionId: string;
  onContinue: () => void;
}

export default function RecapDisplay({ sessionId, onContinue }: Props) {
  const [recap, setRecap] = useState('');
  const [done, setDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current = new AbortController();
    let accumulated = '';

    async function stream() {
      const res = await fetch(`/api/sessions/${sessionId}/recap`, {
        method: 'POST',
        signal: abortRef.current!.signal,
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const { token } = JSON.parse(line.slice(6));
              accumulated += token;
              setRecap(accumulated);
            } catch {}
          }
          if (line.startsWith('event: done')) setDone(true);
        }
      }
    }

    stream().catch(() => {});
    return () => abortRef.current?.abort();
  }, [sessionId]);

  return (
    <div className="flex flex-col h-full p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-gray-100">Session Recap</h2>
        <p className="text-sm text-gray-400">Here is what was covered in your previous session.</p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl bg-gray-900 border border-gray-800 p-5">
        {recap ? (
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{recap}</p>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="animate-pulse">Generating recap…</span>
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        disabled={!done}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
      >
        {done ? 'Continue to Session →' : 'Loading recap…'}
      </button>
    </div>
  );
}
