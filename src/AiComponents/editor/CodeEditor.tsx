import React, { useRef, useEffect } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { AiActionEnum, StagedChanges } from '../../types';

// Professional SVG Icons
const SpinnerIcon = ({ className = "w-6 h-6" }) => (
  <svg className={`${className} animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FileIcon = ({ className = "w-8 h-8" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CodeIcon = ({ className = "w-8 h-8" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const LockIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

interface CodeEditorProps {
  filePath: string | null;
  content: string | null;
  onContentChange: (newContent: string) => void;
  stagedChanges: StagedChanges | null;
  isTyping: boolean;
}

const getLanguageFromPath = (path: string | null): string => {
  if (!path) return 'plaintext';
  const extension = path.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'html':
      return 'html';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

const CodeEditor: React.FC<CodeEditorProps> = ({ filePath, content, onContentChange, stagedChanges, isTyping }) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  
  const pendingAction = filePath ? stagedChanges?.actions.find(a => a.path === filePath) : null;
  const isDiffMode = !!pendingAction;
  const hasStagedChanges = !!stagedChanges;
  
  if (filePath === null) {
    return (
      <div className="flex-1 bg-bg-primary flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CodeIcon className="text-text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Ready to Code</h2>
          <p className="text-text-secondary max-w-md mx-auto mb-6">
            Select a file from the file explorer to start coding. 
            Your code will appear here with full syntax highlighting and editing capabilities.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-text-secondary">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Syntax Highlighting</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
              <span>Auto-completion</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Error Detection</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const language = getLanguageFromPath(filePath);

  const originalContent = (isDiffMode && stagedChanges?.originalFileContents.hasOwnProperty(filePath))
    ? stagedChanges.originalFileContents[filePath] ?? ''
    : content ?? '';
  
  const modifiedContent = (pendingAction?.action === AiActionEnum.DELETE_FILE ? '' : content) ?? '';
  
  // The editor should be read-only if changes are staged, UNLESS the AI is currently typing.
  const isReadOnly = hasStagedChanges && !isTyping;

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.dispose();
        } catch (error) {
          // Ignore disposal errors
        }
      }
    };
  }, []);

  return (
    <div className="flex-1 relative bg-bg-primary">
        {isDiffMode ? (
          <DiffEditor
            height="100%"
            language={language}
            original={originalContent}
            modified={modifiedContent}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-3">
                  <SpinnerIcon className="text-accent-primary" />
                  <span className="text-text-secondary text-sm font-medium">Loading diff view...</span>
                </div>
              </div>
            }
            theme="fin-dark-diff"
            options={{
                readOnly: true, // Diff view is always read-only
                renderSideBySide: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontFamily: 'monospace',
                fontSize: 14,
            }}
            onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;
                monaco.editor.defineTheme('fin-dark-diff', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [],
                  colors: {
                    'editor.background': '#0a0a0f',
                    'diffEditor.insertedTextBackground': '#14362190',
                    'diffEditor.removedTextBackground': '#42101090',
                    'diffEditor.insertedLineBackground': '#14362150',
                    'diffEditor.removedLineBackground': '#42101050',
                  },
                });
                monaco.editor.setTheme('fin-dark-diff');
            }}
          />
        ) : (
          <Editor
            height="100%"
            path={filePath || undefined}
            language={language}
            value={content ?? ''}
            onChange={(value) => onContentChange(value || '')}
            theme="fin-dark"
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center space-x-3">
                  <SpinnerIcon className="text-accent-primary" />
                  <span className="text-text-secondary text-sm font-medium">Loading editor...</span>
                </div>
              </div>
            }
            options={{
              readOnly: isReadOnly,
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              renderWhitespace: 'none',
              fontFamily: 'monospace',
              'semanticHighlighting.enabled': true,
            }}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
              monaco.editor.defineTheme('fin-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                  'editor.background': '#0a0a0f',
                },
              });
              monaco.editor.setTheme('fin-dark');
            }}
          />
        )}
        {isReadOnly && !isDiffMode && (
             <div className="absolute inset-0 bg-bg-primary/40 flex items-center justify-center pointer-events-none">
                <div className="glass p-6 rounded-xl border border-border-primary shadow-accent">
                  <div className="flex items-center space-x-3 mb-3">
                    <LockIcon className="text-accent-primary" />
                    <h3 className="text-lg font-semibold text-text-primary">Changes Pending</h3>
                  </div>
                  <p className="text-text-secondary">
                    Apply or discard the staged changes to continue editing this file.
                  </p>
                </div>
            </div>
        )}
    </div>
  );
};

export default CodeEditor;
