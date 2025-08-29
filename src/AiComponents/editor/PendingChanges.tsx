
import React from 'react';
import { AiAction, AiActionEnum } from '../types';
// import FilePlusIcon from '../icons/FilePlusIcon'; // Replaced with SimpleIcon/FaviconIcon
// import FilePencilIcon from '../icons/FilePencilIcon'; // Replaced with SimpleIcon/FaviconIcon
// import FileMinusIcon from '../icons/FileMinusIcon'; // Replaced with SimpleIcon/FaviconIcon
// import CheckIcon from '../icons/CheckIcon'; // Replaced with SimpleIcon/FaviconIcon
// import XIcon from '../icons/XIcon'; // Replaced with SimpleIcon/FaviconIcon
// Professional SVG Icons
const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const MinusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const CloseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
import FaviconIcon from '../../components/FaviconIcon';

interface PendingChangesProps {
  actions: AiAction[];
  onApply: () => void;
  onDiscard: () => void;
  onSelectFile: (path: string) => void;
}

const ActionEntry: React.FC<{ icon: React.ReactNode; path: string; onClick: () => void; color: string }> = ({ icon, path, onClick, color }) => (
    <div 
        onClick={onClick}
        className="flex items-center p-2 rounded-md transition-colors duration-150 cursor-pointer hover:bg-neutral-700/50"
    >
        <div className={`mr-3 flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <span className="font-mono text-sm text-neutral-300 truncate">{path}</span>
    </div>
);

const PendingChanges: React.FC<PendingChangesProps> = ({ actions, onApply, onDiscard, onSelectFile }) => {
    const handleViewChanges = (path: string) => {
        onSelectFile(path);
    };

    const created = actions.filter(a => a.action === AiActionEnum.CREATE_FILE);
    const updated = actions.filter(a => a.action === AiActionEnum.UPDATE_FILE);
    const deleted = actions.filter(a => a.action === AiActionEnum.DELETE_FILE);

    const renderSection = (title: string, actionList: AiAction[], icon: React.ReactNode, color: string) => {
        if (actionList.length === 0) return null;
        return (
            <div>
                <h4 className="text-sm font-semibold text-neutral-400 mt-3 mb-1 px-2">{title} ({actionList.length})</h4>
                <div className="space-y-1">
                    {actionList.map(action => (
                        <ActionEntry 
                            key={action.path}
                            icon={icon}
                            path={action.path}
                            onClick={() => handleViewChanges(action.path)}
                            color={color}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            <h3 className="font-semibold text-neutral-200 mb-2 text-base">Proposed Changes</h3>
                    {renderSection('Create', created, <PlusIcon className="w-5 h-5" />, 'text-emerald-400')}
        {renderSection('Update', updated, <EditIcon className="w-5 h-5" />, 'text-amber-400')}
        {renderSection('Delete', deleted, <MinusIcon className="w-5 h-5" />, 'text-rose-400')}
            
            <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                    onClick={onDiscard}
                    className="group relative flex items-center justify-center gap-2 text-sm font-medium px-4 sm:px-5 py-2.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-0"
                    aria-label="Discard changes"
                >
                    <CloseIcon className="w-4 h-4" />
                    <span className="tracking-tight">Discard</span>
                </button>
                <button
                    onClick={onApply}
                    className="group relative flex items-center justify-center gap-2 text-sm font-semibold px-5 sm:px-6 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-200 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-emerald-400/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
                    aria-label="Apply changes"
                >
                    <CheckIcon className="w-4 h-4" />
                    <span className="tracking-tight">Apply</span>
                </button>
            </div>
        </div>
    );
};

export default PendingChanges;
