import React, { useState, useEffect, useRef } from 'react';
import { ProjectState, ChatMessage } from '../../types';
import { useCredits } from '../../hooks/useCredits';
import ActionSummary from './ActionSummary';
import ThinkingIndicator from '../ui/ThinkingIndicator';
import StreamingAIResponse from './StreamingAIResponse';
import FinAvatar from '../ui/FinAvatar';
import CodeBlock from '../editor/CodeBlock';
import ErrorCard from '../ui/ErrorCard';
import RunAppPrompt from '../layout/RunAppPrompt';

// Professional SVG Icons
const NewChatIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const FileIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ArrowUpIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);

const ImageIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SpinnerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const NewProjectIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const DownloadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const FilesToggleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const TerminalToggleIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SendIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const FolderImportIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

interface ChatPanelProps {
  projectState: ProjectState;
  dispatch: React.Dispatch<any>;
  messages: ChatMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoading: boolean;
  onSendMessage: (input: string, imageFile: File | null, errorToFix?: string) => Promise<void>;
  onNewChat: () => void;
  onStartNewProject: () => void;
  onDownloadProject: () => void;
  onStopGeneration: () => void;
  onContinueStreaming?: (messageId: string) => Promise<void>;
  showSidebar: boolean;
  showTerminal: boolean;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  showRunAppPrompt?: boolean;
  onRunApp?: () => void;
  onIgnoreRunApp?: () => void;
  onOpenLogin?: () => void;
}

const getFileName = (path: string) => path.split('/').pop() || path;

const FileTag = ({ path, onRemove }: { path: string; onRemove: () => void; }) => (
  <div className="flex items-center bg-bg-glass-light text-text-secondary rounded-lg pl-2 sm:pl-3 pr-1 py-1 text-xs sm:text-sm font-mono animate-fade-in-sm border border-border-secondary" title={path}>
    <FileIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-text-muted flex-shrink-0" />
    <span className="truncate max-w-[120px] sm:max-w-[200px]">{getFileName(path)}</span>
    <button onClick={onRemove} className="ml-1 sm:ml-1.5 p-0.5 rounded-full hover:bg-bg-glass transition-all duration-200 hover:scale-110">
      <XIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
    </button>
  </div>
);


const SimpleMarkdown: React.FC<{ text: string, isStreaming?: boolean }> = React.memo(({ text, isStreaming }) => {
    const blinkingCursor = '<span class="blinking-cursor"></span>';
    
    // Enhanced formatting with proper line breaks and paragraphs
    const html = text
      // Convert double line breaks to paragraphs
      .replace(/\n\n+/g, '</p><p class="mb-4">')
      // Convert single line breaks to <br>
      .replace(/\n/g, '<br>')
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="italic text-neutral-200">$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-neutral-700/70 text-accent-light font-mono rounded-md px-2 py-1 mx-1 text-sm border border-neutral-600/50">$1</code>')
      // Lists (simple bullet points)
      .replace(/^- (.+)$/gm, '<li class="ml-4 mb-2 text-neutral-200">• $1</li>')
      // Wrap in paragraph tags
      .replace(/^(.+)/, '<p class="mb-4">$1')
      .replace(/(.+)$/, '$1</p>');
    
    return (
      <div 
        className="prose prose-sm prose-invert max-w-none text-neutral-200 leading-relaxed break-words whitespace-pre-wrap" 
        dangerouslySetInnerHTML={{ __html: html + (isStreaming ? blinkingCursor : '') }} 
      />
    );
});

const renderTextWithCodeBlocks = (text: string, isStreaming = false) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('```') && part.endsWith('```')) {
            const codeBlockContent = part.slice(3, -3);
            const codeLines = codeBlockContent.split('\n');
            const language = codeLines.shift()?.trim() || '';
            const code = codeLines.join('\n').trim();
            if (!code) return null;
            return <CodeBlock key={index} language={language} code={code} />;
        } else {
            const isLastPart = index === parts.length - 1;
            return <SimpleMarkdown key={index} text={part} isStreaming={isStreaming && isLastPart} />;
        }
    });
};


