import { useCallback } from 'react';
import JSZip from 'jszip';
import { processFileList, processDirectoryHandle } from '../utils/fileUtils';
import { typeEffect } from '../utils/fileUtils';
import { getAiChangesStream, type StreamingCallbacks, scaffoldNewProject } from '../services/geminiService';
import { AiActionEnum } from '../types';

export const useProjectHandlers = (
  state: any,
  dispatch: any,
  setMessages: any,
  setIsChatLoading: any,
  setIsAiTyping: any,
  setAbortController: any,
  setShowRunAppPrompt: any,
  isCancelledRef: any,
  mountFiles: any,
  runInstall: any,
  runBuild: any,
  runDevServer: any,
  resetContainer: any
) => {
  const loadProject = async (files: { path: string, content: string }[]) => {
    try {
        // Ensure we start from a clean slate (terminal, preview url, running processes)
        await resetContainer();
        dispatch({ type: 'LOAD_PROJECT_START' });

        if (files.length > 0) {
            dispatch({ type: 'LOAD_PROJECT_SUCCESS', payload: { files } });
            setMessages([{
              id: 'init-message',
              role: 'assistant',
              content: "Hi there, I'm OneZygo! Your project is loaded and I'm ready to get to work. What can I help you with?",
            }]);
        } else {
            alert('No readable text files were found in the selected directory.');
            dispatch({ type: 'LOAD_PROJECT_FAIL' });
        }
    } catch (err) {
        console.error("Error processing directory:", err);
        alert(`An error occurred while reading the folder: ${err instanceof Error ? err.message : 'Unknown error'}`);
        dispatch({ type: 'LOAD_PROJECT_FAIL' });
    }
  };

  const handleProjectUpload = async (fileList: FileList | null) => {
    if (!fileList) return;
    const files = await processFileList(fileList);
    await loadProject(files);
  };

  const handleProjectDrop = async (dataTransfer: DataTransfer) => {
    if (!dataTransfer.items?.[0]?.getAsFileSystemHandle) {
        alert("Your browser doesn't support folder drag-and-drop. Please use the 'Upload Project' button.");
        return;
    }
    
    try {
        const handle = await dataTransfer.items[0].getAsFileSystemHandle();
        if (handle?.kind !== 'directory') {
          alert('Please drop a folder, not a file.');
          return;
        }
        const files = await processDirectoryHandle(handle as FileSystemDirectoryHandle);
        await loadProject(files);
    } catch (err) {
         console.error("Error handling dropped folder:", err);
    }
  };

  const handleScaffoldProject = async (prompt: string) => {
    isCancelledRef.current = false;
    dispatch({ type: 'SCAFFOLD_PROJECT_START' });

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: prompt,
    };
    
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantPlaceholder = {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: 'Thinking…',
        isStreaming: true,
    };
    setMessages([userMessage, assistantPlaceholder]);
    setIsChatLoading(true);

    // Create new abort controller for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController);

    try {
        // Use streaming API for real-time response
        let streamingResponse: any = null;
        let isStreamComplete = false;
        
        const streamingCallbacks: StreamingCallbacks = {
            onTextChunk: (_chunk: string) => {
                // Suppress JSON fragments in UI during streaming.
                // Keep clean "Thinking…" placeholder until completion.
                if (isCancelledRef.current) return;
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
        await getAiChangesStream(state, prompt, streamingCallbacks);
        
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

        if (!aiResponse.actions || aiResponse.actions.length === 0) {
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false, content: aiResponse.explanation || "" }
                    : msg
            ));
            return;
        }

        setIsAiTyping(true);

        const introMessage = "I've scaffolded the project as you requested. Here are the files I'll be creating:";
        setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
                ? { ...msg, content: aiResponse.explanation || introMessage, actions: aiResponse.actions } 
                : msg
        ));

        // Create empty files first for the streaming effect
        dispatch({ type: 'SCAFFOLD_PROJECT_INIT', payload: { response: aiResponse } });
        await new Promise(res => setTimeout(res, 200)); // allow state to settle
        if (isCancelledRef.current) return;

        // Start the live streaming animation - write code to each file one by one
        for (const action of aiResponse.actions) {
            if (isCancelledRef.current) break;
            
            // Show which file is currently being written
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId ? { ...msg, streamingActionPath: action.path } : msg
            ));
            
            // Select the file in the editor
            dispatch({ type: 'SELECT_FILE', payload: { path: action.path }});
            await new Promise(res => setTimeout(res, 300));
            if (isCancelledRef.current) return;

            // Stream the code content live using typeEffect
            if (action.content) {
                const codeCallback = (chunk: string) => {
                    dispatch({ type: 'APPEND_FILE_CONTENT', payload: { path: action.path, contentChunk: chunk }});
                };
                await typeEffect(action.content, codeCallback, 4, 1);
            }
            
            if (isCancelledRef.current) return;
            await new Promise(res => setTimeout(res, 200)); // Brief pause between files
        }
        if (isCancelledRef.current) return;

        // After all streaming is complete, disable scaffolding mode and clear indicators
        dispatch({ type: 'SET_SCAFFOLDING_MODE', payload: { isScaffolding: false } });
        
        setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
                ? {
                    ...msg,
                    isStreaming: false,
                    streamingActionPath: undefined,
                    content: introMessage,
                    explanation: aiResponse.explanation,
                    actions: aiResponse.actions,
                    isApplied: 'applied', // Scaffolding is auto-applied
                }
                : msg
        ));

        // Show run app prompt after scaffolding completes
        setShowRunAppPrompt(true);

    } catch (error) {
        if (isCancelledRef.current) {
            console.log("Scaffolding was cancelled, ignoring error:", error);
            return;
        }
        console.error("Failed to scaffold project:", error);
        const errorMessageContent = `Sorry, an error occurred while scaffolding. ${error instanceof Error ? error.message : ''}`;
        setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
                ? { ...msg, id: assistantMessageId, role: 'system', isStreaming: false, content: errorMessageContent } 
                : msg
        ));
    } finally {
        setIsChatLoading(false);
        setIsAiTyping(false);
    }
  };

  const handleDownloadProject = async () => {
    const zip = new JSZip();
    Object.entries(state.fileContents).forEach(([path, content]) => {
        if (typeof content === 'string') {
            zip.file(path, content);
        }
    });

    try {
        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'onezygo-project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (e) {
        console.error("Failed to generate zip file", e);
        alert("Sorry, there was an error creating the zip file.");
    }
  };

  const handleRunApp = async () => {
    console.log('🚀 handleRunApp called - starting app setup');
    setShowRunAppPrompt(false);
    
    try {
      // First, ensure files are mounted in WebContainer
      console.log('📁 Mounting files to WebContainer...');
      await mountFiles(state.fileContents);
      console.log('✅ Files mounted successfully');
      
      console.log('📦 Running npm install...');
      const installSuccess = await runInstall();
      if (!installSuccess) {
        console.error('❌ npm install failed');
        return;
      }
      console.log('✅ npm install completed');
      
      console.log('🔨 Running npm run build...');
      const buildSuccess = await runBuild();
      if (!buildSuccess) {
        console.error('❌ npm run build failed');
        return;
      }
      console.log('✅ npm run build completed');
      
      console.log('🌐 Running npm run dev...');
      const devSuccess = await runDevServer();
      if (!devSuccess) {
        console.error('❌ npm run dev failed');
        return;
      }
      console.log('✅ npm run dev completed');
    } catch (error) {
      console.error('❌ Error running app:', error);
    }
  };

  return {
    loadProject,
    handleProjectUpload,
    handleProjectDrop,
    handleScaffoldProject,
    handleDownloadProject,
    handleRunApp,
  };
};
