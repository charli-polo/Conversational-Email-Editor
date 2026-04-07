'use client';

import type { ConversationWithTags } from '@/hooks/use-conversations';
import { Badge } from '@/components/ui/badge';
import { basePath } from '@/lib/base-path';
import { Pencil, Trash2 } from 'lucide-react';

interface ConversationListItemProps {
  conversation: ConversationWithTags;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

export function ConversationListItem({
  conversation,
  isEditing,
  editValue,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: ConversationListItemProps) {
  return (
    <div className="group flex items-center gap-3 px-6 py-4 hover:bg-accent/50 transition-colors">
      <a href={basePath + '/c/' + conversation.id} className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
            onBlur={onSaveEdit}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="w-full bg-transparent border-b border-primary outline-none text-sm font-medium"
          />
        ) : (
          <span className="text-sm font-medium truncate block">
            {conversation.title || 'Untitled conversation'}
          </span>
        )}
        <div className="flex items-center gap-2 mt-1">
          {conversation.agent_label && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
              {conversation.agent_label}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(conversation.updated_at).toLocaleDateString()}
          </span>
        </div>
        {conversation.preview && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{conversation.preview}</p>
        )}
      </a>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStartEdit(); }}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
          title="Rename conversation"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-accent transition-colors"
          title="Delete conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
