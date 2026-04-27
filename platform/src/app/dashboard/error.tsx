'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 text-xl">
        ✕
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-gray-200">Something went wrong</p>
        <p className="text-sm text-gray-500 max-w-xs">
          {error.message || 'An unexpected error occurred in the dashboard.'}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-300 text-sm font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
