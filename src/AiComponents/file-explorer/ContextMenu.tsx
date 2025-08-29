import React, { useEffect, useRef } from 'react';

type ActionMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isSeparator?: false;
  color?: string;
};

type SeparatorMenuItem = {
  isSeparator: true;
};

export type ContextMenuItem = ActionMenuItem | SeparatorMenuItem;

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, position, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className="fixed bg-neutral-900 border border-neutral-700 rounded-md shadow-lg py-1.5 z-50 min-w-[180px] animate-fade-in-sm"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => {
        if (!('label' in item)) {
          return <div key={`sep-${index}`} className="h-px bg-neutral-700 my-1 mx-2" />;
        }

        return (
          <button
            key={item.label}
            onClick={(e) => {
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
            className={`flex items-center w-full px-3 py-1.5 text-sm text-left ${item.color || 'text-neutral-200'} hover:bg-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {item.icon && <span className="mr-3 w-4 h-4 flex-shrink-0">{item.icon}</span>}
            <span className="flex-grow">{item.label}</span>
          </button>
        );
      })}
       <style>{`
        @keyframes fade-in-sm {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-sm {
            animation: fade-in-sm 0.1s ease-out forwards;
        }
       `}</style>
    </div>
  );
};

export default ContextMenu;