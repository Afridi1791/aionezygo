import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../types';
import { getAiChangesStream, type StreamingCallbacks, resetChatSession, setApiKey as setRuntimeApiKey, isApiConfigured as isApiConfiguredRuntime } from '../services/geminiService';
import { continueAiStream, type ContinueContext } from '../services/continueService';

const initialMessage: ChatMessage = {
  id: 'init-message',
  role: 'assistant',
          content: "Hi there, I'm OneZygo! Your project is loaded and I'm ready to get to work. What can I help you with?",
};

export const useAppState = () => {
  const isCancelledRef = useRef(false);
  const rawTextRef = useRef('');
  const explanationTextRef = useRef('');
  const jsonStartedRef = useRef(false);

  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [continueContext, setContinueContext] = useState<ContinueContext | null>(null);
  const [showRunAppPrompt, setShowRunAppPrompt] = useState(false);

  // API key modal and status
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isApiConfigured, setIsApiConfigured] = useState<boolean>(false);
  const [initialApiKey, setInitialApiKey] = useState<string>('');

  const handleSaveApiKey = (key: string) => {
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      setRuntimeApiKey(key);
      setIsApiConfigured(true);
      setInitialApiKey(key);
    } else {
      localStorage.removeItem('gemini_api_key');
      setRuntimeApiKey(null);
      setIsApiConfigured(false);
      setInitialApiKey('');
    }
  };

  const handleStopGeneration = useCallback(() => {
    isCancelledRef.current = true;
    setIsChatLoading(false);
    setIsAiTyping(false);
    
    // Abort the streaming request
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    setMessages(prev => {
        const newMessages = [...prev];
        const lastMessageIndex = newMessages.length - 1;
        
        // The streaming message is always the last one.
        const lastMessage = newMessages[lastMessageIndex];

        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            const updatedMessage: ChatMessage = { 
                ...lastMessage,
                isStreaming: false,
                streamingActionPath: undefined,
            };

            // If actions exist, it means we were editing files.
            // We should present the partial changes for review.
            if (updatedMessage.actions && updatedMessage.actions.length > 0) {
                updatedMessage.isApplied = 'pending';
                updatedMessage.explanation = "Generation was stopped. You can review the partial changes below.";
            } else {
                // If it was just a text response, finalize it with a note.
                updatedMessage.content = (updatedMessage.content || '') + "\n\n*(Generation stopped.)*";
            }
            
            newMessages[lastMessageIndex] = updatedMessage;
            return newMessages;
        }
        return prev;
    });
  }, [abortController]);

  const handleNewChat = () => {
    if (isChatLoading || isAiTyping) return;
    setMessages([initialMessage]);
    resetChatSession();
  };

  const handleStartNewProject = async () => {
    // Full teardown to avoid leakage when creating a brand new project
    setMessages([initialMessage]);
    // Force full page refresh to Welcome screen (home)
    window.location.href = '/';
  };

  const handleIgnoreRunApp = () => {
    setShowRunAppPrompt(false);
  };

  return {
    // State
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

    // Refs
    isCancelledRef,
    rawTextRef,
    explanationTextRef,
    jsonStartedRef,

    // Handlers
    handleSaveApiKey,
    handleStopGeneration,
    handleNewChat,
    handleStartNewProject,
    handleIgnoreRunApp,
  };
};