const ChatPanel: React.FC<ChatPanelProps> = ({
  projectState,
  dispatch,
  messages,
  setMessages,
  isLoading,
  onSendMessage,
  onNewChat,
  onStartNewProject,
  onDownloadProject,
  onStopGeneration,
  onContinueStreaming,
  showSidebar,
  showTerminal,
  onToggleSidebar,
  onToggleTerminal,
  showRunAppPrompt,
  onRunApp,
  onIgnoreRunApp,
  onOpenLogin,
}) => {
  const { credits, canSendMessage, useCredit, checkCredits, isLoggedIn } = useCredits();
  const [input, setInput] = useState('');
  const [taggedFiles, setTaggedFiles] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [hideErrorCard, setHideErrorCard] = useState(false);
  const [lastErrorMsg, setLastErrorMsg] = useState<string | null>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const prevHadErrorRef = useRef<boolean>(false);

  const webContainerError = projectState.webContainerState.error;

  // Determine if assistant is currently streaming a response
  const assistantStreaming = messages.some(m => m.role === 'assistant' && m.isStreaming);

  // Lock page scroll so only the chat list scrolls
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const el = messagesListRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading, imagePreviewUrl, webContainerError]);

  // Manage ErrorCard visibility with robust conditions
  useEffect(() => {
    const currentMsg = typeof webContainerError === 'string' ? webContainerError : webContainerError?.message || null;
    const hasError = Boolean(currentMsg);

    // If error reappears after being cleared (edge: same message), re-show the card
    if (hasError && prevHadErrorRef.current === false) {
      setHideErrorCard(false);
    }

    // If message changed, also re-show
    if (hasError && currentMsg !== lastErrorMsg) {
      setHideErrorCard(false);
    }

    // Track last message for change detection
    setLastErrorMsg(currentMsg ?? null);
    prevHadErrorRef.current = hasError;
  }, [webContainerError, lastErrorMsg]);
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = input.trim();
    if ((!messageToSend && !imageFile) || isLoading) return;

    try {
      // Check if user is logged in first
      if (!isLoggedIn) {
        if (onOpenLogin) {
          onOpenLogin();
        }
        return; // Don't throw error, just return
      }
      
      // Check credits
      checkCredits();
      
      let finalInput = messageToSend;
      if (taggedFiles.length > 0) {
          const fileTags = taggedFiles.map(p => `\`${p}\``).join(', ');
          finalInput = `My question is about these files: ${fileTags}.\n\n${messageToSend}`;
      }
      
      const messagePayload = finalInput;
      const imagePayload = imageFile;

      setInput('');
      setTaggedFiles([]);
      setImageFile(null);
      setImagePreviewUrl(null);
      if (imageInputRef.current) {
          imageInputRef.current.value = '';
      }
      
      // Use credit before sending message
      await useCredit();
      
      await onSendMessage(messagePayload, imagePayload);
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Show error to user
      alert(error.message);
    }
  };

  const handleFixError = () => {
    if (!webContainerError) return;
    
    // Get the error message
    const errorMessage = webContainerError.message;
    
    // Create simple error fixing message
    const simpleErrorPrompt = `Fix this all errors ${errorMessage}`;

    // Hide the error card immediately
    dispatch({ type: 'CLEAR_WEBCONTAINER_ERROR' });
    setHideErrorCard(true);
    
    // Send simple error message to AI
    onSendMessage(simpleErrorPrompt, null);
    setInput('');
  };

  const handleIgnoreError = () => {
    dispatch({ type: 'CLEAR_WEBCONTAINER_ERROR' });
    setHideErrorCard(true);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    } else {
        setImageFile(null);
        setImagePreviewUrl(null);
    }
  };

  const handleAttachClick = () => {
    imageInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (imageInputRef.current) {
        imageInputRef.current.value = '';
    }
  };
  
  const handleSelectFile = (path: string) => {
    dispatch({ type: 'SELECT_FILE', payload: { path } });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        e.dataTransfer.clearData();
        return;
    }
    
    const path = e.dataTransfer.getData('text/plain');
    if (path && !taggedFiles.includes(path)) {
      setTaggedFiles(prev => [...prev, path]);
    }
  };
  
  const handleRemoveTag = (pathToRemove: string) => {
    setTaggedFiles(prev => prev.filter(p => p !== pathToRemove));
  };

  return (
    <aside className="w-96 bg-bg-secondary border-l border-border-primary flex flex-col h-screen overflow-hidden pro-chat-panel shadow-2xl">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 border-b border-border-primary bg-bg-primary">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div>
            <h2 className="text-lg font-semibold text-text-primary">OneZygo</h2>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleSidebar}
              className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-105 ${showSidebar ? 'text-text-primary bg-bg-glass' : 'text-text-secondary hover:text-text-primary hover:bg-bg-glass'}`}
              title={showSidebar ? 'Hide Files' : 'Show Files'}
              aria-pressed={showSidebar}
            >
              <FilesToggleIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleTerminal}
              className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-105 ${showTerminal ? 'text-text-primary bg-bg-glass' : 'text-text-secondary hover:text-text-primary hover:bg-bg-glass'}`}
              title={showTerminal ? 'Hide Terminal' : 'Show Terminal'}
              aria-pressed={showTerminal}
            >
              <TerminalToggleIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onNewChat}
              className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-glass rounded-lg transition-all duration-200 hover:scale-105"
              title="New Chat"
            >
              <NewChatIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onStartNewProject}
              className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-glass rounded-lg transition-all duration-200 hover:scale-105"
              title="New Project"
            >
              <NewProjectIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onDownloadProject}
              className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-glass rounded-lg transition-all duration-200 hover:scale-105"
              title="Download Project"
            >
              <DownloadIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div ref={messagesListRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary custom-scrollbar">
          {messages.map(message => (
            <div key={message.id} className="space-y-3">
              {/* AI Explanation Text - Separate Card */}
              <div className={`flex items-start w-full gap-2 sm:gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-4 sm:p-5 max-w-[95%] sm:max-w-2xl md:max-w-3xl overflow-hidden break-words shadow-xl backdrop-blur-sm ${
                    message.role === 'user' ? 
                      'bg-gradient-accent text-text-primary rounded-2xl rounded-br-md border border-accent-primary/20' : 
                    message.role === 'assistant' ? 
                      'bg-bg-glass text-text-primary border border-border-secondary rounded-2xl rounded-bl-md backdrop-blur-md' : 
                      'bg-red-500/10 text-red-300 border border-red-500/30 rounded-xl backdrop-blur-sm'
                  }`}>
                  {message.role === 'assistant' && message.actions && message.actions.length > 0 ? (
                    // First card for assistant with actions: fixed concise confirmation
                    <div className="text-sm sm:text-base">
                      <SimpleMarkdown text={"On it! I'll make the requested changes."} />
                    </div>
                  ) : (
                    // Default behavior for user messages or assistant without actions
                    <>
                      {message.imageUrl && (
                        <div className="mb-3">
                          <img src={message.imageUrl} alt={message.imageFileName || 'Uploaded image'} className="max-w-full rounded-lg border border-neutral-700" />
                        </div>
                      )}
                      {message.content && renderTextWithCodeBlocks(message.content, message.isStreaming && !message.actions)}
                    </>
                  )}
                </div>
              </div>

              {/* File Actions Card - Show diff only while streaming; show summary after apply */}
              {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                <div className="flex justify-start">
                  <div className="w-full max-w-[95%] sm:max-w-2xl md:max-w-3xl">
                    {message.isStreaming ? (
                      <StreamingAIResponse
                        actions={message.actions}
                        streamingActionPath={message.streamingActionPath}
                        onSelectFile={handleSelectFile}
                      />
                    ) : message.isApplied === 'applied' ? (
                      <div className="bg-neutral-900/60 text-neutral-100 border border-neutral-700/40 rounded-xl p-4 backdrop-blur-md">
                        <ActionSummary actions={message.actions} onSelectFile={handleSelectFile} />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Summary/Explanation - Only show after actions complete */}
              {message.explanation && !message.isStreaming && message.actions && message.actions.length > 0 && (
                <div className="flex justify-start">
                  <div className="w-full max-w-[95%] sm:max-w-2xl md:max-w-3xl">
                    <div className="bg-neutral-900/60 text-neutral-100 border border-neutral-700/40 rounded-xl p-4 backdrop-blur-md">
                      <div className="text-sm sm:text-base">
                        {renderTextWithCodeBlocks(message.explanation)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Continue button for interrupted streaming */}
              {message.role === 'assistant' && message.canContinue && (
                <div className="flex justify-start">
                  <div className="w-full max-w-[95%] sm:max-w-2xl md:max-w-3xl">
                    <button
                      onClick={() => onContinueStreaming?.(message.id)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2"
                    >
                      <span>▶️</span>
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Remove fake thinking indicator - real streaming shows content directly */}
          {(() => {
            const rawErr = projectState.webContainerState.error;
            const errMsg = typeof rawErr === 'string' ? rawErr : rawErr?.message;
            return projectState.webContainerState.status === 'error' && errMsg && !hideErrorCard ? (
              <ErrorCard 
                error={errMsg}
                onFix={handleFixError}
                onIgnore={handleIgnoreError}
              />
            ) : null;
          })()}
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-t transition-all duration-300 ${ isDraggingOver ? 'border-accent bg-accent/10' : 'border-neutral-800' }`}
        >
          {/* RunAppPrompt above input section */}
          {showRunAppPrompt && onRunApp && onIgnoreRunApp && (
            <RunAppPrompt onRun={onRunApp} onIgnore={onIgnoreRunApp} />
          )}
          
          <div className="p-3 sm:p-4 bg-neutral-950/80 backdrop-blur-sm">
            {imagePreviewUrl && (
              <div className="mb-3">
                <div className="relative w-fit group mx-auto sm:mx-0">
                  <img src={imagePreviewUrl} alt="Preview" className="max-h-24 sm:max-h-36 rounded-xl border border-neutral-600 shadow-lg" />
                  <button 
                    onClick={handleRemoveImage} 
                    className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 transition-all duration-200 shadow-lg hover:scale-110"
                    title="Remove image"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            {taggedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap items-start gap-2">
                <span className="text-xs sm:text-sm text-neutral-400 font-medium pt-1">Context:</span>
                {taggedFiles.map((path, index) => (
                  <React.Fragment key={`file-tag-${index}-${path}`}>
                    <FileTag
                      path={path}
                      onRemove={() => handleRemoveTag(path)}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}
            
            {/* Credits Display Above Input */}
            {isLoggedIn && (
              <div className="mb-3 flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                  <span className="text-sm font-medium text-text-secondary">
                    {credits} Credits Remaining
                  </span>
                </div>
                {credits <= 0 && (
                  <span className="text-xs text-red-400">
                    No credits left. Please wait for refresh or upgrade.
                  </span>
                )}
              </div>
            )}
            
            <form onSubmit={handleFormSubmit} className="relative">
              <input 
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/*"
              />
              <div className="relative flex items-end bg-bg-glass border border-border-secondary rounded-2xl p-1 focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary transition-all duration-200">
                <button 
                  type="button" 
                  onClick={handleAttachClick} 
                  disabled={isLoading}
                  className="shrink-0 p-2.5 text-text-secondary hover:text-accent-primary hover:bg-bg-glass-light rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 m-1"
                  title="Upload Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFormSubmit(e);
                    }
                  }}
                  placeholder={isDraggingOver ? "Drop UI screenshot to build..." : "Describe a feature, paste an error, or drop a UI screenshot..."}
                  className="flex-1 bg-transparent text-sm sm:text-base resize-none focus:outline-none py-4 px-3 placeholder:text-text-muted min-h-[56px] max-h-40"
                  rows={2}
                  disabled={isLoading}
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                  }}
                />
                <button 
                  type={isLoading ? "button" : "submit"}
                  onClick={isLoading ? onStopGeneration : undefined}
                  className="shrink-0 bg-gradient-accent hover:shadow-accent-hover disabled:bg-bg-glass-light disabled:text-text-muted disabled:cursor-not-allowed text-text-primary font-medium p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center hover:scale-105 shadow-lg m-1" 
                  disabled={!isLoading && (!input.trim() && !imageFile)}
                  title={isLoading ? "Stop Generation" : "Send Message"}
                  aria-label={isLoading ? "Stop Generation" : "Send Message"}
                >
                  {isLoading ? <SpinnerIcon className="w-4 h-4" /> : <SendIcon className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style>{`
        .pro-chat-panel {
          background-image: radial-gradient(circle at 1px 1px, #ffffff0a 1px, transparent 0);
          background-size: 20px 20px;
        }
        
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }
        
        /* Enhanced Typography */
        .prose p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: #e5e5e5;
        }
        .prose p:last-child {
          margin-bottom: 0;
        }
        .prose strong {
          color: #ffffff;
          font-weight: 600;
        }
        .prose code {
          background: rgba(64, 64, 64, 0.8);
          color: #a78bfa;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          border: 1px solid rgba(64, 64, 64, 0.5);
        }
        .prose br {
          margin: 0.5rem 0;
        }
        
        @keyframes fade-in-sm {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-sm {
            animation: fade-in-sm 0.1s ease-out forwards;
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }
        .blinking-cursor {
            display: inline-block;
            width: 8px;
            height: 1em;
            background-color: #A78BFA; /* accent-light */
            animation: blink 1s step-end infinite;
            margin-left: 2px;
            vertical-align: text-bottom;
        }

        /* Typing dots animation */
        .typing-dots {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .typing-dots .dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #a78bfa; /* accent-light */
          opacity: 0.6;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .typing-dots .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
       `}</style>
    </aside>
  );
};

export default ChatPanel;