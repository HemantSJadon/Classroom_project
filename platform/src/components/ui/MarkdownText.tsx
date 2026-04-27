'use client';

import React from 'react';

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-gray-100">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="px-1 py-0.5 rounded bg-gray-700 text-indigo-300 font-mono text-xs">{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export default function MarkdownText({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        // Fenced code block
        if (block.startsWith('```')) {
          const lang = block.match(/^```(\w*)/)?.[1] ?? '';
          const code = block.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '');
          return (
            <pre key={i} className="rounded-lg bg-gray-950 border border-gray-700 p-3 overflow-x-auto">
              {lang && <div className="text-xs text-gray-500 mb-2 font-mono">{lang}</div>}
              <code className="text-xs font-mono text-gray-300 whitespace-pre">{code}</code>
            </pre>
          );
        }

        // Heading ##
        if (block.startsWith('## '))
          return <h4 key={i} className="font-semibold text-gray-100 text-sm mt-1">{renderInline(block.slice(3))}</h4>;

        // Heading #
        if (block.startsWith('# '))
          return <h3 key={i} className="font-bold text-gray-100 text-base mt-1">{renderInline(block.slice(2))}</h3>;

        // Bullet / numbered list (consecutive lines starting with - * or 1.)
        const lines = block.split('\n');
        const isBullet = lines.every(l => /^[-*]\s/.test(l) || l.trim() === '');
        const isNumbered = lines.every(l => /^\d+\.\s/.test(l) || l.trim() === '');

        if (isBullet) {
          return (
            <ul key={i} className="list-none space-y-1 pl-2">
              {lines.filter(l => /^[-*]\s/.test(l)).map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-indigo-400 flex-shrink-0 mt-0.5">•</span>
                  <span>{renderInline(l.replace(/^[-*]\s/, ''))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (isNumbered) {
          return (
            <ol key={i} className="list-none space-y-1 pl-2">
              {lines.filter(l => /^\d+\.\s/.test(l)).map((l, j) => (
                <li key={j} className="flex gap-2">
                  <span className="text-indigo-400 flex-shrink-0 font-mono text-xs mt-0.5 w-4">{j + 1}.</span>
                  <span>{renderInline(l.replace(/^\d+\.\s/, ''))}</span>
                </li>
              ))}
            </ol>
          );
        }

        // Mixed block — render line by line with inline formatting
        return (
          <p key={i} className="text-gray-200">
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {renderInline(line)}
                {j < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
