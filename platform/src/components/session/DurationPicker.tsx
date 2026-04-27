'use client';

const OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: 'No limit', value: null },
];

interface Props {
  value: number | null;
  onChange: (minutes: number | null) => void;
}

export default function DurationPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-300">Session duration</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              value === opt.value
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
