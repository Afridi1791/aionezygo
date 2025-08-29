import React from 'react';
import { type ProjectState } from '../types';
import ResizablePanels from '../AiComponents/layout/ResizablePanels';
import ChatPanel from '../AiComponents/chat/ChatPanel';
import { WebContainerManager } from '../AiComponents/modals/DiffEditorModal';

// Professional SVG Icons
const CodeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const RocketIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SparklesIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const FolderIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

interface AiPageProps {
  state: ProjectState;
  dispatch: React.Dispatch<any>;
  fileTree: any;
  messages: any[];
  isChatLoading: boolean;
  isAiTyping: boolean;
  showSidebar: boolean;
  showTerminal: boolean;
  showRunAppPrompt: boolean;
  onFileContentChange: (content: string) => void;
  onSendMessage: (input: string, imageFile: File | null, errorToFix?: string) => Promise<void>;
  onNewChat: () => void;
  onStartNewProject: () => void;
  onDownloadProject: () => void;
  onStopGeneration: () => void;
  onContinueStreaming: (messageId: string) => Promise<void>;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onRunApp: () => void;
  onIgnoreRunApp: () => void;
  onOpenLogin?: () => void;
  writeToTerminal: (data: string) => Promise<void> | void;
  resizeTerminal: (cols: number, rows: number) => void;
}

const AiPage: React.FC<AiPageProps> = ({
  state,
  dispatch,
  fileTree,
  messages,
  isChatLoading,
  isAiTyping,
  showSidebar,
  showTerminal,
  showRunAppPrompt,
  onFileContentChange,
  onSendMessage,
  onNewChat,
  onStartNewProject,
  onDownloadProject,
  onStopGeneration,
  onContinueStreaming,
  onToggleSidebar,
  onToggleTerminal,
  onRunApp,
  onIgnoreRunApp,
  onOpenLogin,
  writeToTerminal,
  resizeTerminal,
}) => {
  // Check if AI is currently updating files (has streaming action path)
  const isAiUpdatingFiles = messages.some(msg => 
    msg.role === 'assistant' && 
    msg.isStreaming && 
    msg.streamingActionPath && 
    !msg.streamingActionPath.includes('🔄') && // Not just running commands
    !msg.streamingActionPath.includes('Thinking')
  );

  return (
    <div className="flex h-screen bg-bg-primary">
      <WebContainerManager projectState={state} dispatch={dispatch} />
      
      {/* Main workspace area */}
      <div className="flex-1 flex overflow-hidden">
        {state.projectLoaded ? (
          <ResizablePanels
            fileTree={fileTree}
            projectState={state}
            dispatch={dispatch}
            isAiTyping={isAiTyping}
            onFileContentChange={onFileContentChange}
            showSidebar={showSidebar}
            showTerminal={showTerminal}
            isAiUpdatingFiles={isAiUpdatingFiles}
            writeToTerminal={writeToTerminal}
            resizeTerminal={resizeTerminal}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-bg-primary">
            <div className="text-center max-w-2xl mx-auto px-6">
              {/* Professional Empty State */}
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-accent">
                  <CodeIcon className="w-12 h-12 text-text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">Welcome to OneZygo AI</h2>
                <p className="text-text-secondary text-lg leading-relaxed">
                  Transform your ideas into working applications with AI-powered development
                </p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card-modern group hover:scale-105 transition-all duration-300 cursor-pointer" onClick={onStartNewProject}>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <RocketIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-1">Start New Project</h3>
                      <p className="text-text-secondary text-sm">Create a new application from scratch</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-colors" />
                  </div>
                </div>

                <div className="card-modern group hover:scale-105 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <FolderIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-text-primary mb-1">Upload Project</h3>
                      <p className="text-text-secondary text-sm">Import your existing codebase</p>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-text-secondary group-hover:text-accent-primary transition-colors" />
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center space-x-3 p-4 bg-bg-glass-light rounded-lg">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">AI-Powered</h4>
                    <p className="text-xs text-text-secondary">Smart code generation</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-bg-glass-light rounded-lg">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <CodeIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Real-time</h4>
                    <p className="text-xs text-text-secondary">Live code editing</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-bg-glass-light rounded-lg">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <RocketIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">Fast</h4>
                    <p className="text-xs text-text-secondary">Instant deployment</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={onStartNewProject}
                className="btn-modern bg-gradient-accent hover:shadow-accent-hover text-lg px-8 py-4 flex items-center justify-center mx-auto"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                Start Building with AI
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat panel */}
      <ChatPanel 
        messages={messages}
        isLoading={isChatLoading || isAiTyping}
        onSendMessage={onSendMessage}
        onNewChat={onNewChat}
        onStartNewProject={onStartNewProject}
        onDownloadProject={onDownloadProject}
        onStopGeneration={onStopGeneration}
        onContinueStreaming={onContinueStreaming}
        dispatch={dispatch}
        projectState={state}
        showSidebar={showSidebar}
        showTerminal={showTerminal}
        onToggleSidebar={onToggleSidebar}
        onToggleTerminal={onToggleTerminal}
        showRunAppPrompt={showRunAppPrompt}
        onRunApp={onRunApp}
        onIgnoreRunApp={onIgnoreRunApp}
        onOpenLogin={onOpenLogin}
      />
    </div>
  );
};

export default AiPage;
