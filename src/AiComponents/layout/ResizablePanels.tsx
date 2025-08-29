import React, { useState, useCallback, useEffect, useRef } from 'react';
import { buildFileTree } from '../../hooks/useProjectState';
import FileExplorer from '../file-explorer/FileExplorer';
import EditorTabs from '../editor/EditorTabs';
import CodeEditor from '../editor/CodeEditor';
import PreviewPanel from './PreviewPanel';
import Terminal from '../terminal/TerminalPanel';
import { Terminal as XTerm } from 'xterm';
import { ProjectState } from '../../types';

interface ResizablePanelsProps {
    fileTree: ReturnType<typeof buildFileTree>;
    projectState: ProjectState;
    dispatch: React.Dispatch<any>;
    isAiTyping: boolean;
    onFileContentChange: (newContent: string) => void;
    showSidebar?: boolean;
    showTerminal?: boolean;
    isAiUpdatingFiles?: boolean;
    // New: interactive terminal plumbing
    writeToTerminal?: (data: string) => Promise<void> | void;
    resizeTerminal?: (cols: number, rows: number) => void;
}

const ResizablePanels: React.FC<ResizablePanelsProps> = ({
    fileTree,
    projectState,
    dispatch,
    isAiTyping,
    onFileContentChange,
    showSidebar = true,
    showTerminal = true,
    isAiUpdatingFiles = false,
    writeToTerminal,
    resizeTerminal,
}) => {
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [bottomPanelHeight, setBottomPanelHeight] = useState(300);
    const [prevBottomPanelHeight, setPrevBottomPanelHeight] = useState<number | null>(null);
    const [activeResizer, setActiveResizer] = useState<'sidebar' | 'bottom' | null>(null);
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
    const prevStatusRef = useRef(projectState.webContainerState.status);
    
    // Auto-switch to editor when AI starts updating files
    useEffect(() => {
        if (isAiUpdatingFiles && viewMode === 'preview') {
            setViewMode('editor');
        }
    }, [isAiUpdatingFiles, viewMode]);
    // Terminal tabs (aligned with old model)
    const MAX_TERMINALS = 4;
    // Each tab keeps an offset so a newly created tab starts "clean" (shows output only after creation time)
    const [terminalTabs, setTerminalTabs] = useState<{ id: string; name: string; offset: number }[]>([
        { id: 'term-1', name: 'onezygo', offset: 0 },
    ]);
    const [activeTerminalId, setActiveTerminalId] = useState<string>('term-1');
    const xtermMapRef = useRef<Record<string, XTerm>>({});
    const lastWrittenLenMapRef = useRef<Record<string, number>>({});

    // Project prompt name (fixed as requested)
    const getProjectName = useCallback(() => 'onezygo-project', []);

    // Helper: append initial prompt to global terminal output buffer
    const appendPrompt = useCallback(() => {
        const name = getProjectName();
        const prompt = `\x1b[36m~/${name}\x1b[0m\r\n\x1b[35m❯\x1b[0m `;
        dispatch({ type: 'APPEND_TERMINAL_OUTPUT', payload: { output: prompt } });
    }, [dispatch, getProjectName]);

    const addTerminalTab = () => {
        if (terminalTabs.length >= MAX_TERMINALS) return;
        const nextIndex = terminalTabs.length + 1;
        const id = `term-${Date.now()}`;
        const name = `Terminal ${nextIndex}`;
        const currentLen = projectState.webContainerState.terminalOutput.length;
        // Append a fresh prompt for this tab view and set its offset to show it
        appendPrompt();
        const nextTabs = [...terminalTabs, { id, name, offset: currentLen }];
        setTerminalTabs(nextTabs);
        setActiveTerminalId(id);
    };
    
    // Write terminal output deltas to all mounted xterms (one per tab)
    useEffect(() => {
        const fullOut = projectState.webContainerState.terminalOutput;
        // If no output yet, show initial prompt immediately so user can type
        if (!fullOut || fullOut.length === 0) {
            appendPrompt();
        }
        for (const tab of terminalTabs) {
            const term = xtermMapRef.current[tab.id];
            if (!term) continue;
            const slicedOut = fullOut.slice(Math.min(tab.offset, fullOut.length));
            const prevLen = lastWrittenLenMapRef.current[tab.id] ?? 0;
            const nextLen = slicedOut.length;
            if (nextLen > prevLen) {
                const delta = slicedOut.slice(prevLen);
                try { term.write(delta); } catch {}
                lastWrittenLenMapRef.current[tab.id] = nextLen;
            }
            if (activeTerminalId === tab.id) {
                try { term.scrollToBottom(); } catch {}
            }
        }
    }, [projectState.webContainerState.terminalOutput, activeTerminalId, terminalTabs]);

    const closeTerminalTab = (id: string) => {
        if (terminalTabs.length === 1) return; // keep at least one
        const idx = terminalTabs.findIndex(t => t.id === id);
        const nextTabs = terminalTabs.filter(t => t.id !== id);
        setTerminalTabs(nextTabs);
        if (activeTerminalId === id) {
            const nextActive = nextTabs[Math.max(0, idx - 1)]?.id ?? nextTabs[0].id;
            setActiveTerminalId(nextActive);
        }
    };

    const handleSelectFile = (path: string) => {
        dispatch({ type: 'SELECT_FILE', payload: { path } });
    };

    const handleCloseTab = (path: string) => {
        dispatch({ type: 'CLOSE_FILE', payload: { path } });
    };

    const handleCreateFile = (path: string) => {
        dispatch({ type: 'CREATE_FILE', payload: { path } });
    };

    const handleDeletePath = (path: string) => {
        dispatch({ type: 'DELETE_PATH', payload: { path } });
    };

    const handleRenamePath = (oldPath: string, newPath: string) => {
        dispatch({ type: 'RENAME_PATH', payload: { oldPath, newPath } });
    };

    const handleMouseDown = (e: React.MouseEvent, panel: 'sidebar' | 'bottom') => {
        e.preventDefault();
        document.body.style.cursor = panel === 'sidebar' ? 'col-resize' : 'row-resize';
        setActiveResizer(panel);
    };

    const handleMouseUp = useCallback(() => {
        document.body.style.cursor = 'default';
        setActiveResizer(null);
    }, []);
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!activeResizer) return;
        // If no mouse button is pressed, stop resizing (handles cases when mouseup occurred outside window)
        if ((e as MouseEvent).buttons === 0) {
            document.body.style.cursor = 'default';
            setActiveResizer(null);
            return;
        }
        
        const minSidebarWidth = 240;
        const maxSidebarWidth = 500;
        const minBottomPanelHeight = 160; // ensure header + content space so header never clips
        // Allow terminal to grow close to full height, leaving some headroom for header/tabs
        const maxBottomPanelHeight = Math.max(600, window.innerHeight - 120);
        const minMainWidth = 500;

        if (activeResizer === 'sidebar') {
            let newWidth = e.clientX;
            newWidth = Math.max(minSidebarWidth, newWidth);
            newWidth = Math.min(maxSidebarWidth, newWidth);
            newWidth = Math.min(newWidth, window.innerWidth - minMainWidth);
            setSidebarWidth(newWidth);
        } else if (activeResizer === 'bottom') {
            let newHeight = window.innerHeight - e.clientY;
            newHeight = Math.max(minBottomPanelHeight, newHeight);
            newHeight = Math.min(maxBottomPanelHeight, newHeight);
            setBottomPanelHeight(newHeight);
            // Nudge xterm fit logic during drag
            requestAnimationFrame(() => {
                try { window.dispatchEvent(new Event('resize')); } catch {}
            });
        }
    }, [activeResizer, sidebarWidth]);

    useEffect(() => {
        if (activeResizer) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            // Also stop resizing if the mouse leaves the window or tab loses focus
            const cancel = () => handleMouseUp();
            window.addEventListener('mouseleave', cancel);
            window.addEventListener('blur', cancel);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseUp);
            window.removeEventListener('blur', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseUp);
            window.removeEventListener('blur', handleMouseUp);
        };
    }, [activeResizer, handleMouseMove, handleMouseUp]);

    // Auto-switch to Preview when dev server becomes running
    useEffect(() => {
        const current = projectState.webContainerState.status;
        if (prevStatusRef.current !== 'running' && current === 'running') {
            setViewMode('preview');
        }
        prevStatusRef.current = current;
    }, [projectState.webContainerState.status]);

    const handleBottomDoubleClick = () => {
        // Toggle maximize/minimize terminal height
        if (prevBottomPanelHeight == null) {
            setPrevBottomPanelHeight(bottomPanelHeight);
            const maxHeight = Math.max(600, window.innerHeight - 120);
            setBottomPanelHeight(maxHeight);
        } else {
            setBottomPanelHeight(prevBottomPanelHeight);
            setPrevBottomPanelHeight(null);
        }
        requestAnimationFrame(() => {
            try { window.dispatchEvent(new Event('resize')); } catch {}
        });
    };
    
    const activeFileContent = projectState.activeFilePath
        ? projectState.fileContents[projectState.activeFilePath] ?? ''
        : null;

    return (
        <>
            {showSidebar && (
                <div style={{ width: `${sidebarWidth}px` }} className="flex-shrink-0 bg-black border-r border-neutral-800 flex flex-col h-full">
                    <FileExplorer
                        fileTree={fileTree}
                        activeFilePath={projectState.activeFilePath}
                        stagedChanges={projectState.stagedChanges}
                        onSelectFile={handleSelectFile}
                        onCreateFile={handleCreateFile}
                        onDeletePath={handleDeletePath}
                        onRenamePath={handleRenamePath}
                    />
                </div>
            )}
            {showSidebar && (
                <div className="w-1 cursor-col-resize flex-shrink-0 group bg-neutral-900 hover:bg-neutral-800 transition-colors" onMouseDown={(e) => handleMouseDown(e, 'sidebar')}>
                    <div className="h-full w-px bg-neutral-700 group-hover:bg-accent transition-colors duration-200 mx-auto"></div>
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between border-b border-border-primary bg-bg-primary">
                        <EditorTabs
                            openFiles={projectState.openFilePaths}
                            activeFile={projectState.activeFilePath}
                            stagedChanges={projectState.stagedChanges}
                            onSelectTab={handleSelectFile}
                            onCloseTab={handleCloseTab}
                        />
                        <div className="px-3 py-1">
                            <div className="inline-flex rounded-xl bg-bg-glass-light border border-border-secondary p-1">
                                <button
                                    onClick={() => setViewMode('editor')}
                                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-semibold flex items-center space-x-2 ${
                                        viewMode === 'editor' 
                                            ? 'bg-gradient-accent text-white shadow-accent-hover' 
                                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-glass'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                    <span>Editor</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('preview')}
                                    disabled={isAiUpdatingFiles}
                                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 font-semibold flex items-center space-x-2 ${
                                        isAiUpdatingFiles 
                                            ? 'bg-bg-glass-light text-text-secondary cursor-not-allowed opacity-50' 
                                            : viewMode === 'preview' 
                                                ? 'bg-gradient-accent text-white shadow-accent-hover' 
                                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-glass'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <span>Preview</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {viewMode === 'editor' ? (
                        <CodeEditor
                            filePath={projectState.activeFilePath}
                            content={activeFileContent}
                            onContentChange={onFileContentChange}
                            stagedChanges={projectState.stagedChanges}
                            isTyping={isAiTyping}
                        />
                    ) : (
                        <PreviewPanel 
                            url={projectState.webContainerState.serverUrl}
                            status={projectState.webContainerState.status}
                            onRuntimeError={(error) => {
                                dispatch({ type: 'SET_WEBCONTAINER_ERROR', payload: { error: { message: error } } });
                            }}
                        />
                    )}
                </div>
                
                {showTerminal && (
                    <div
                        className="relative z-10 h-2 md:h-3 cursor-row-resize flex-shrink-0 group bg-bg-secondary hover:bg-bg-glass transition-colors"
                        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
                        onDoubleClick={handleBottomDoubleClick}
                    >
                          <div className="w-full h-[2px] md:h-[3px] bg-border-secondary group-hover:bg-accent-primary transition-colors duration-200 my-auto"></div>
                    </div>
                )}

                {showTerminal && (
                    <div style={{ height: `${bottomPanelHeight}px` }} className="relative flex-shrink-0 min-h-[160px] overflow-hidden">
                        {/* Terminal tabs bar styled like old UI */}
                        <div className="sticky top-0 z-20 flex items-center justify-between px-2 py-1 bg-bg-primary border-t border-border-primary">
                            <div className="flex items-center gap-1 overflow-x-auto">
                                {terminalTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all whitespace-nowrap ${
                                            activeTerminalId === tab.id 
                                                ? 'bg-bg-glass border-border-primary text-text-primary shadow-sm' 
                                                : 'bg-bg-glass-light border-border-secondary text-text-secondary hover:bg-bg-glass hover:text-text-primary'
                                        }`}
                                        onClick={() => {
                                            setActiveTerminalId(tab.id);
                                            requestAnimationFrame(() => {
                                                try { window.dispatchEvent(new Event('resize')); } catch {}
                                            });
                                        }}
                                        title={tab.name}
                                    >
                                        {/* Professional terminal icon */}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                                            <polyline points="4 8 8 12 4 16"></polyline>
                                            <line x1="12" y1="16" x2="20" y2="16"></line>
                                        </svg>
                                        <span className={`truncate max-w-[140px] font-medium ${tab.id === 'term-1' ? 'font-semibold' : ''}`}>{tab.name}</span>
                                    </button>
                                ))}
                                <button
                                    onClick={addTerminalTab}
                                    disabled={terminalTabs.length >= MAX_TERMINALS}
                                    className="ml-1 text-xs px-2 py-1.5 rounded-lg border border-border-secondary text-text-secondary hover:bg-bg-glass hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    title="New Terminal"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => dispatch({ type: 'TOGGLE_TERMINAL' })}
                                    title="Collapse Terminal"
                                    className="text-xs px-2 py-1.5 rounded-lg border border-border-secondary text-text-secondary hover:bg-bg-glass hover:text-text-primary transition-all duration-200"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Old-model: one Terminal per tab, hide inactive via CSS */}
                        {terminalTabs.map((tab, index) => {
                            const isActive = tab.id === activeTerminalId;
                            return (
                                <Terminal
                                    key={tab.id}
                                    id={tab.id}
                                    readonly={false}
                                    className={`w-full h-full ${isActive ? '' : 'hidden'}`}
                                    onTerminalResize={(cols, rows) => resizeTerminal?.(cols, rows)}
                                    onTerminalReady={(terminal) => {
                                        xtermMapRef.current[tab.id] = terminal;
                                        // Hook input to backend (use active tab terminal, but any tab can type)
                                        try { terminal.onData?.((d: string) => { writeToTerminal?.(d); }); } catch {}
                                        // Initial render for this tab
                                        const fullOut = projectState.webContainerState.terminalOutput;
                                        const slicedOut = fullOut.slice(Math.min(tab.offset, fullOut.length));
                                        try { terminal.write(slicedOut); } catch {}
                                        lastWrittenLenMapRef.current[tab.id] = slicedOut.length;
                                    }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default ResizablePanels;
