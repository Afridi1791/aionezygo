import React, { useMemo, useEffect, useState } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { useProjectState, buildFileTree } from './hooks/useProjectState';
import { useWebContainer } from './hooks/useWebContainer';
import { useAppState } from './hooks/useAppState';
import { useProjectHandlers } from './hooks/useProjectHandlers';
import { useChatHandlers } from './hooks/useChatHandlers';
import HomePage from './pages/HomePage';
import AiPage from './pages/AiPage';
import Header from './components/Header';
import Footer from './components/Footer';
import AppRouter from './AiComponents/layout/AppRouter';
import { type ProjectState } from './types';
import { setApiKey as setRuntimeApiKey, isApiConfigured as isApiConfiguredRuntime } from './services/geminiService';
import ApiKeyModal from './AiComponents/modals/ApiKeyModal';
import LoginModal from './AiComponents/modals/LoginModal';
import ErrorBoundary from './AiComponents/ui/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';



// Stable AppContent component to prevent remounts during streaming
interface AppContentProps {
  state: ProjectState;
  dispatch: React.Dispatch<any>;
  fileTree: any;
  messages: any[];
  isChatLoading: boolean;
  isAiTyping: boolean;
  isApiConfigured: boolean;
  showSidebar: boolean;
  showTerminal: boolean;
  showRunAppPrompt: boolean;
  onOpenApiKey: () => void;
  onOpenLogin: () => void;
  onFileContentChange: (content: string) => void;
  onSendMessage: (input: string, imageFile: File | null, errorToFix?: string) => Promise<void>;
  onNewChat: () => void;
  onStartNewProject: () => void;
  onDownloadProject: () => void;
  onStopGeneration: () => void;
  onContinueStreaming: (messageId: string) => Promise<void>;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onProjectUpload: (files: FileList | null) => void;
  onProjectDrop: (dataTransfer: DataTransfer) => void;
  onScaffoldProject: (prompt: string) => void;
  onRunApp: () => void;
  onIgnoreRunApp: () => void;
  writeToTerminal: (data: string) => Promise<void> | void;
  resizeTerminal: (cols: number, rows: number) => void;
}

const AppContent: React.FC<AppContentProps> = ({
  state,
  dispatch,
  fileTree,
  messages,
  isChatLoading,
  isAiTyping,
  isApiConfigured,
  showSidebar,
  showTerminal,
  showRunAppPrompt,
  onOpenApiKey,
  onOpenLogin,
  onFileContentChange,
  onSendMessage,
  onNewChat,
  onStartNewProject,
  onDownloadProject,
  onStopGeneration,
  onContinueStreaming,
  onToggleSidebar,
  onToggleTerminal,
  onProjectUpload,
  onProjectDrop,
  onScaffoldProject,
  onRunApp,
  onIgnoreRunApp,
  writeToTerminal,
  resizeTerminal,
}) => {
  const location = useLocation();
  
  // Show workspace if project is loaded and we're on the home route
    if (state.projectLoaded && location.pathname === '/') {
  return (
      <AiPage
              state={state}
              dispatch={dispatch}
              fileTree={fileTree}
              messages={messages}
              isChatLoading={isChatLoading}
              isAiTyping={isAiTyping}
              showSidebar={showSidebar}
              showTerminal={showTerminal}
              showRunAppPrompt={showRunAppPrompt}
              onFileContentChange={onFileContentChange}
              onSendMessage={onSendMessage}
              onNewChat={onNewChat}
              onStartNewProject={onStartNewProject}
              onDownloadProject={onDownloadProject}
              onStopGeneration={onStopGeneration}
              onContinueStreaming={onContinueStreaming}
              onToggleSidebar={onToggleSidebar}
              onToggleTerminal={onToggleTerminal}
              onRunApp={onRunApp}
              onIgnoreRunApp={onIgnoreRunApp}
              onOpenLogin={onOpenLogin}
              writeToTerminal={writeToTerminal}
              resizeTerminal={resizeTerminal}
            />
    );
  }
  
  // Check if we're on admin route
  const isAdminRoute = location.pathname === '/admin';
  
  // Show admin panel without header and footer
  if (isAdminRoute) {
    return (
      <AppRouter 
        onProjectUpload={onProjectUpload}
        onProjectDrop={onProjectDrop}
        onScaffoldProject={onScaffoldProject}
        onOpenLogin={onOpenLogin}
      />
    );
  }
  
  // Show regular pages with header and footer
  return (
    <>
      <Header 
        onOpenApiKey={onOpenApiKey}
        isApiConfigured={isApiConfigured}
      />
      
      <main className="flex-1 flex overflow-hidden bg-bg-primary">
        <AppRouter 
          onProjectUpload={onProjectUpload}
          onProjectDrop={onProjectDrop}
          onScaffoldProject={onScaffoldProject}
          onOpenLogin={onOpenLogin}
        />
      </main>

      <Footer />
    </>
  );
};

