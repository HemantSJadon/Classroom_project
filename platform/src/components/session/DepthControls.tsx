'use client';

import { useState } from 'react';
import { DEPTH_LABELS } from '@/lib/prompts/instructor';

const DEPTHS = Object.keys(DEPTH_LABELS) as Array<keyof typeof DEPTH_LABELS>;

interface Props {
  onSelect: (depth: string) => void;
  disabled?: boolean;
}

export default function DepthControls({ onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors px-2 py-1 rounded border border-indigo-900 hover:border-indigo-700"
      >
        Re-explain ↓
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 rounded-lg border border-gray-700 bg-gray-800 shadow-xl overflow-hidden text-xs">
          {DEPTHS.map((d) => (
            <button
              key={d}
              onClick={() => { setOpen(false); onSelect(d); }}
              className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-300 whitespace-nowrap"
            >
              {DEPTH_LABELS[d]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
