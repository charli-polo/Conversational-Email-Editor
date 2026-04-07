'use client';

import type { ConversationWithTags, ConversationTag } from '@/hooks/use-conversations';
import { Badge } from '@/components/ui/badge';
import { TagPopover } from '@/components/conversations/tag-popover';
import { basePath } from '@/lib/base-path';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

interface ConversationListItemProps {
  conversation: ConversationWithTags;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  allTags: ConversationTag[];
  onAssignTag: (tagName: string) => void;
  onRemoveTag: (tagId: string) => void;
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
  allTags,
  onAssignTag,
  onRemoveTag,
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
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {conversation.agent_label && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
              {conversation.agent_label}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(conversation.updated_at).toLocaleDateString()}
          </span>
          {conversation.tags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs px-1.5 py-0 h-5 gap-1">
              {tag.name}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveTag(tag.id); }}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        {conversation.preview && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{conversation.preview}</p>
        )}
      </a>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TagPopover
          allTags={allTags}
          assignedTagIds={new Set(conversation.tags.map((t) => t.id))}
          onAssign={onAssignTag}
          trigger={
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
              title="Add tag"
            >
              <Plus className="h-4 w-4" />
            </button>
          }
        />
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
