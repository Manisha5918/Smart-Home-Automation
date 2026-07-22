import React from 'react';

export const formatInline = (text) => {
  const parts = [];
  let currentIdx = 0;
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchStr = match[0];
    const matchIdx = match.index;

    if (matchIdx > currentIdx) {
      parts.push(text.substring(currentIdx, matchIdx));
    }

    if (matchStr.startsWith('**') && matchStr.endsWith('**')) {
      parts.push(
        <strong key={matchIdx} className="font-bold text-[var(--text-primary)]">
          {matchStr.slice(2, -2)}
        </strong>
      );
    } else if (matchStr.startsWith('`') && matchStr.endsWith('`')) {
      parts.push(
        <code key={matchIdx} className="bg-gray-100 dark:bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-md font-mono text-sm border border-[var(--border-color)] text-[var(--accent-primary)]">
          {matchStr.slice(1, -1)}
        </code>
      );
    }

    currentIdx = regex.lastIndex;
  }

  if (currentIdx < text.length) {
    parts.push(text.substring(currentIdx));
  }

  return parts.length > 0 ? parts : text;
};

export const parseMarkdown = (text) => {
  if (!text) return '';
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeContent = [];

  return lines.map((line, idx) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const code = codeContent.join('\n');
        codeContent = [];
        return (
          <pre key={idx} className="bg-gray-100 dark:bg-[var(--bg-tertiary)] border border-[var(--border-color)] p-3 px-4 rounded-xl text-sm overflow-x-auto font-mono my-2 text-[var(--text-primary)]">
            <code>{code}</code>
          </pre>
        );
      } else {
        inCodeBlock = true;
        return null;
      }
    }

    if (inCodeBlock) {
      codeContent.push(line);
      return null;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <li key={idx} className="ml-5 mb-1 text-sm">
          {formatInline(line.trim().substring(2))}
        </li>
      );
    }

    return (
      <p key={idx} className="mb-2 text-sm leading-relaxed">
        {formatInline(line)}
      </p>
    );
  }).filter(el => el !== null);
};
