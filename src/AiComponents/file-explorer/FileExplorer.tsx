
import React, { useState, useEffect, useRef } from 'react';
import { FileNode, StagedChanges, AiActionEnum } from '../../types';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
import Modal from '../ui/Modal';

// Professional SVG Icons
const FolderIcon = ({ className = "w-5 h-5", isOpen = false }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const FileIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FilePlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FilePencilIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const FileMinusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const FolderPlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PencilIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface FileExplorerProps {
  fileTree: FileNode;
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  stagedChanges: StagedChanges | null;
  onCreateFile: (path: string) => void;
  onRenamePath: (oldPath: string, newPath: string) => void;
  onDeletePath: (path: string) => void;
}

const RenameInput: React.FC<{
    node: FileNode;
    onRename: (oldPath: string, newPath: string) => void;
    onCancel: () => void;
}> = ({ node, onRename, onCancel }) => {
    const [name, setName] = useState(node.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleSubmit = () => {
        if (name && name !== node.name) {
            const parentPath = node.path.substring(0, node.path.lastIndexOf('/'));
            const newPath = parentPath ? `${parentPath}/${name}` : name;
            onRename(node.path, newPath);
        }
        onCancel();
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onCancel();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-text-primary outline-none ring-1 ring-accent-primary rounded px-1"
        />
    );
};

const NewItemInput: React.FC<{
    type: 'file' | 'directory';
    depth: number;
    onSubmit: (name: string) => void;
    onCancel: () => void;
}> = ({ type, depth, onSubmit, onCancel }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = () => {
        if (name) {
            onSubmit(name);
        }
        onCancel();
    };

    return (
        <div style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }} className="flex items-center w-full text-left px-2 py-1.5">
            {/* Arrow icon for new directory */}
            {type === 'directory' && (
              <div className="mr-1 flex-shrink-0">
                <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
              </div>
            )}
            {type === 'directory' ? <FolderIcon isOpen={false} className="w-5 h-5 mr-2 flex-shrink-0" /> : <FileIcon className="w-5 h-5 mr-2 flex-shrink-0" />}
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                    if (e.key === 'Escape') onCancel();
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-transparent text-text-primary outline-none ring-1 ring-accent-primary rounded px-1"
                placeholder={`New ${type}...`}
            />
        </div>
    );
};

interface FileEntryProps {
    node: FileNode;
    depth: number;
    activeFilePath: string | null;
    onSelectFile: (path: string) => void;
    stagedChanges: StagedChanges | null;
    onContextMenu: (event: React.MouseEvent, node: FileNode) => void;
    renamingPath: string | null;
    startRename: (path: string) => void;
    onRenamePath: (oldPath: string, newPath: string) => void;
    openFolders: Record<string, boolean>;
    toggleFolder: (path: string) => void;
    creatingInfo: { parentPath: string; type: 'file' | 'directory' } | null;
    onFinishCreate: (name: string) => void;
    onCancelCreate: () => void;
}

const FileEntry: React.FC<FileEntryProps> = ({ node, depth, activeFilePath, onSelectFile, stagedChanges, onContextMenu, renamingPath, startRename, onRenamePath, openFolders, toggleFolder, creatingInfo, onFinishCreate, onCancelCreate }) => {
  const isDirectory = node.type === 'directory';
  const isActive = activeFilePath === node.path;
  const isRenaming = renamingPath === node.path;
  const isOpen = isDirectory && (openFolders[node.path] ?? false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      toggleFolder(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  const action = stagedChanges?.actions.find(a => a.path === node.path);
  let status: 'created' | 'updated' | 'deleted' | null = null;
  if (action) {
    if (action.action === AiActionEnum.CREATE_FILE) status = 'created';
    else if (action.action === AiActionEnum.UPDATE_FILE) status = 'updated';
    else if (action.action === AiActionEnum.DELETE_FILE) status = 'deleted';
  }

  const getStatusStyles = () => {
    if (isRenaming) return 'bg-accent-primary/20';
    if (isActive) {
        return 'bg-accent-primary/10 text-accent-primary font-medium';
    }
    switch (status) {
        case 'created':
            return 'text-emerald-400 hover:bg-emerald-500/10';
        case 'updated':
            return 'text-amber-400 hover:bg-amber-500/10';
        case 'deleted':
            return 'text-rose-400 line-through hover:bg-rose-500/10';
        default:
            return 'text-text-secondary hover:bg-bg-glass hover:text-text-primary';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
        case 'created':
            return <FilePlusIcon className="w-5 h-5 mr-2 flex-shrink-0" />;
        case 'updated':
            return <FilePencilIcon className="w-5 h-5 mr-2 flex-shrink-0" />;
        case 'deleted':
            return <FileMinusIcon className="w-5 h-5 mr-2 flex-shrink-0" />;
        default:
            return isDirectory ? <FolderIcon isOpen={isOpen} className="w-5 h-5 mr-2 flex-shrink-0" /> : <FileIcon className="w-5 h-5 mr-2 flex-shrink-0" />;
    }
  }

  const itemClass = `flex items-center w-full text-left px-2 py-1.5 rounded-md cursor-pointer transition-colors duration-150 ${getStatusStyles()}`;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.path);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div>
      <div 
        onClick={handleToggle} 
        onContextMenu={(e) => onContextMenu(e, node)}
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
        className={itemClass}
        draggable="true"
        onDragStart={handleDragStart}
      >
        {/* Arrow icon for folders */}
        {isDirectory && (
          <div className="mr-1 flex-shrink-0">
            {isOpen ? (
              <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-text-secondary" />
            )}
          </div>
        )}
        {getStatusIcon()}
        {isRenaming ? (
            <RenameInput node={node} onRename={onRenamePath} onCancel={() => startRename('')} />
        ) : (
            <span className="truncate flex-grow">{node.name}</span>
        )}
      </div>
      {isDirectory && isOpen && (
        <div>
          {node.children?.filter(child => child.name !== '.gitkeep').map(child => (
            <FileEntry 
              key={child.path} 
              node={child} 
              depth={depth + 1} 
              {...{ activeFilePath, onSelectFile, stagedChanges, onContextMenu, renamingPath, startRename, onRenamePath, openFolders, toggleFolder, creatingInfo, onFinishCreate, onCancelCreate }}
            />
          ))}
          {creatingInfo && creatingInfo.parentPath === node.path && (
            <NewItemInput 
                type={creatingInfo.type}
                depth={depth + 1}
                onSubmit={onFinishCreate}
                onCancel={onCancelCreate}
            />
          )}
        </div>
      )}
    </div>
  );
};

