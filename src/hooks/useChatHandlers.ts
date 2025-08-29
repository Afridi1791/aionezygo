import { useCallback } from 'react';
import { fileToBase64 } from '../utils/fileUtils';
import { typeEffect } from '../utils/fileUtils';
import { getAiChangesStream, type StreamingCallbacks } from '../services/geminiService';
import { continueAiStream, type ContinueContext } from '../services/continueService';
import { AiActionEnum } from '../types';

export const useChatHandlers = (
  state: any,
  dispatch: any,
  messages: any,
  setMessages: any,
  isChatLoading: any,
  setIsChatLoading: any,
  isAiTyping: any,
  setIsAiTyping: any,
  setAbortController: any,
  continueContext: any,
  setContinueContext: any,
  isCancelledRef: any,
  rawTextRef: any,
  explanationTextRef: any,
  jsonStartedRef: any,
  mountFiles: any,
  runInstall: any,
  runBuild: any,
  runDevServer: any
) => {
  const handleContinueStreaming = async (messageId: string) => {
    if (!continueContext || continueContext.assistantMessageId !== messageId) {
      console.error('No continue context found for message:', messageId);
      return;
    }

    setIsChatLoading(true);
    
    // Reset refs for new continuation
    rawTextRef.current = continueContext.rawTextSoFar;
    explanationTextRef.current = continueContext.explanationSoFar;
    jsonStartedRef.current = continueContext.jsonStarted;
    isCancelledRef.current = false;

    // Create new abort controller
    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    // Remove continue button and mark as streaming again
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isStreaming: true, canContinue: false }
        : msg
    ));

    try {
      let streamingResponse: any = null;
      let isStreamComplete = false;
      
      const streamingCallbacks: StreamingCallbacks = {
        onTextChunk: (chunk: string) => {
          if (isCancelledRef.current) return;
          
          // Update the assistant message with new text chunks
          setMessages(prev => prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: msg.content + chunk, isStreaming: true } 
              : msg
          ));
          
          explanationTextRef.current += chunk;
        },
        onRawChunk: (chunk: string) => {
          if (isCancelledRef.current) return;
          
          rawTextRef.current += chunk;
          
          if (!jsonStartedRef.current && rawTextRef.current.includes('```json')) {
            jsonStartedRef.current = true;
          }
        },
        onComplete: (response) => {
          if (isCancelledRef.current) return;
          streamingResponse = response;
          isStreamComplete = true;
        },
        onError: (error) => {
          if (isCancelledRef.current) return;
          console.error('Continue streaming error:', error);
          throw error;
        },
        abortSignal: newAbortController.signal
      };

      // Continue streaming from where we left off
      await continueAiStream(state, continueContext, streamingCallbacks);
      
      // Wait for completion
      let attempts = 0;
      while (!isStreamComplete && !isCancelledRef.current && attempts < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (isCancelledRef.current) {
        // Update continue context for another potential continue
        const updatedContext: ContinueContext = {
          ...continueContext,
          rawTextSoFar: rawTextRef.current,
          explanationSoFar: explanationTextRef.current,
          jsonStarted: jsonStartedRef.current
        };
        setContinueContext(updatedContext);
        
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, isStreaming: false, canContinue: true } : msg
        ));
        return;
      }

      const aiResponse = streamingResponse;
      if (!aiResponse) {
        throw new Error('No response received from continue streaming');
      }

      // Clear continue context since we completed successfully
      setContinueContext(null);

      // Handle the completed response same as normal streaming
      if (!aiResponse.actions || aiResponse.actions.length === 0) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, isStreaming: false, content: aiResponse.explanation || msg.content }
            : msg
        ));
        return;
      }

      // Handle actions if present
      setIsAiTyping(true);
      dispatch({ type: 'STAGE_AI_CHANGES', payload: { actions: aiResponse.actions, activeFile: aiResponse.activeFile } });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: aiResponse.explanation || "On it! I'll make the requested changes.", actions: aiResponse.actions, isStreaming: false } 
          : msg
      ));

      // Apply actions as normal
      await new Promise(res => setTimeout(res, 300));
      if (isCancelledRef.current) return;

      for (const action of aiResponse.actions) {
        if (isCancelledRef.current) return;
        
        if (action.action === AiActionEnum.RUN_COMMAND && action.command) {
          const commandDescription = action.description || `Running: ${action.command}`;
          
          setMessages(prev => prev.map(msg =>
            msg.id === messageId ? { 
              ...msg, 
              streamingActionPath: `🔄 ${commandDescription}...`,
              isCommandRunning: true
            } : msg
          ));
          
          await new Promise(res => setTimeout(res, 300));
          if (isCancelledRef.current) return;

          if (state.webContainerState.status === 'idle') {
            await mountFiles(state.fileContents);
          }

          // Execute terminal command based on the command type
          if (action.command.includes('npm install')) {
            await runInstall();
          } else if (action.command.includes('npm run build')) {
            await runBuild();
          } else if (action.command.includes('npm run dev')) {
            await runDevServer();
          } else {
            console.warn('Unsupported command:', action.command);
          }
          
          setMessages(prev => prev.map(msg =>
            msg.id === messageId ? { 
              ...msg, 
              streamingActionPath: `✅ ${commandDescription}`,
              isCommandRunning: false
            } : msg
          ));
        } else {
          const actionDescription = action.description || `${action.action} operation`;
          
          setMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, streamingActionPath: `🔄 ${actionDescription}...` } : msg
          ));
          
          await new Promise(res => setTimeout(res, 200));
          if (isCancelledRef.current) return;

          // Apply the action through the reducer
          if (action.action === AiActionEnum.CREATE_FILE) {
            dispatch({ type: 'CREATE_FILE', payload: { path: action.path, setActive: true } });
          } else if (action.action === AiActionEnum.UPDATE_FILE) {
            dispatch({ type: 'UPDATE_FILE_CONTENT', payload: { path: action.path, content: action.content || '' } });
          }
          
          setMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, streamingActionPath: `✅ ${actionDescription}` } : msg
          ));
        }
        
        await new Promise(res => setTimeout(res, 100));
      }

      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, streamingActionPath: undefined, isApplied: 'applied' } : msg
      ));

    } catch (error: any) {
      console.error('Continue streaming failed:', error);
      
      // Update continue context for retry
      const updatedContext: ContinueContext = {
        ...continueContext,
        rawTextSoFar: rawTextRef.current,
        explanationSoFar: explanationTextRef.current,
        jsonStarted: jsonStartedRef.current
      };
      setContinueContext(updatedContext);
      
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { 
            ...msg, 
            isStreaming: false, 
            canContinue: true,
            error: { message: error.message || 'Failed to continue streaming' }
          }
          : msg
      ));
    } finally {
      setIsChatLoading(false);
      setIsAiTyping(false);
      setAbortController(null);
    }
  };

  const handleSendMessage = async (input: string, imageFile: File | null, errorToFix?: string) => {
    if ((!input.trim() && !imageFile && !errorToFix) || isChatLoading || isAiTyping) return;
    
    isCancelledRef.current = false;

    // Find any pending message that needs to be handled before proceeding.
    const pendingMessage = messages.find(m => m.isApplied === 'pending');
    if (pendingMessage) {
      dispatch({ type: 'REVERT_AI_CHANGES' });
    }

    let finalInput = input;
    if (errorToFix) {
        finalInput = `The project has the following error, please fix it:\n\n\`\`\`\n${errorToFix}\n\`\`\`\n\n${input}`;
    }

    let imageUrl: string | undefined;
    let imageFileName: string | undefined;
    let imageForApi: { data: string; mimeType: string } | undefined;

    if (imageFile) {
        try {
            const { data, mimeType } = await fileToBase64(imageFile);
            const base64Data = data.split(',')[1];
            imageForApi = { data: base64Data, mimeType };
            imageUrl = `data:${mimeType};base64,${base64Data}`;
            imageFileName = imageFile.name;
        } catch (error) {
            console.error("Error processing image:", error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'system' as const,
                content: `Sorry, there was an error reading the image file. Please try another image.`
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: finalInput,
      imageUrl,
      imageFileName,
    };
    
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantPlaceholder = {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: 'Thinking…',
        isStreaming: true,
    };
    
    setMessages(prev => {
        const updatedPrevMessages = pendingMessage 
            ? prev.map((msg) => msg.id === pendingMessage.id ? { ...msg, isApplied: 'discarded' } : msg)
            : prev;
        
        return [...updatedPrevMessages, userMessage, assistantPlaceholder];
    });

    setIsChatLoading(true);
    
    // Create new abort controller for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    try {
        // Use streaming API for real-time response
        let streamingResponse: any = null;
        let isStreamComplete = false;
        
        const streamingCallbacks: StreamingCallbacks = {
            onTextChunk: (chunk: string) => {
                if (isCancelledRef.current) return;
                
                // Update the assistant message with clean explanation text
                setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                        ? { ...msg, content: msg.content + chunk, isStreaming: true } 
                        : msg
                ));
                
                // Track explanation text for continue functionality
                explanationTextRef.current += chunk;
            },
            onRawChunk: (chunk: string) => {
                if (isCancelledRef.current) return;
                
                // Track raw text for continue functionality
                rawTextRef.current += chunk;
                
                // Check if JSON started
                if (!jsonStartedRef.current && rawTextRef.current.includes('```json')) {
                    jsonStartedRef.current = true;
                }
            },
            onComplete: (response) => {
                if (isCancelledRef.current) return;
                streamingResponse = response;
                isStreamComplete = true;
            },
            onError: (error) => {
                if (isCancelledRef.current) return;
                console.error('Streaming error:', error);
                throw error;
            },
            abortSignal: newAbortController.signal
        };
        
        // Start streaming
        await getAiChangesStream(state, finalInput, streamingCallbacks, imageForApi);
        
        // Wait for completion or timeout
        let attempts = 0;
        while (!isStreamComplete && !isCancelledRef.current && attempts < 100) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (isCancelledRef.current) return;
        
        const aiResponse = streamingResponse;
        if (!aiResponse) {
            throw new Error('No response received from streaming API');
        }
        
        // When AI fixes an error, clear it from the state.
        if (errorToFix) {
            dispatch({ type: 'CLEAR_WEBCONTAINER_ERROR' });
        }

        if (!aiResponse.actions || aiResponse.actions.length === 0) {
            // Text-only response: show explanation only
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false, content: aiResponse.explanation || '' }
                    : msg
            ));
            return;
        }

        setIsAiTyping(true);
        
        dispatch({ type: 'STAGE_AI_CHANGES', payload: { actions: aiResponse.actions, activeFile: aiResponse.activeFile } });
        
        const introMessage = "On it! I'll make the requested changes.";
        setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
                ? { ...msg, content: aiResponse.explanation || introMessage, actions: aiResponse.actions } 
                : msg
        ));
        
        await new Promise(res => setTimeout(res, 300));
        if (isCancelledRef.current) return;

        for (const action of aiResponse.actions) {
            if (isCancelledRef.current) return;
            
            if (action.action === AiActionEnum.RUN_COMMAND && action.command) {
                // Handle terminal commands with smart UI feedback
                const commandDescription = action.description || `Running: ${action.command}`;
                
                // Show loading spinner for the command
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId ? { 
                        ...msg, 
                        streamingActionPath: `🔄 ${commandDescription}...`,
                        isCommandRunning: true
                    } : msg
                ));
                
                await new Promise(res => setTimeout(res, 300));
                if (isCancelledRef.current) return;

                // Only mount files if WebContainer status is idle (not already running)
                if (state.webContainerState.status === 'idle') {
                    await mountFiles(state.fileContents);
                }
                
                let commandSuccess = false;
                
                try {
                    // Execute the terminal command based on what the AI requested
                    if (action.command.includes('npm install')) {
                        if (action.command === 'npm install') {
                            await runInstall();
                        } else {
                            // Handle specific package installation
                            await runInstall();
                        }
                        commandSuccess = true;
                    } else if (action.command.includes('npm run build')) {
                        await runBuild();
                        commandSuccess = true;
                    } else if (action.command.includes('npm run dev')) {
                        await runDevServer();
                        commandSuccess = true;
                    } else {
                        // For other commands, we'll just log them for now
                        console.log(`AI requested command: ${action.command}`);
                        dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `\r\n\x1b[33m$ ${action.command}\x1b[0m\r\n` } });
                        dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: `Command execution not yet implemented for: ${action.command}\r\n` } });
                        commandSuccess = true;
                    }
                    
                    // Show success tick mark
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId ? { 
                            ...msg, 
                            streamingActionPath: `✅ ${commandDescription} - Completed`,
                            isCommandRunning: false
                        } : msg
                    ));
                    
                } catch (error) {
                    // Show error mark
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId ? { 
                            ...msg, 
                            streamingActionPath: `❌ ${commandDescription} - Failed, AI will fix and retry`,
                            isCommandRunning: false
                        } : msg
                    ));
                    
                    // If command failed during scaffolding, trigger AI auto-fix
                    console.error(`Command failed: ${action.command}`, error);
                    
                    // Log error for debugging
                    console.error(`Command failed: ${action.command}`, error);
                }
                
                await new Promise(res => setTimeout(res, 800));
            } else if (action.action === AiActionEnum.UPDATE_FILE || action.action === AiActionEnum.CREATE_FILE) {
                if (action.content) {
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId ? { ...msg, streamingActionPath: action.path } : msg
                    ));
                    
                    dispatch({ type: 'SELECT_FILE', payload: { path: action.path }});
                    await new Promise(res => setTimeout(res, 200));
                    if (isCancelledRef.current) return;

                    const codeCallback = (chunk: string) => {
                        dispatch({ type: 'APPEND_FILE_CONTENT', payload: { path: action.path, contentChunk: chunk }});
                    };
                    await typeEffect(action.content, codeCallback, 4, 1);
                }
            }
        }
        if (isCancelledRef.current) return;
        
        // Auto-commit all staged changes and mark as applied
        dispatch({ type: 'COMMIT_AI_CHANGES' });
        setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
                ? {
                    ...msg,
                    isStreaming: false,
                    streamingActionPath: undefined,
                    explanation: aiResponse.explanation,
                    actions: aiResponse.actions,
                    activeFileAfterApply: aiResponse.activeFile,
                    isApplied: 'applied',
                }
                : msg
        ));

    } catch (error) {
        if (isCancelledRef.current) {
            console.log("Request was cancelled, ignoring error:", error);
            return;
        }
        console.error("Failed to get AI changes:", error);
        const errorMessage = {
            id: (Date.now() + 1).toString(),
            role: 'system' as const,
            content: `Sorry, an error occurred. ${error instanceof Error ? error.message : ''}`
        };
        setMessages(prev => [...prev.filter(m => m.id !== assistantMessageId), errorMessage]);
    } finally {
        setIsChatLoading(false);
        setIsAiTyping(false);
    }
  };

  return {
    handleContinueStreaming,
    handleSendMessage,
  };
};
