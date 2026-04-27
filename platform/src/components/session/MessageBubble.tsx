'use client';

import dynamic from 'next/dynamic';
import DepthControls from './DepthControls';
import ConceptCard from './ConceptCard';

const MindMapRenderer = dynamic(() => import('./MindMapRenderer'), { ssr: false });

export interface ChatMessage {
  id: string;
  author: string;
  author_type: 'user' | 'colearner' | 'instructor';
  content: string;
  content_type: string;
  streaming?: boolean;
  metadata?: Record<string, unknown> | null;
}

const PERSONA_COLORS: Record<string, string> = {
  Alex: 'bg-orange-700', Priya: 'bg-teal-700', Marcus: 'bg-red-700',
  Sofia: 'bg-pink-700', James: 'bg-yellow-700', Instructor: 'bg-indigo-700',
};

interface Props {
  message: ChatMessage;
  sessionId: string;
  onReexplain: (messageId: string, depth: string) => void;
  isReexplaining?: boolean;
}

function RichContent({ message }: { message: ChatMessage }) {
  if (message.streaming || !message.content) {
    return (
      <span className="inline-flex gap-1">
        {[0, 150, 300].map((d) => (
          <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </span>
    );
  }
  if (message.content_type === 'mindmap') {
    try {
      const data = JSON.parse(message.content);
      return <MindMapRenderer data={data} />;
    } catch { return <span className="text-gray-400 text-xs">Invalid mind map data</span>; }
  }
  if (message.content_type === 'card') {
    try {
      const data = JSON.parse(message.content);
      return <ConceptCard data={data} />;
    } catch { return <span className="text-gray-400 text-xs">Invalid card data</span>; }
  }
  return <>{message.content}</>;
}

export default function MessageBubble({ message, sessionId: _sessionId, onReexplain, isReexplaining }: Props) {
  const isUser = message.author_type === 'user';
  const isRich = message.content_type === 'mindmap' || message.content_type === 'card';
  const avatarColor = PERSONA_COLORS[message.author] ?? 'bg-gray-600';
  const isReexplained = message.metadata?.reexplain === true;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1`}>
          {message.author[0]}
        </div>
      )}

      <div className={`space-y-1 flex flex-col ${isUser ? 'items-end max-w-[75%]' : isRich ? 'w-full max-w-[90%]' : 'items-start max-w-[75%]'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-gray-400">{message.author}</span>
            {message.author_type === 'colearner' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">co-learner</span>
            )}
            {isReexplained && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-400">re-explained</span>
            )}
          </div>
        )}

        <div className={isRich ? 'w-full' : `rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? 'bg-indigo-600 text-white rounded-br-sm'
            : message.author_type === 'colearner' ? 'bg-gray-800/80 text-gray-200 border border-gray-700 rounded-bl-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}>
          <RichContent message={message} />
        </div>

        {message.author_type === 'instructor' && !message.streaming && message.content && message.content_type === 'text' && (
          <div className="px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DepthControls onSelect={(depth) => onReexplain(message.id, depth)} disabled={isReexplaining} />
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
          Y
        </div>
      )}
    </div>
  );
}
