'use client';

import DepthControls from './DepthControls';

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
  Alex: 'bg-orange-700',
  Priya: 'bg-teal-700',
  Marcus: 'bg-red-700',
  Sofia: 'bg-pink-700',
  James: 'bg-yellow-700',
  Instructor: 'bg-indigo-700',
};

interface Props {
  message: ChatMessage;
  sessionId: string;
  onReexplain: (messageId: string, depth: string) => void;
  isReexplaining?: boolean;
}

export default function MessageBubble({ message, sessionId: _sessionId, onReexplain, isReexplaining }: Props) {
  const isUser = message.author_type === 'user';
  const avatarColor = PERSONA_COLORS[message.author] ?? 'bg-gray-600';
  const isReexplained = message.metadata?.reexplain === true;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1`}>
          {message.author[0]}
        </div>
      )}

      <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold text-gray-400">{message.author}</span>
            {message.author_type === 'colearner' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">co-learner</span>
            )}
            {isReexplained && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-400">
                re-explained
              </span>
            )}
          </div>
        )}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : message.author_type === 'colearner'
            ? 'bg-gray-800/80 text-gray-200 border border-gray-700 rounded-bl-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}>
          {message.content || (message.streaming ? (
            <span className="inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : '')}
        </div>

        {message.author_type === 'instructor' && !message.streaming && message.content && (
          <div className="px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DepthControls
              onSelect={(depth) => onReexplain(message.id, depth)}
              disabled={isReexplaining}
            />
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
