'use client';

import Image from 'next/image';

interface NavigationSidebarProps {
  mode: 'chat' | 'design';
  onModeChange: (mode: 'chat' | 'design') => void;
}

export function NavigationSidebar({ mode, onModeChange }: NavigationSidebarProps) {
  return (
    <div className="w-20 bg-background border-r border-border flex flex-col items-center py-2 gap-2">
      {/* Chat Button */}
      <button
        onClick={() => onModeChange('chat')}
        className={`flex flex-col items-center gap-2 w-16 py-3 rounded-lg transition-colors ${
          mode === 'chat'
            ? 'bg-indigo-100 text-foreground'
            : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'
        }`}
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <Image
            src="/icons/aura-icon.svg"
            alt="Chat"
            width={16}
            height={16}
            className={mode === 'chat' ? '' : 'opacity-60'}
          />
        </div>
        <span className="text-xs font-medium">Chat</span>
      </button>

      {/* Design Button */}
      <button
        onClick={() => onModeChange('design')}
        className={`flex flex-col items-center gap-2 w-16 py-3 rounded-lg transition-colors ${
          mode === 'design'
            ? 'bg-indigo-100 text-foreground'
            : 'text-muted-foreground hover:text-muted-foreground hover:bg-muted'
        }`}
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <Image
            src="/icons/design-icon.svg"
            alt="Design"
            width={16}
            height={16}
            className={mode === 'design' ? '' : 'opacity-60'}
          />
        </div>
        <span className="text-xs font-medium">Design</span>
      </button>
    </div>
  );
}
