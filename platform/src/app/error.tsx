'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 text-2xl mx-auto">
            ✕
          </div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-gray-400 text-sm">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={reset}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
