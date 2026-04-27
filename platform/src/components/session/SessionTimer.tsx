'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  durationMinutes: number;
  onExpired: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function SessionTimer({ durationMinutes, onExpired }: Props) {
  const total = durationMinutes * 60;
  const [remaining, setRemaining] = useState(total);
  const expiredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        if (!expiredRef.current) {
          expiredRef.current = true;
          setTimeout(() => onExpiredRef.current(), 0);
        }
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const pct = Math.round((remaining / total) * 100);
  const warn = remaining < 300; // last 5 minutes

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={warn ? '#ef4444' : '#6366f1'}
            strokeWidth="3"
            strokeDasharray="100"
            strokeDashoffset={100 - pct}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className={`text-sm font-mono font-semibold tabular-nums ${warn ? 'text-red-400' : 'text-gray-300'}`}>
        {formatTime(remaining)}
      </span>
    </div>
  );
}
