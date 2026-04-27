'use client';

import { useEffect, useState } from 'react';
import { initInactivityDetection } from '@/lib/session/inactivity';

interface Props {
  onPause: () => void;
}

export default function InactivityBanner({ onPause }: Props) {
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    const cleanup = initInactivityDetection(() => setInactive(true));
    return cleanup;
  }, []);

  // When activity resumes, clear the banner (but session was already paused)
  useEffect(() => {
    if (!inactive) return;
    onPause();
  }, [inactive, onPause]);

  if (!inactive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="rounded-2xl border border-gray-700 bg-gray-900 p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
        <p className="text-lg font-semibold text-gray-100">Session paused</p>
        <p className="text-sm text-gray-400">
          You seemed to step away. Your progress is saved.
        </p>
        <button
          onClick={() => setInactive(false)}
          className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Resume Session
        </button>
      </div>
    </div>
  );
}
