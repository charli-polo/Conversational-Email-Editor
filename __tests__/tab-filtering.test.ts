import { describe, it, expect } from 'vitest';

/**
 * Tests for the tab filtering logic used in ConversationsPage.
 * These test the pure filtering function that drives the tab UI.
 */

interface ConversationTag {
  id: string;
  name: string;
}

interface ConversationWithTags {
  id: string;
  title: string | null;
  tags: ConversationTag[];
}

// This mirrors the filteredConversations useMemo logic from conversations-page.tsx
function filterConversationsByTab(
  conversations: ConversationWithTags[],
  activeTab: string
): ConversationWithTags[] {
  if (activeTab === 'all') return conversations;
  return conversations.filter((c) =>
    c.tags.some((t) => t.id === activeTab)
  );
}

// This mirrors the activeTab reset logic
function shouldResetTab(
  activeTab: string,
  allTags: ConversationTag[]
): boolean {
  return activeTab !== 'all' && !allTags.some((t) => t.id === activeTab);
}

const tagAlpha: ConversationTag = { id: 'tag-1', name: 'alpha' };
const tagBeta: ConversationTag = { id: 'tag-2', name: 'beta' };

const conversations: ConversationWithTags[] = [
  { id: 'c1', title: 'Conv 1', tags: [tagAlpha] },
  { id: 'c2', title: 'Conv 2', tags: [tagBeta] },
  { id: 'c3', title: 'Conv 3', tags: [tagAlpha, tagBeta] },
  { id: 'c4', title: 'Conv 4', tags: [] },
];

describe('Tab filtering logic', () => {
  it('returns all conversations when activeTab is "all"', () => {
    const result = filterConversationsByTab(conversations, 'all');
    expect(result).toHaveLength(4);
    expect(result).toEqual(conversations);
  });

  it('filters to only conversations with the selected tag', () => {
    const result = filterConversationsByTab(conversations, 'tag-1');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(['c1', 'c3']);
  });

  it('filters correctly for a different tag', () => {
    const result = filterConversationsByTab(conversations, 'tag-2');
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.id)).toEqual(['c2', 'c3']);
  });

  it('returns empty array when no conversations match the tag', () => {
    const result = filterConversationsByTab(conversations, 'tag-nonexistent');
    expect(result).toHaveLength(0);
  });

  it('returns empty array when conversations list is empty', () => {
    const result = filterConversationsByTab([], 'tag-1');
    expect(result).toHaveLength(0);
  });
});

describe('Tab reset logic', () => {
  it('does not reset when activeTab is "all"', () => {
    expect(shouldResetTab('all', [])).toBe(false);
    expect(shouldResetTab('all', [tagAlpha])).toBe(false);
  });

  it('resets when activeTab references a tag not in allTags', () => {
    expect(shouldResetTab('tag-1', [tagBeta])).toBe(true);
    expect(shouldResetTab('tag-1', [])).toBe(true);
  });

  it('does not reset when activeTab references a tag in allTags', () => {
    expect(shouldResetTab('tag-1', [tagAlpha, tagBeta])).toBe(false);
  });
});
