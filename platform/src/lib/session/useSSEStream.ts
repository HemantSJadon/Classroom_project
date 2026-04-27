import { useCallback, useRef } from 'react';

type EventHandlers = {
  onToken?: (token: string, raw: Record<string, string>) => void;
  onEvent?: (event: string, data: Record<string, string>) => void;
  onDone?: (data: Record<string, string>) => void;
  onError?: (data: Record<string, string>) => void;
};

export function useSSEStream() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (url: string, body: unknown, handlers: EventHandlers) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortRef.current.signal,
    });

    if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let lastEvent = '';
    let lineBuffer = ''; // buffers incomplete lines across network chunks

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Prepend any buffered incomplete line from the previous chunk
      const text = lineBuffer + decoder.decode(value, { stream: true });
      const lines = text.split('\n');
      // The last element may be an incomplete line — buffer it for next chunk
      lineBuffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          lastEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (lastEvent === 'token') {
              handlers.onToken?.(data.token ?? '', data);
            } else if (lastEvent === 'done') {
              handlers.onDone?.(data);
            } else if (lastEvent === 'error') {
              handlers.onError?.(data);
            } else if (lastEvent) {
              handlers.onEvent?.(lastEvent, data);
            }
            lastEvent = '';
          } catch {}
        }
        // Ignore comment lines (keepalive: ": keepalive")
      }
    }
  }, []);

  const abort = useCallback(() => abortRef.current?.abort(), []);

  return { stream, abort };
}