export default function App() {
  const { state, dispatch } = useProjectState();
  const { mountFiles, runInstall, runBuild, runDevServer, resetContainer, writeToTerminal, resizeTerminal } = useWebContainer(dispatch);
  const fileTree = useMemo(() => buildFileTree(Object.keys(state.fileContents)), [state.fileContents]);
  


  // App state management
  const {
    messages,
    setMessages,
    isAiTyping,
    setIsAiTyping,
    isChatLoading,
    setIsChatLoading,
    abortController,
    setAbortController,
    continueContext,
    setContinueContext,
    showRunAppPrompt,
    setShowRunAppPrompt,
    isApiModalOpen,
    setIsApiModalOpen,
    isLoginModalOpen,
    setIsLoginModalOpen,
    isApiConfigured,
    setIsApiConfigured,
    initialApiKey,
    setInitialApiKey,
    isCancelledRef,
    rawTextRef,
    explanationTextRef,
    jsonStartedRef,
    handleSaveApiKey,
    handleStopGeneration,
    handleNewChat,
    handleStartNewProject,
    handleIgnoreRunApp,
  } = useAppState();

  // Project handlers
  const {
    handleProjectUpload,
    handleProjectDrop,
    handleScaffoldProject,
    handleDownloadProject,
    handleRunApp,
  } = useProjectHandlers(
    state,
    dispatch,
    setMessages,
    setIsChatLoading,
    setIsAiTyping,
    setAbortController,
    setShowRunAppPrompt,
    isCancelledRef,
    mountFiles,
    runInstall,
    runBuild,
    runDevServer,
    resetContainer
  );

  // Chat handlers
  const {
    handleContinueStreaming,
    handleSendMessage,
  } = useChatHandlers(
    state,
    dispatch,
    messages,
    setMessages,
    isChatLoading,
    setIsChatLoading,
    isAiTyping,
    setIsAiTyping,
    setAbortController,
    continueContext,
    setContinueContext,
    isCancelledRef,
    rawTextRef,
    explanationTextRef,
    jsonStartedRef,
    mountFiles,
    runInstall,
    runBuild,
    runDevServer
  );

  // Initialize API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setInitialApiKey(savedKey);
      setRuntimeApiKey(savedKey);
    }
    setIsApiConfigured(isApiConfiguredRuntime());
  }, [setInitialApiKey, setIsApiConfigured]);



  const handleFileContentChange = (newContent: string) => {
    if (state.activeFilePath) {
      dispatch({ type: 'UPDATE_FILE_CONTENT', payload: { path: state.activeFilePath, content: newContent }});
      const pendingMessage = messages.find(m => m.isApplied === 'pending');
      if (pendingMessage) {
        setMessages(prev => prev.map(msg => msg.id === pendingMessage.id ? { ...msg, isApplied: 'applied' } : msg));
      }
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="flex flex-col h-screen bg-bg-primary text-text-primary font-sans antialiased">
            <AppContent 
              state={state}
              dispatch={dispatch}
              fileTree={fileTree}
              messages={messages}
              isChatLoading={isChatLoading}
              isAiTyping={isAiTyping}
              isApiConfigured={isApiConfigured}
              showSidebar={state.showSidebar}
              showTerminal={state.showTerminal}
              showRunAppPrompt={showRunAppPrompt}
              onOpenApiKey={() => setIsApiModalOpen(true)}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              onFileContentChange={handleFileContentChange}
              onSendMessage={handleSendMessage}
              onNewChat={handleNewChat}
              onStartNewProject={handleStartNewProject}
              onDownloadProject={handleDownloadProject}
              onStopGeneration={handleStopGeneration}
              onContinueStreaming={handleContinueStreaming}
              onToggleSidebar={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
              onToggleTerminal={() => dispatch({ type: 'TOGGLE_TERMINAL' })}
              onProjectUpload={handleProjectUpload}
              onProjectDrop={handleProjectDrop}
              onScaffoldProject={handleScaffoldProject}
              onRunApp={handleRunApp}
              onIgnoreRunApp={handleIgnoreRunApp}
              writeToTerminal={writeToTerminal}
              resizeTerminal={resizeTerminal}
            />
          </div>

          {/* API Key Modal */}
          <ApiKeyModal 
            isOpen={isApiModalOpen}
            onClose={() => setIsApiModalOpen(false)}
            onSave={handleSaveApiKey}
            initialValue={initialApiKey}
          />

          {/* Login Modal */}
          <LoginModal 
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
          />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}