import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { EMAIL_EDITOR_SYSTEM_PROMPT } from "@/lib/prompts/email-editor";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "OpenAI API key is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, html, selectedSectionId, selectedSectionHtml, selectedElementId, selectedElementType, selectedElementTag } = await req.json();

    // Debug log to see what's being sent
    console.log('🔍 API received:', {
      selectedElementId,
      selectedSectionId,
      hasSectionHtml: !!selectedSectionHtml
    });

    if (!html) {
      return new Response(
        JSON.stringify({ error: "No email HTML provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine context to send to AI
    let contextHtml: string;
    let contextDescription: string;
    let systemPrompt: string;

    if (selectedElementId) {
      // Element editing - return immediate error without calling AI
      console.log('⚡ Element selected - returning immediate error (no AI call)');

      const errorMessage = `I'm working with GPT-4o and I'm not capable enough to precisely edit individual elements like prices, text, or buttons.

**What works well:**
- Edit the entire section (click on the whole section, not individual elements)
- Use the Visual Editor (toggle below) for colors, spacing, alignment, etc.

Sorry for the limitation! 🙏`;

      // Return as a stream (like AI responses) so useChat can handle it
      const result = streamText({
        model: openai("gpt-4o-mini"),
        messages: [{ role: "assistant", content: errorMessage }],
        maxTokens: 1, // Don't actually generate anything
      });

      // Override to return our error message immediately
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`0:${JSON.stringify(errorMessage)}\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1"
        }
      });

      // OLD CODE - kept for reference but unreachable now
      contextHtml = selectedSectionHtml;
      contextDescription = `Section containing element (${selectedElementId})`;
      systemPrompt = EMAIL_EDITOR_SYSTEM_PROMPT + `\n\n🎯 CRITICAL: ELEMENT EDITING MODE

⚠️ THE USER HAS ALREADY SELECTED A SPECIFIC ELEMENT TO EDIT ⚠️

The user clicked on a specific element in the email preview. You are editing ONLY that element.

Selected Element:
- Type: ${selectedElementType || 'unknown'}
- Tag: ${selectedElementTag || 'unknown'}
- ID: ${selectedElementId}

When the user says "change to X" or "make it Y", they are referring to THIS SPECIFIC ELEMENT ONLY.
DO NOT ask for clarification - the element is already selected.

INPUT: You will receive ONE complete <tr> section containing the target element (marked with data-element-id="${selectedElementId}").

OUTPUT REQUIREMENTS - READ CAREFULLY:
✅ MUST return the COMPLETE <tr>...</tr> section
✅ ONLY change the TEXT CONTENT inside the element with data-element-id="${selectedElementId}"
✅ Do NOT add any new elements (no images, no divs, no tables, NOTHING)
✅ Do NOT remove any elements
✅ Do NOT change any attributes except the text content
✅ PRESERVE EXACTLY as is:
   - All other elements in the section (keep same count, same order)
   - All attributes (including data-element-id, data-element-type, data-section-id)
   - All table structure
   - All inline styles
   - All images (do NOT add, remove, or move images)
✅ Return VALID HTML (properly nested tags, closed tags)
✅ Do NOT add extra <tr> rows
✅ Do NOT remove the <tr> wrapper
✅ The ONLY thing that should change is the text inside the target element

EXAMPLE 1 - Text change:
User: "Change to 100,00 EUR"
INPUT:  <tr data-section-id="section-2"><td><p data-element-id="element-section-2-p-0">200,00 EUR</p><button>Buy</button></td></tr>
OUTPUT: <tr data-section-id="section-2"><td><p data-element-id="element-section-2-p-0">100,00 EUR</p><button>Buy</button></td></tr>

EXAMPLE 2 - Style change:
User: "Make it bold"
INPUT:  <tr data-section-id="section-1"><td><h1 data-element-id="element-section-1-h1-0">Title</h1><p>Text</p></td></tr>
OUTPUT: <tr data-section-id="section-1"><td><h1 data-element-id="element-section-1-h1-0" style="font-weight: bold;">Title</h1><p>Text</p></td></tr>

❌ WRONG - Missing <tr> wrapper:
<td><p data-element-id="...">100,00 EUR</p></td>

❌ WRONG - Only returning the element:
<p data-element-id="...">100,00 EUR</p>

Your response MUST start with <tr and end with </tr>

VALIDATION: Your output will be checked. If it contains more than one <tr> tag, it will be REJECTED.
Count your <tr> tags before responding. There should be EXACTLY ONE opening <tr> and ONE closing </tr>.`;
    } else if (selectedSectionId && selectedSectionHtml) {
      // Scoped editing - only send the selected section
      contextHtml = selectedSectionHtml;
      contextDescription = `Selected section HTML (${selectedSectionId})`;
      systemPrompt = EMAIL_EDITOR_SYSTEM_PROMPT + `\n\n🚨 CRITICAL: SECTION EDITING MODE

You are editing ONLY ONE SECTION of the email. The user selected a single section.

INPUT: You will receive ONE <tr> element containing the section content.
OUTPUT: You MUST return EXACTLY ONE <tr> element with your modifications.

STRICT RULES:
❌ NEVER generate multiple <tr> elements
❌ NEVER duplicate the section
❌ NEVER create new sections
❌ NEVER add additional rows
✅ ONLY modify content INSIDE the single <tr> element
✅ Keep the same structure: ONE <tr> with ONE or more <td> inside
✅ Return a single, complete <tr>...</tr> element

EXAMPLE:
User says: "Make the heading red"
INPUT:  <tr><td><h1 style="color: black;">Hello</h1></td></tr>
OUTPUT: <tr><td><h1 style="color: red;">Hello</h1></td></tr>

❌ WRONG (duplicated):
<tr><td><h1 style="color: red;">Hello</h1></td></tr>
<tr><td><h1 style="color: red;">Hello</h1></td></tr>

Your response must be EXACTLY ONE <tr> element. Count your <tr> tags before responding.`;
    } else {
      // Full email editing
      contextHtml = html;
      contextDescription = "Full email HTML";
      systemPrompt = EMAIL_EDITOR_SYSTEM_PROMPT;
    }

    try {
      // Use gpt-4o for everything (gpt-4o-mini was causing issues)
      const modelToUse = "gpt-4o";

      console.log('🤖 AI Model:', modelToUse, '| Element ID:', selectedElementId || 'none');

      // Enhance user messages when editing a specific element
      let enhancedMessages = messages;
      if (selectedElementId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
          // Add context to the user's instruction
          const elementTypeLabel = selectedElementType === 'text' ? 'text element' :
                                   selectedElementType === 'image' ? 'image' :
                                   selectedElementType === 'heading' ? 'heading' :
                                   selectedElementType === 'button' ? 'button' :
                                   'element';

          const enhancedContent = `Change the selected ${elementTypeLabel} to: ${lastMessage.content}`;
          console.log('💬 Enhanced prompt:', enhancedContent);

          enhancedMessages = [
            ...messages.slice(0, -1),
            {
              ...lastMessage,
              content: enhancedContent
            }
          ];
        }
      }

      const result = streamText({
        model: openai(modelToUse),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `${contextDescription}:\n\`\`\`html\n${contextHtml}\n\`\`\``,
          },
          ...enhancedMessages,
        ],
      });

      return result.toDataStreamResponse();
    } catch (streamError) {
      console.error("StreamText error:", streamError);
      // Log more details about the error
      if (streamError instanceof Error) {
        console.error("Error message:", streamError.message);
        console.error("Error stack:", streamError.stack);
      }
      throw streamError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: errorMessage
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
