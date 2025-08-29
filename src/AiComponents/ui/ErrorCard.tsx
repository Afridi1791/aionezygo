import React from 'react';
import XCircleIcon from '../../icons/XCircleIcon';
import SparklesIcon from '../../icons/SparklesIcon';
import XIcon from '../../icons/XIcon';
// Professional SVG Icons
const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
import FaviconIcon from '../../components/FaviconIcon';

interface ErrorCardProps {
  error: string | { message: string } | null;
  onFix: () => void;
  onIgnore: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error, onFix, onIgnore }) => {
  // Safely extract error message
  const getErrorMessage = (err: string | { message: string } | null): string => {
    if (!err) return 'Unknown error occurred';
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err.message) return err.message;
    return 'Unknown error occurred';
  };

  const errorMessage = getErrorMessage(error);

  // Don't render if no error message
  if (!errorMessage || errorMessage.trim() === '') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-rose-900/20 to-red-900/20 border border-rose-500/30 rounded-xl p-3 sm:p-4 my-4 animate-fade-in-sm max-w-full shadow-lg backdrop-blur-sm">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-rose-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <CloseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-rose-300 text-sm sm:text-base flex items-center gap-2">
              <span>Build Error</span>
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse"></div>
            </h3>
          </div>
          <div className="mt-2 text-xs sm:text-sm text-rose-100 bg-black/40 border border-rose-500/20 p-3 sm:p-4 rounded-lg font-mono max-h-32 sm:max-h-48 overflow-y-auto scrollbar-thin">
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {errorMessage}
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-300/70">
            💡 Click "Fix with AI" for comprehensive error analysis and automatic resolution
          </div>
          <div className="mt-1 text-xs text-rose-400/60">
            🔧 Enhanced AI will analyze project context, dependencies, and provide complete fixes
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3">
        <button
          onClick={onIgnore}
          className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 border border-neutral-700 transition-all duration-200 hover:scale-105 hover:border-neutral-600"
        >
                          <CloseIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Dismiss</span>
        </button>
        <button
          onClick={onFix}
          className="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg bg-gradient-to-r from-accent to-accent-light text-black hover:from-accent-light hover:to-accent transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-accent/25"
        >
          <FaviconIcon className="w-3 h-3 sm:w-4 sm:h-4" size={4} />
          <span>Fix with AI</span>
        </button>
      </div>
    </div>
  );
};

// Add custom scrollbar and animation styles
const styles = `
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(239, 68, 68, 0.4);
    border-radius: 3px;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgba(239, 68, 68, 0.6);
  }
  @keyframes fade-in-sm {
    from { 
      opacity: 0; 
      transform: translateY(10px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }
  .animate-fade-in-sm {
    animation: fade-in-sm 0.3s ease-out forwards;
  }
`;

// Inject styles safely
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const existingStyle = document.getElementById('error-card-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-card-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}

export default ErrorCard;
