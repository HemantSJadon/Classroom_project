'use client';

interface CardData {
  type: 'concept' | 'summary' | 'insight';
  title: string;
  body: string;
  tags: string[];
}

interface Props {
  data: CardData;
}

const CARD_STYLES: Record<string, { border: string; badge: string; icon: string }> = {
  concept: { border: 'border-indigo-700/60', badge: 'bg-indigo-900/60 text-indigo-300', icon: '◆' },
  summary: { border: 'border-teal-700/60', badge: 'bg-teal-900/60 text-teal-300', icon: '◉' },
  insight: { border: 'border-amber-700/60', badge: 'bg-amber-900/60 text-amber-300', icon: '✦' },
};

export default function ConceptCard({ data }: Props) {
  const style = CARD_STYLES[data.type] ?? CARD_STYLES.concept;

  return (
    <div className={`rounded-xl border ${style.border} bg-gray-900/80 p-4 space-y-3`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-100 text-sm leading-snug">{data.title}</h3>
        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
          {style.icon} {data.type}
        </span>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">{data.body}</p>

      {data.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 border border-gray-700">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
