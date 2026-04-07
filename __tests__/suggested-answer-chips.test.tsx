/**
 * Phase 14 unit tests: SuggestedAnswerChips component
 * Covers: RENDER-01, RENDER-02, RENDER-03, INTERACT-01, INTERACT-02
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestedAnswerChips } from '@/components/assistant-ui/suggested-answer-chips';

// Mock assistant-ui hooks
const mockAppend = vi.fn();
let mockMessageMetadata: Record<string, unknown> = {};

vi.mock('@assistant-ui/react', () => ({
  useMessage: (selector: (m: unknown) => unknown) =>
    selector({
      metadata: { custom: mockMessageMetadata },
    }),
  useAssistantRuntime: () => ({
    thread: { append: mockAppend },
  }),
}));

describe('SuggestedAnswerChips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMessageMetadata = {};
  });

  it('renders nothing when suggestedActions is an empty array', () => {
    mockMessageMetadata = { suggestedActions: [] };
    const { container } = render(<SuggestedAnswerChips />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when suggestedActions is undefined/missing from metadata', () => {
    mockMessageMetadata = {};
    const { container } = render(<SuggestedAnswerChips />);
    expect(container.innerHTML).toBe('');
  });

  it('renders one button per action with the action label as text content', () => {
    mockMessageMetadata = {
      suggestedActions: [
        { label: 'Option A', prompt: 'Do A' },
        { label: 'Option B', prompt: 'Do B' },
      ],
    };
    render(<SuggestedAnswerChips />);
    expect(screen.getByText('Option A')).toBeDefined();
    expect(screen.getByText('Option B')).toBeDefined();
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('each button has the exact chip classes', () => {
    mockMessageMetadata = {
      suggestedActions: [{ label: 'Test', prompt: 'test prompt' }],
    };
    render(<SuggestedAnswerChips />);
    const button = screen.getByRole('button');
    expect(button.className).toBe(
      'px-3 py-1.5 text-xs rounded-full border border-border bg-background hover:bg-muted transition-colors cursor-pointer',
    );
  });

  it('clicking a button calls runtime.thread.append with correct payload', () => {
    mockMessageMetadata = {
      suggestedActions: [{ label: 'Send it', prompt: 'the actual prompt' }],
    };
    render(<SuggestedAnswerChips />);
    fireEvent.click(screen.getByText('Send it'));
    expect(mockAppend).toHaveBeenCalledWith({
      role: 'user',
      content: [{ type: 'text', text: 'the actual prompt' }],
    });
  });

  it('after clicking a button, all buttons disappear', () => {
    mockMessageMetadata = {
      suggestedActions: [
        { label: 'A', prompt: 'PA' },
        { label: 'B', prompt: 'PB' },
      ],
    };
    const { container } = render(<SuggestedAnswerChips />);
    fireEvent.click(screen.getByText('A'));
    expect(container.innerHTML).toBe('');
  });

  it('container div has correct classes', () => {
    mockMessageMetadata = {
      suggestedActions: [{ label: 'X', prompt: 'PX' }],
    };
    const { container } = render(<SuggestedAnswerChips />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toBe('flex flex-wrap gap-2 mt-2 px-2');
  });
});
