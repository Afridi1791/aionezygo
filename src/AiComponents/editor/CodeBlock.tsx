import React, { useState } from 'react';
// Professional SVG Icons
const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lineCount = code.split('\n').length;
  const shouldCollapse = lineCount > 24; // threshold for collapsing

  return (
    <div className="bg-neutral-950 rounded-lg border border-neutral-700/50 my-4 not-prose shadow-lg">
      <div className="flex justify-between items-center px-4 py-1.5 bg-neutral-800/50 rounded-t-lg border-b border-neutral-700/50">
        <span className="text-xs font-sans text-neutral-400 select-none">{language || 'code'}</span>
        <div className="flex items-center gap-2">
          {shouldCollapse && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              {expanded ? 'Show less' : `Show more (${lineCount} lines)`}
            </button>
          )}
          <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors disabled:opacity-50" disabled={copied}>
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <PlusIcon className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <div className="relative">
        {!expanded && shouldCollapse && (
          <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none bg-gradient-to-t from-neutral-950 to-transparent rounded-b-lg" />
        )}
        <div className={!expanded && shouldCollapse ? 'max-h-64 overflow-hidden' : ''}>
          <pre className="m-0 p-4 bg-transparent text-neutral-200 text-sm whitespace-pre-wrap break-words">
            <code className={`font-mono leading-6 ${language ? `language-${language}` : ''}`}>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;
