import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PresetCardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  presetName: string;
}

export const PresetCardMenu: React.FC<PresetCardMenuProps> = ({
  onEdit,
  onDelete,
  presetName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'p-2 rounded-lg text-zinc-400 transition-colors',
          'hover:text-zinc-200 hover:bg-zinc-700',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500',
          isOpen && 'bg-zinc-700 text-zinc-200'
        )}
        aria-label={`More options for ${presetName}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="text-sm tracking-wider">•••</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            'absolute right-0 top-full mt-1 z-50',
            'w-36 py-1 rounded-lg',
            'bg-zinc-800 border border-zinc-700 shadow-xl',
            'transition-all duration-100 ease-out',
            'opacity-100 scale-100'
          )}
        >
          {/* Edit Option */}
          <button
            role="menuitem"
            onClick={handleEdit}
            className={cn(
              'w-full px-3 py-2 text-left text-sm',
              'flex items-center gap-2',
              'text-zinc-200 hover:bg-zinc-700',
              'transition-colors'
            )}
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-zinc-700" />

          {/* Delete Option */}
          <button
            role="menuitem"
            onClick={handleDelete}
            className={cn(
              'w-full px-3 py-2 text-left text-sm',
              'flex items-center gap-2',
              'text-red-400 hover:bg-red-500/10',
              'transition-colors'
            )}
          >
            <span>🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