const FileExplorer: React.FC<FileExplorerProps> = ({ fileTree, activeFilePath, onSelectFile, stagedChanges, onCreateFile, onRenamePath, onDeletePath }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: FileNode } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<FileNode | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [creatingInfo, setCreatingInfo] = useState<{ parentPath: string; type: 'file' | 'directory' } | null>(null);

  useEffect(() => {
    if (activeFilePath) {
      const parts = activeFilePath.split('/');
      const pathsToOpen: Record<string, boolean> = {};
      for (let i = 0; i < parts.length - 1; i++) {
        const path = parts.slice(0, i + 1).join('/');
        pathsToOpen[path] = true;
      }
      setOpenFolders(prev => ({ ...prev, ...pathsToOpen }));
    }
  }, [activeFilePath]);

  const toggleFolder = (path: string) => {
    setOpenFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleContextMenu = (event: React.MouseEvent, node: FileNode) => {
    event.preventDefault();
    event.stopPropagation();
    setRenamingPath(null);
    setCreatingInfo(null);
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  };

  const closeContextMenu = () => setContextMenu(null);

  const startCreateItem = (node: FileNode, type: 'file' | 'directory') => {
    closeContextMenu();
    const parentPath = node.type === 'directory' ? node.path : node.path.substring(0, node.path.lastIndexOf('/'));
    
    setOpenFolders(prev => ({ ...prev, [parentPath]: true }));

    setCreatingInfo({ parentPath, type });
  };

  const handleFinishCreate = (name: string) => {
    if (!creatingInfo || !name) {
      setCreatingInfo(null);
      return;
    }
    let newPath = creatingInfo.parentPath ? `${creatingInfo.parentPath}/${name}` : name;
    if (creatingInfo.type === 'directory') {
        newPath += '/.gitkeep'; // Create a placeholder file to represent the folder
    }
    onCreateFile(newPath);
    setCreatingInfo(null);
  };

  const getContextMenuItems = (): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const { node } = contextMenu;

    return [
        { label: 'New File...', icon: <FilePlusIcon className="w-4 h-4" />, onClick: () => startCreateItem(node, 'file') },
        { label: 'New Folder...', icon: <FolderPlusIcon className="w-4 h-4" />, onClick: () => startCreateItem(node, 'directory') },
        { isSeparator: true },
        { label: 'Rename', icon: <PencilIcon className="w-4 h-4" />, onClick: () => { setRenamingPath(node.path); closeContextMenu(); } },
        { label: 'Delete', icon: <TrashIcon className="w-4 h-4" />, onClick: () => { setNodeToDelete(node); closeContextMenu(); }, color: 'text-rose-400' },
    ];
  }
  
  const handleDeleteConfirm = () => {
    if (nodeToDelete) {
        onDeletePath(nodeToDelete.path);
        setNodeToDelete(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-1 relative bg-bg-primary" onClick={() => { closeContextMenu(); setRenamingPath(null); setCreatingInfo(null); }}>
      {fileTree.children?.filter(node => node.name !== '.gitkeep').map(node => (
        <FileEntry 
            key={node.path} 
            node={node} 
            depth={0} 
            activeFilePath={activeFilePath} 
            onSelectFile={onSelectFile} 
            stagedChanges={stagedChanges}
            onContextMenu={handleContextMenu}
            renamingPath={renamingPath}
            startRename={setRenamingPath}
            onRenamePath={onRenamePath}
            openFolders={openFolders}
            toggleFolder={toggleFolder}
            creatingInfo={creatingInfo}
            onFinishCreate={handleFinishCreate}
            onCancelCreate={() => setCreatingInfo(null)}
        />
      ))}
      {contextMenu && (
        <ContextMenu
            position={{ x: contextMenu.x, y: contextMenu.y }}
            items={getContextMenuItems()}
            onClose={closeContextMenu}
        />
      )}
      {nodeToDelete && (
        <Modal
          isOpen={!!nodeToDelete}
          onClose={() => setNodeToDelete(null)}
          title={`Delete ${nodeToDelete.type}?`}
        >
          <div>
            <p className="text-text-secondary">
              Are you sure you want to permanently delete <strong className="font-mono text-text-primary">{nodeToDelete.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setNodeToDelete(null)}
                className="px-4 py-2 rounded-md bg-bg-glass-light text-text-secondary hover:bg-bg-glass font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FileExplorer;
