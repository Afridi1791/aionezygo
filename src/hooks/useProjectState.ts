import { useReducer } from 'react';
import { AiAction, AiActionEnum, AiResponse, FileNode, StagedChanges, WebContainerState } from '../types';
import { resetChatSession } from '../services/geminiService';

type Action =
  | { type: 'LOAD_PROJECT_START' }
  | { type: 'LOAD_PROJECT_SUCCESS'; payload: { files: { path: string; content: string }[] } }
  | { type: 'LOAD_PROJECT_FAIL' }
  | { type: 'SELECT_FILE'; payload: { path: string } }
  | { type: 'CLOSE_FILE'; payload: { path: string } }
  | { type: 'UPDATE_FILE_CONTENT'; payload: { path: string; content: string } }
  | { type: 'APPEND_FILE_CONTENT'; payload: { path: string; contentChunk: string } }
  | { type: 'STAGE_AI_CHANGES'; payload: { actions: AiAction[]; activeFile?: string } }
  | { type: 'COMMIT_AI_CHANGES' }
  | { type: 'REVERT_AI_CHANGES' }
  | { type: 'RESET_PROJECT' }
  | { type: 'SCAFFOLD_PROJECT_START' }
  | { type: 'SCAFFOLD_PROJECT_INIT'; payload: { response: AiResponse } }
  | { type: 'SCAFFOLD_PROJECT_SUCCESS'; payload: { response: AiResponse } }
  | { type: 'SET_SCAFFOLDING_MODE'; payload: { isScaffolding: boolean } }
  | { type: 'CREATE_FILE'; payload: { path: string; setActive?: boolean } }
  | { type: 'RENAME_PATH'; payload: { oldPath: string, newPath: string } }
  | { type: 'DELETE_PATH'; payload: { path: string } }
  | { type: 'SET_WEBCONTAINER_STATUS'; payload: { status: ProjectState['webContainerState']['status'] } }
  | { type: 'SET_WEBCONTAINER_URL'; payload: { url: string | null } }
  | { type: 'SET_WEBCONTAINER_ERROR'; payload: { error: ProjectState['webContainerState']['error'] } }
  | { type: 'CLEAR_WEBCONTAINER_ERROR' }
  | { type: 'APPEND_TERMINAL_OUTPUT'; payload: { output: string } }
  | { type: 'CLEAR_TERMINAL_OUTPUT' }
  // UI state actions
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_TERMINAL' };

const initialWebContainerState: WebContainerState = {
  status: 'idle' as const,
  serverUrl: null,
  error: null,
  terminalOutput: '',
};

export interface ProjectState {
  projectLoaded: boolean;
  isLoading: boolean;
  fileContents: Record<string, string>;
  openFilePaths: string[];
  activeFilePath: string | null;
  stagedChanges: StagedChanges | null;
  webContainerState: WebContainerState;
  isScaffolding: boolean;
  // UI state
  showSidebar: boolean;
  showTerminal: boolean;
}

const initialState: ProjectState = {
  projectLoaded: false,
  isLoading: false,
  fileContents: {},
  openFilePaths: [],
  activeFilePath: null,
  stagedChanges: null,
  webContainerState: initialWebContainerState,
  isScaffolding: false,
  // Defaults: sidebar visible, terminal hidden until used
  showSidebar: true,
  showTerminal: false,
};

function projectReducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case 'LOAD_PROJECT_START':
      return { ...state, isLoading: true, stagedChanges: null, webContainerState: { ...initialWebContainerState, status: 'booting' } };
    case 'LOAD_PROJECT_SUCCESS': {
      resetChatSession(); // Reset AI memory for the new project
      const fileContents: Record<string, string> = {};
      action.payload.files.forEach(file => {
        fileContents[file.path] = file.content;
      });
      const firstFilePath = action.payload.files.length > 0 ? action.payload.files[0].path : null;
      return {
        ...state,
        projectLoaded: true,
        isLoading: false,
        fileContents,
        openFilePaths: firstFilePath ? [firstFilePath] : [],
        activeFilePath: firstFilePath,
        stagedChanges: null,
      };
    }
    case 'LOAD_PROJECT_FAIL':
        return {
            ...state,
            isLoading: false,
            webContainerState: { ...initialWebContainerState, status: 'error' },
        };
    case 'SCAFFOLD_PROJECT_START':
        resetChatSession();
        return {
            ...initialState,
            projectLoaded: true,
            isLoading: true, // Keep loading until scaffold and webcontainer are ready
            webContainerState: { ...initialWebContainerState, status: 'booting' },
            isScaffolding: true,
        };
    case 'SCAFFOLD_PROJECT_INIT': {
        const { response } = action.payload;
        const fileContents: Record<string, string> = {};
        // Create empty files for streaming effect
        response.actions.forEach(act => {
            if(act.action === AiActionEnum.CREATE_FILE) {
                fileContents[act.path] = ''; // Start with empty content
            }
        });
        const activeFile = response.activeFile || response.actions.find(a => a.action === AiActionEnum.CREATE_FILE)?.path || null;
        
        return {
            ...state,
            isLoading: false,
            fileContents,
            activeFilePath: activeFile,
            openFilePaths: activeFile ? [activeFile] : [],
            stagedChanges: { actions: [], originalFileContents: {} },
        };
    }
    case 'SCAFFOLD_PROJECT_SUCCESS': {
        const { response } = action.payload;
        const fileContents: Record<string, string> = {};
        response.actions.forEach(act => {
            if(act.action === AiActionEnum.CREATE_FILE && act.content) {
                fileContents[act.path] = act.content;
            }
        });
        const activeFile = response.activeFile || response.actions.find(a => a.action === AiActionEnum.CREATE_FILE)?.path || null;
        
        return {
            ...state,
            isLoading: false,
            fileContents,
            activeFilePath: activeFile,
            openFilePaths: activeFile ? [activeFile] : [],
            isScaffolding: true, // Keep scaffolding mode during auto-setup
        };
    }
    case 'SELECT_FILE': {
        const { path } = action.payload;
        if (!state.fileContents.hasOwnProperty(path)) return state; // Don't select files that don't exist
        const newOpenFiles = [...state.openFilePaths];
        if (!newOpenFiles.includes(path)) {
            newOpenFiles.push(path);
        }
        return { ...state, activeFilePath: path, openFilePaths: newOpenFiles };
    }
    case 'CLOSE_FILE': {
        const { path: pathToClose } = action.payload;
        const openFilePaths = state.openFilePaths.filter(p => p !== pathToClose);
        
        let activeFilePath = state.activeFilePath;
        if (activeFilePath === pathToClose) {
            const closedIndex = state.openFilePaths.findIndex(p => p === pathToClose);
            if (openFilePaths.length === 0) {
                activeFilePath = null;
            } else if (closedIndex > 0) {
                activeFilePath = openFilePaths[closedIndex - 1];
            } else {
                activeFilePath = openFilePaths[0];
            }
        }

        return { ...state, openFilePaths, activeFilePath };
    }
    case 'UPDATE_FILE_CONTENT': {
      // Manual edits commit any existing staged changes implicitly.
      const newState = {
        ...state,
        fileContents: {
          ...state.fileContents,
          [action.payload.path]: action.payload.content,
        },
      };
      if (state.stagedChanges) {
        newState.stagedChanges = null;
      }
      return newState;
    }
    case 'APPEND_FILE_CONTENT': {
      const { path, contentChunk } = action.payload;
      if (state.fileContents[path] === undefined) {
          console.warn(`Attempted to append to non-existent file: ${path}`);
          return state;
      }
      return {
          ...state,
          fileContents: {
              ...state.fileContents,
              [path]: state.fileContents[path] + contentChunk
          }
      };
    }
    case 'STAGE_AI_CHANGES': {
      if (!action.payload.actions || action.payload.actions.length === 0) {
        return state;
      }
      
      const newFileContents = { ...state.fileContents };
      const originalFileContents: Record<string, string | null> = {};

      action.payload.actions.forEach(aiAction => {
        switch (aiAction.action) {
          case AiActionEnum.CREATE_FILE:
              newFileContents[aiAction.path] = ''; 
              originalFileContents[aiAction.path] = null; 
            break;
          case AiActionEnum.UPDATE_FILE:
              originalFileContents[aiAction.path] = state.fileContents[aiAction.path];
              newFileContents[aiAction.path] = '';
            break;
          case AiActionEnum.DELETE_FILE:
            originalFileContents[aiAction.path] = state.fileContents[aiAction.path];
            break;
        }
      });
      
      const stagedChanges: StagedChanges = {
        actions: action.payload.actions,
        originalFileContents: originalFileContents,
      };
      
      let nextActiveFile = state.activeFilePath;
      const openFilePaths = [...state.openFilePaths];

      if (action.payload.activeFile && newFileContents.hasOwnProperty(action.payload.activeFile)) {
        nextActiveFile = action.payload.activeFile;
        if (!openFilePaths.includes(nextActiveFile)) {
            openFilePaths.push(nextActiveFile);
        }
      }

      return { ...state, fileContents: newFileContents, stagedChanges, activeFilePath: nextActiveFile, openFilePaths };
    }
    case 'COMMIT_AI_CHANGES': {
        if (!state.stagedChanges) return state;

        const finalFileContents = { ...state.fileContents };
        const deletedFiles = new Set<string>();
        state.stagedChanges.actions.forEach(aiAction => {
            if (aiAction.action === AiActionEnum.DELETE_FILE) {
                delete finalFileContents[aiAction.path];
                deletedFiles.add(aiAction.path);
            }
        });

        const openFilePaths = state.openFilePaths.filter(p => !deletedFiles.has(p));
        let activeFilePath = state.activeFilePath;

        if (activeFilePath && !finalFileContents.hasOwnProperty(activeFilePath)) {
            activeFilePath = openFilePaths[0] || null;
            if (!activeFilePath) {
                activeFilePath = Object.keys(finalFileContents)[0] || null;
                if (activeFilePath) openFilePaths.push(activeFilePath);
            }
        }

        return { ...state, fileContents: finalFileContents, stagedChanges: null, openFilePaths, activeFilePath, webContainerState: {...state.webContainerState, status: 'booting'} };
    }
    case 'REVERT_AI_CHANGES': {
        if (!state.stagedChanges) return state;
        
        const revertedFileContents = { ...state.fileContents };
        
        for (const action of [...state.stagedChanges.actions].reverse()) {
            const originalContent = state.stagedChanges.originalFileContents[action.path];
            if (action.action === AiActionEnum.CREATE_FILE) {
                delete revertedFileContents[action.path];
            } else if (originalContent !== null && originalContent !== undefined) {
                revertedFileContents[action.path] = originalContent;
            }
        }
        
        return { ...state, fileContents: revertedFileContents, stagedChanges: null };
    }
    case 'RESET_PROJECT':
      resetChatSession();
      return { ...initialState, isLoading: false };
    case 'CREATE_FILE': {
        const { path, setActive = true } = action.payload;
        if (state.fileContents.hasOwnProperty(path)) return state;
        const newFileContents = { ...state.fileContents, [path]: '' };
        
        const newOpenFiles = [...state.openFilePaths];
        if (!newOpenFiles.includes(path)) {
            newOpenFiles.push(path);
        }

        return {
            ...state,
            fileContents: newFileContents,
            openFilePaths: newOpenFiles,
            activeFilePath: setActive ? path : state.activeFilePath,
            stagedChanges: null,
        }
    }
    case 'RENAME_PATH': {
        const { oldPath, newPath } = action.payload;
        if (oldPath === newPath || !oldPath || !newPath) return state;

        const isRenamingDirectory = !state.fileContents.hasOwnProperty(oldPath);
        const newFileContents = { ...state.fileContents };
        
        if (isRenamingDirectory) {
            Object.keys(newFileContents).forEach(p => {
                if (p.startsWith(oldPath + '/')) {
                    const content = newFileContents[p];
                    delete newFileContents[p];
                    const updatedPath = p.replace(oldPath, newPath);
                    newFileContents[updatedPath] = content;
                }
            });
        } else {
            const content = newFileContents[oldPath];
            delete newFileContents[oldPath];
            newFileContents[newPath] = content;
        }

        const openFilePaths = state.openFilePaths.map(p => p.startsWith(oldPath) ? p.replace(oldPath, newPath) : p);
        let activeFilePath = state.activeFilePath;
        if (activeFilePath && activeFilePath.startsWith(oldPath)) {
            activeFilePath = activeFilePath.replace(oldPath, newPath);
        }

        return { ...state, fileContents: newFileContents, activeFilePath, openFilePaths, stagedChanges: null };
    }
    case 'DELETE_PATH': {
        const { path } = action.payload;
        const isDeletingDirectory = !state.fileContents.hasOwnProperty(path);
        const newFileContents = { ...state.fileContents };
        
        if (isDeletingDirectory) {
            Object.keys(newFileContents).forEach(p => {
                if (p.startsWith(path + '/')) {
                    delete newFileContents[p];
                }
            });
        } else {
            delete newFileContents[path];
        }

        const openFilePaths = state.openFilePaths.filter(p => !p.startsWith(path));
        let activeFilePath = state.activeFilePath;
        if (activeFilePath && !openFilePaths.includes(activeFilePath)) {
            if (openFilePaths.length > 0) {
                activeFilePath = openFilePaths[0];
            } else {
                const remainingPaths = Object.keys(newFileContents).sort();
                activeFilePath = remainingPaths.length > 0 ? remainingPaths[0] : null;
                if (activeFilePath) {
                    openFilePaths.push(activeFilePath);
                }
            }
        }

        return { ...state, fileContents: newFileContents, openFilePaths, activeFilePath, stagedChanges: null };
    }
    // WebContainer Actions
    case 'SET_WEBCONTAINER_STATUS':
      return { ...state, webContainerState: { ...state.webContainerState, status: action.payload.status } };
    case 'SET_WEBCONTAINER_URL':
      return { ...state, webContainerState: { ...state.webContainerState, serverUrl: action.payload.url } };
    case 'SET_WEBCONTAINER_ERROR':
      // Don't set error during scaffolding mode
      if (state.isScaffolding) {
        return state;
      }
      return { ...state, webContainerState: { ...state.webContainerState, status: 'error', error: action.payload.error } };
    case 'CLEAR_WEBCONTAINER_ERROR':
      return { ...state, webContainerState: { ...state.webContainerState, error: null } };
    case 'SET_SCAFFOLDING_MODE':
      return { ...state, isScaffolding: action.payload.isScaffolding };
    case 'APPEND_TERMINAL_OUTPUT':
      return { ...state, webContainerState: { ...state.webContainerState, terminalOutput: state.webContainerState.terminalOutput + action.payload.output } };
    case 'CLEAR_TERMINAL_OUTPUT':
      return { ...state, webContainerState: { ...state.webContainerState, terminalOutput: '' } };
    // UI state toggles
    case 'TOGGLE_SIDEBAR':
      return { ...state, showSidebar: !state.showSidebar };
    case 'TOGGLE_TERMINAL':
      return { ...state, showTerminal: !state.showTerminal };
    default:
      return state;
  }
}

export function useProjectState() {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  return { state, dispatch };
}

export function buildFileTree(paths: string[]): FileNode {
  const root: FileNode = { name: 'root', path: '', type: 'directory', children: [] };

  paths.forEach(path => {
    let currentNode = root;
    const parts = path.split('/').filter(p => p);
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let childNode = currentNode.children?.find(child => child.name === part);

      if (!childNode) {
        childNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'directory',
          ...(isFile ? {} : { children: [] }),
        };
        currentNode.children?.push(childNode);
      }
      if (!isFile) {
        currentNode = childNode;
      }
    });
  });

  // Sort children: directories first, then files, all alphabetically
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };
  
  if (root.children) {
      sortNodes(root.children);
  }

  return root;
}