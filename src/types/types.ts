import 'react';

declare module 'react' {
  // Allow non-standard webkitdirectory attribute for folder uploads
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

// Augment global interfaces for File System Access API
// These types are not yet part of the default TS DOM library.
declare global {
  interface Window {
    showDirectoryPicker(options?: any): Promise<FileSystemDirectoryHandle>;
  }

  interface DataTransferItem {
    getAsFileSystemHandle(): Promise<FileSystemHandle | null>;
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    readonly kind: 'file';
    getFile(): Promise<File>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    readonly kind: 'directory';
    values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
  }
}

export interface WebContainerState {
  status: 'booting' | 'installing' | 'running' | 'error' | 'idle';
  serverUrl: string | null;
  error: { message: string } | null;
  terminalOutput: string;
}

export interface StagedChanges {
  actions: AiAction[];
  originalFileContents: Record<string, string | null>; // path -> content. null if file was new.
}

export interface ProjectState {
  projectLoaded: boolean;
  isLoading: boolean;
  fileContents: Record<string, string>;
  openFilePaths: string[];
  activeFilePath: string | null;
  stagedChanges: StagedChanges | null;
  webContainerState: WebContainerState;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string; // Content is stored separately for performance, but can be attached
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string; // For assistant, this is the main text or intro. For user, it's their message.
  explanation?: string; // For assistant, this is the detailed explanation that appears after actions.
  imageUrl?: string;
  imageFileName?: string;
  actions?: AiAction[];
  isApplied?: 'pending' | 'applied' | 'discarded';
  activeFileAfterApply?: string;
  isStreaming?: boolean;
  streamingActionPath?: string; // The path of the file currently being written to by the AI
  error?: { message: string };
  canContinue?: boolean; // Shows continue button if streaming was interrupted
}

export enum AiActionEnum {
    CREATE_FILE = "CREATE_FILE",
    UPDATE_FILE = "UPDATE_FILE",
    DELETE_FILE = "DELETE_FILE",
    CREATE_DIRECTORY = "CREATE_DIRECTORY",
    RUN_COMMAND = "RUN_COMMAND",
}

export interface AiAction {
    action: AiActionEnum;
    path: string;
    content?: string;
    command?: string; // For RUN_COMMAND actions
    description?: string; // Description of what the command does
}

export interface AiResponse {
    thought: string;
    explanation: string;
    actions: AiAction[];
    activeFile?: string;
}