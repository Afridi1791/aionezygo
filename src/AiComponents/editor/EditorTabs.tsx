import React from 'react';
import { StagedChanges, AiActionEnum } from '../../types';

// Professional SVG Icons
const FileIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CloseIcon = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CodeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

interface EditorTabsProps {
  openFiles: string[];
  activeFile: string | null;
  stagedChanges: StagedChanges | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}

const getFileName = (path: string) => path.split('/').pop() || path;

const EditorTabs: React.FC<EditorTabsProps> = ({ openFiles, activeFile, stagedChanges, onSelectTab, onCloseTab }) => {
  // Show only the active file, not multiple tabs
  if (!activeFile) {
    return (
        <div className="flex-shrink-0 bg-bg-primary h-[50px] border-b border-border-primary flex items-center px-6">
          <div className="flex items-center space-x-3">
            <CodeIcon className="w-5 h-5 text-text-secondary" />
            <span className="text-text-secondary text-sm font-medium">No file selected</span>
          </div>
        </div>
    );
  }

  const getStatusColor = (path: string) => {
    const action = stagedChanges?.actions.find(a => a.path === path);
    if (!action) return 'text-text-secondary';
    
    switch (action.action) {
      case AiActionEnum.CREATE_FILE: return 'text-emerald-400';
      case AiActionEnum.UPDATE_FILE: return 'text-amber-400';
      case AiActionEnum.DELETE_FILE: return 'text-rose-400';
      default: return 'text-text-secondary';
    }
  };

  // Show only the currently active file
  const statusColor = getStatusColor(activeFile);
  const isDeleted = stagedChanges?.actions.find(a => a.path === activeFile)?.action === AiActionEnum.DELETE_FILE;

  return (
    <div className="flex-shrink-0 bg-bg-primary border-b border-border-primary">
      <div className="flex items-center justify-between px-6 py-3 h-[50px]">
        <div className="flex items-center flex-1 min-w-0">
          <FileIcon className={`w-5 h-5 mr-3 flex-shrink-0 text-accent-primary`} />
          <span className={`text-sm font-medium text-text-primary truncate ${isDeleted ? 'line-through' : ''}`} title={activeFile}>
            {getFileName(activeFile)}
          </span>
          {statusColor !== 'text-text-secondary' && (
            <div className={`w-2 h-2 rounded-full ml-2 flex-shrink-0 ${
              statusColor === 'text-emerald-400' ? 'bg-emerald-400' :
              statusColor === 'text-amber-400' ? 'bg-amber-400' :
              statusColor === 'text-rose-400' ? 'bg-rose-400' : 'bg-text-secondary'
            }`} />
          )}
        </div>
        <button
          onClick={() => onCloseTab(activeFile)}
          className="w-7 h-7 p-1.5 rounded-lg flex-shrink-0 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-glass transition-all duration-200"
          aria-label={`Close ${getFileName(activeFile)}`}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

// Remove the style tag as it's not needed for single file view

export default EditorTabs;
