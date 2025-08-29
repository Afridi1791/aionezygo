import React from 'react';
import { AiAction, AiActionEnum } from '../../types';
import FileIcon from '../../icons/FileIcon';
import SpinnerIcon from '../../icons/SpinnerIcon';
import CheckIcon from '../../icons/CheckIcon';
// Professional SVG Icons
const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

interface StreamingAIResponseProps {
  actions: AiAction[];
  streamingActionPath?: string;
  runningCommand?: string;
  onSelectFile: (path: string) => void;
}

const StreamingAIResponse: React.FC<StreamingAIResponseProps> = ({ actions, streamingActionPath, runningCommand, onSelectFile }) => {
  const isTypingCode = !!streamingActionPath;
  const isRunningCommand = !!runningCommand;
  const streamingIndex = isTypingCode ? actions.findIndex(a => a.path === streamingActionPath) : -1;
  const runningCommandIndex = isRunningCommand ? actions.findIndex(a => a.action === AiActionEnum.RUN_COMMAND && a.command === runningCommand) : -1;
  const allCompleted = !isTypingCode && !isRunningCommand && actions.length > 0;

  const getStatusIcon = (index: number) => {
    if (allCompleted || (isTypingCode && index < streamingIndex) || (isRunningCommand && index < runningCommandIndex)) {
      return <CheckIcon className="w-4 h-4 text-emerald-400" />;
    }
    if ((isTypingCode && index === streamingIndex) || (isRunningCommand && index === runningCommandIndex)) {
      return <SpinnerIcon className="w-4 h-4 text-blue-400 animate-spin" />;
    }
    return null;
  };

  const getActionLabel = (action: AiAction) => {
    switch (action.action) {
      case AiActionEnum.CREATE_FILE:
        return 'Create';
      case AiActionEnum.UPDATE_FILE:
        return 'Update';
      case AiActionEnum.DELETE_FILE:
        return 'Delete';
      case AiActionEnum.RUN_COMMAND:
        return 'RUN';
      default:
        return 'Edit';
    }
  };

  const getHeaderTitle = () => {
    if (actions.length === 0) return 'Processing...';
    
    const createCount = actions.filter(a => a.action === AiActionEnum.CREATE_FILE).length;
    const updateCount = actions.filter(a => a.action === AiActionEnum.UPDATE_FILE).length;
    const deleteCount = actions.filter(a => a.action === AiActionEnum.DELETE_FILE).length;
    const commandCount = actions.filter(a => a.action === AiActionEnum.RUN_COMMAND).length;
    
    const parts = [];
    if (createCount > 0) parts.push(`Create ${createCount} file${createCount > 1 ? 's' : ''}`);
    if (updateCount > 0) parts.push(`Update ${updateCount} file${updateCount > 1 ? 's' : ''}`);
    if (deleteCount > 0) parts.push(`Delete ${deleteCount} file${deleteCount > 1 ? 's' : ''}`);
    if (commandCount > 0) parts.push(`Run ${commandCount} command${commandCount > 1 ? 's' : ''}`);
    
    return parts.join(', ') || 'Edit Files';
  };

  return (
    <div className="bg-neutral-800/50 rounded-xl border border-neutral-700/50 p-4">
      {/* Header with collapse arrow */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <h3 className="font-medium text-neutral-200 text-sm">
          {getHeaderTitle()}
        </h3>
      </div>

      {/* File list */}
      <div className="space-y-0">
        {actions.map((action, index) => {
          const isCompleted = allCompleted || (isTypingCode && index < streamingIndex) || (isRunningCommand && index < runningCommandIndex);
          const isCurrentlyStreaming = (isTypingCode && index === streamingIndex) || (isRunningCommand && index === runningCommandIndex);
          const statusIcon = getStatusIcon(index);
          
          return (
            <div 
              key={action.action === AiActionEnum.RUN_COMMAND ? action.command : action.path}
              onClick={() => action.action !== AiActionEnum.RUN_COMMAND && onSelectFile(action.path)}
              className={`flex items-center gap-3 py-2 px-0 rounded-md transition-colors group ${
                action.action === AiActionEnum.RUN_COMMAND ? '' : 'cursor-pointer hover:bg-neutral-700/30'
              }`}
            >
              {/* Status icon */}
              <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                {statusIcon}
              </div>
              
              {/* Action label */}
              <span className={`text-sm font-medium min-w-[60px] ${
                isCompleted ? 'text-emerald-300' : 
                isCurrentlyStreaming ? 'text-blue-300' : 
                'text-neutral-400'
              }`}>
                {getActionLabel(action)}
              </span>
              
              {/* File path or command */}
              <span className={`font-mono text-sm flex-1 truncate ${
                isCompleted ? 'text-neutral-200' : 
                isCurrentlyStreaming ? 'text-blue-200' : 
                'text-neutral-400'
              }`} title={action.action === AiActionEnum.RUN_COMMAND ? action.command : action.path}>
                {action.action === AiActionEnum.RUN_COMMAND ? action.command : action.path}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreamingAIResponse;
