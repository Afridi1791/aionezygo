import React, { useState } from 'react';
// import GlobeIcon from '../icons/GlobeIcon'; // Replaced with SimpleIcon/FaviconIcon
// import ChevronDownIcon from '../icons/ChevronDownIcon'; // Replaced with SimpleIcon/FaviconIcon
// Professional SVG Icons
const ChevronDownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
import FaviconIcon from '../../components/FaviconIcon';

interface CitationsProps {
  citations: { uri: string; title: string }[];
}

const getHostname = (uri: string): string => {
    try {
        const url = new URL(uri);
        return url.hostname.replace(/^www\./, ''); // Remove www. for a cleaner look
    } catch (e) {
        // Fallback for URIs that might not be fully qualified
        const match = uri.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/);
        return match ? match[1] : uri;
    }
};

const Citations: React.FC<CitationsProps> = ({ citations }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-neutral-700/60 pt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 text-xs font-semibold uppercase text-neutral-400 mb-2 hover:text-white transition-colors"
        aria-expanded={isOpen}
        aria-controls="citations-list"
      >
        <div className="flex items-center gap-2">
            <FaviconIcon className="w-4 h-4" size={4} />
            <span>Sources ({citations.length})</span>
        </div>
        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div id="citations-list" className="space-y-2 animate-fade-in-down">
          {citations.map((citation, index) => (
            <a
              href={citation.uri}
              target="_blank"
              rel="noopener noreferrer"
              key={index}
              className="block p-3 rounded-lg bg-neutral-900/50 hover:bg-neutral-700/50 transition-colors group"
              title={citation.uri}
            >
              <div className="text-sm font-medium text-neutral-200 group-hover:text-accent-light group-hover:underline truncate">
                {citation.title || 'Untitled Source'}
              </div>
              <div className="flex items-center text-xs text-neutral-400 truncate mt-1.5">
                  <FaviconIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-neutral-500" size={3} />
                  <span className="truncate">{getHostname(citation.uri)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
       <style>{`
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.2s ease-out forwards;
        }
       `}</style>
    </div>
  );
};

export default Citations;
