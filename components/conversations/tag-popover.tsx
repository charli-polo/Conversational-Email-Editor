'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import type { ConversationTag } from '@/hooks/use-conversations';

interface TagPopoverProps {
  allTags: ConversationTag[];
  assignedTagIds: Set<string>;
  onAssign: (tagName: string) => void;
  trigger: React.ReactNode;
}

export function TagPopover({ allTags, assignedTagIds, onAssign, trigger }: TagPopoverProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const filteredTags = allTags.filter(
    (tag) => !assignedTagIds.has(tag.id)
  );

  const normalizedInput = inputValue.trim().toLowerCase();
  const exactMatch = allTags.some((tag) => tag.name === normalizedInput);

  const handleSelect = (tagName: string) => {
    onAssign(tagName);
    setInputValue('');
    // Keep popover open for assigning multiple tags
  };

  const handleCreateAndAssign = () => {
    if (normalizedInput) {
      handleSelect(normalizedInput);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Add tag..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && normalizedInput && !exactMatch) {
                e.preventDefault();
                handleCreateAndAssign();
              }
            }}
          />
          <CommandList>
            <CommandEmpty>
              {normalizedInput ? (
                <button
                  className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                  onClick={handleCreateAndAssign}
                >
                  Create &quot;{normalizedInput}&quot;
                </button>
              ) : (
                <span className="text-sm text-muted-foreground">No tags yet</span>
              )}
            </CommandEmpty>
            {filteredTags.map((tag) => (
              <CommandItem
                key={tag.id}
                value={tag.name}
                onSelect={() => handleSelect(tag.name)}
              >
                {tag.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
