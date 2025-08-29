import React from 'react';
import { AiAction, AiActionEnum } from '../../types';
import FilePlusIcon from '../../icons/FilePlusIcon';
import FilePencilIcon from '../../icons/FilePencilIcon';
import FileMinusIcon from '../../icons/FileMinusIcon';
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

interface ActionSummaryProps {
  actions: AiAction[];
  onSelectFile: (path: string) => void;
}

const ActionEntry: React.FC<{ icon: React.ReactNode; path: string; onClick?: () => void; color: string; hoverColor: string }> = ({ icon, path, onClick, color, hoverColor }) => (
    <div 
        onClick={onClick}
        className={`flex items-center p-2 rounded-md transition-colors duration-150 ${onClick ? `cursor-pointer ${hoverColor}` : 'opacity-70'}`}
    >
        <div className={`mr-3 flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <span className="font-mono text-sm text-neutral-300 truncate">{path}</span>
    </div>
);

const ActionSummary: React.FC<ActionSummaryProps> = ({ actions, onSelectFile }) => {
    const created = actions.filter(a => a.action === AiActionEnum.CREATE_FILE);
    const updated = actions.filter(a => a.action === AiActionEnum.UPDATE_FILE);
    const deleted = actions.filter(a => a.action === AiActionEnum.DELETE_FILE);

    if (!actions || actions.length === 0) {
        return null;
    }

    const renderSection = (title: string, actionList: AiAction[], icon: React.ReactNode, color: string, hoverColor: string, isDeleted = false) => {
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
                            onClick={!isDeleted ? () => onSelectFile(action.path) : undefined}
                            color={color}
                            hoverColor={hoverColor}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
                    {renderSection('Created', created, <PlusIcon className="w-5 h-5" />, 'text-emerald-400', 'hover:bg-neutral-700/50')}
        {renderSection('Updated', updated, <EditIcon className="w-5 h-5" />, 'text-amber-400', 'hover:bg-neutral-700/50')}
        {renderSection('Deleted', deleted, <MinusIcon className="w-5 h-5" />, 'text-rose-400', 'hover:bg-transparent', true)}
        </div>
    );
};

export default ActionSummary;