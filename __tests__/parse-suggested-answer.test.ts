/**
 * Phase 13 unit tests: parseSuggestedAnswer
 * Covers: PARSE-01 (extraction), PARSE-02 (stripping), PARSE-03 (graceful handling)
 */
import { describe, it, expect } from 'vitest';
import { parseSuggestedAnswer } from '@/lib/dify/parse-suggested-answer';
import type { SuggestedAction, ParseResult } from '@/lib/dify/parse-suggested-answer';

describe('parseSuggestedAnswer', () => {
  it('extracts actions from a basic suggested_answer block', () => {
    const input = 'Text\n<suggested_answer>[{"label":"A","prompt":"B"}]</suggested_answer>';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Text');
    expect(result.actions).toEqual([{ label: 'A', prompt: 'B' }]);
  });

  it('returns original text and empty actions when no block is present', () => {
    const input = 'Just plain text';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Just plain text');
    expect(result.actions).toEqual([]);
  });

  it('returns empty actions when JSON inside block is malformed', () => {
    const input = 'Text\n<suggested_answer>not json</suggested_answer>';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Text');
    expect(result.actions).toEqual([]);
  });

  it('returns empty actions when block contains an empty array', () => {
    const input = 'Text\n<suggested_answer>[]</suggested_answer>';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Text');
    expect(result.actions).toEqual([]);
  });

  it('handles block at start of message', () => {
    const input = '<suggested_answer>[{"label":"A","prompt":"B"}]</suggested_answer>\nMore text';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('More text');
    expect(result.actions).toEqual([{ label: 'A', prompt: 'B' }]);
  });

  it('handles block with extra whitespace inside tags', () => {
    const input = 'Text\n<suggested_answer>\n  [{"label":"A","prompt":"B"}]\n</suggested_answer>';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Text');
    expect(result.actions).toEqual([{ label: 'A', prompt: 'B' }]);
  });

  it('filters out invalid action objects missing label or prompt', () => {
    const input = 'Text\n<suggested_answer>[{"label":"A"},{"label":"B","prompt":"C"}]</suggested_answer>';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Text');
    expect(result.actions).toEqual([{ label: 'B', prompt: 'C' }]);
  });

  it('returns empty displayText and empty actions for empty string input', () => {
    const result = parseSuggestedAnswer('');
    expect(result.displayText).toBe('');
    expect(result.actions).toEqual([]);
  });

  it('extracts multiple actions from the block', () => {
    const input = 'Choose:\n<suggested_answer>[{"label":"A","prompt":"PA"},{"label":"B","prompt":"PB"},{"label":"C","prompt":"PC"}]</suggested_answer>';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Choose:');
    expect(result.actions).toHaveLength(3);
    expect(result.actions).toEqual([
      { label: 'A', prompt: 'PA' },
      { label: 'B', prompt: 'PB' },
      { label: 'C', prompt: 'PC' },
    ]);
  });

  it('extracts actions from {answer, actions} wrapper format', () => {
    const input = 'Question?\n<suggested_answer>\n{"answer":"Pick one","actions":[{"label":"A","prompt":"PA"},{"label":"B","prompt":"PB"}]}\n</suggested_answer>';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Question?');
    expect(result.actions).toEqual([
      { label: 'A', prompt: 'PA' },
      { label: 'B', prompt: 'PB' },
    ]);
  });

  it('returns empty actions for wrapper object with no actions array', () => {
    const input = 'Text\n<suggested_answer>{"answer":"Pick one"}</suggested_answer>';
    const result = parseSuggestedAnswer(input);
    expect(result.displayText).toBe('Text');
    expect(result.actions).toEqual([]);
  });
});
