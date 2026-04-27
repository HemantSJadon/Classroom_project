'use client';

import { useState } from 'react';

interface Props {
  onMindMap: () => void;
  onCard: (type: 'concept' | 'summary' | 'insight') => void;
  disabled?: boolean;
}

const CARD_TYPES = [
  { type: 'concept' as const, label: 'Concept', icon: '◆' },
  { type: 'summary' as const, label: 'Summary', icon: '◉' },
  { type: 'insight' as const, label: 'Insight', icon: '✦' },
];

export default function SessionToolbar({ onMindMap, onCard, disabled }: Props) {
  const [cardMenuOpen, setCardMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-800/50">
      <span className="text-xs text-gray-600 mr-1">Generate:</span>

      <button
        onClick={onMindMap}
        disabled={disabled}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-indigo-300 hover:border-indigo-700 disabled:opacity-40 transition-colors"
      >
        <span>⬡</span> Mind Map
      </button>

      <div className="relative">
        <button
          onClick={() => setCardMenuOpen((v) => !v)}
          disabled={disabled}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-teal-300 hover:border-teal-700 disabled:opacity-40 transition-colors"
        >
          <span>▣</span> Card ↓
        </button>
        {cardMenuOpen && (
          <div className="absolute bottom-full mb-1 left-0 z-20 rounded-lg border border-gray-700 bg-gray-800 shadow-xl overflow-hidden text-xs">
            {CARD_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => { setCardMenuOpen(false); onCard(type); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-300 flex items-center gap-2 whitespace-nowrap"
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
