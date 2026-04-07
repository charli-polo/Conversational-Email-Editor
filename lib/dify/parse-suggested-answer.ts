/**
 * Pure parser for <suggested_answer> blocks in Dify agent messages.
 * Extracts structured actions and returns clean display text.
 *
 * Phase 13: PARSE-01 (extraction), PARSE-02 (stripping), PARSE-03 (graceful handling)
 */

export interface SuggestedAction {
  label: string;
  prompt: string;
}

export interface ParseResult {
  displayText: string;
  actions: SuggestedAction[];
}

/**
 * Extracts a <suggested_answer> JSON block from message text.
 * Returns clean display text with the block removed, and parsed actions.
 * If no block is found, returns the original text with empty actions.
 */
export function parseSuggestedAnswer(text: string): ParseResult {
  const match = text.match(/<suggested_answer>([\s\S]*?)<\/suggested_answer>/);

  if (!match) {
    return { displayText: text, actions: [] };
  }

  // Remove the entire block from display text
  const displayText = text
    .replace(/<suggested_answer>[\s\S]*?<\/suggested_answer>/, '')
    .trim();

  // Parse the JSON content
  try {
    const parsed = JSON.parse(match[1].trim());
    const actions: SuggestedAction[] = Array.isArray(parsed)
      ? parsed.filter(
          (item: unknown): item is SuggestedAction =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as Record<string, unknown>).label === 'string' &&
            typeof (item as Record<string, unknown>).prompt === 'string',
        )
      : [];
    return { displayText, actions };
  } catch {
    // Malformed JSON -- strip the block but return no actions
    return { displayText, actions: [] };
  }
}
