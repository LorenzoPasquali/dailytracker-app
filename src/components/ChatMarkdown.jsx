import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders an AI chat message as Markdown (GitHub-flavored: tables, lists, code).
 * Styling lives in the `.chat-md` block in index.css so it stays compact and theme-aware.
 * Links open in a new tab.
 */
export default function ChatMarkdown({ children }) {
  return (
    <div className="chat-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}
