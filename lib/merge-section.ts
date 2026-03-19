import * as cheerio from 'cheerio';

/**
 * Merges a modified section HTML back into the full email HTML
 * @param fullHtml The complete email HTML
 * @param sectionId The ID of the section to replace (e.g. "section-0")
 * @param newSectionHtml The new HTML for the section
 * @returns The updated full HTML with the section replaced
 */
export function mergeSectionHtml(
  fullHtml: string,
  sectionId: string,
  newSectionHtml: string
): string {
  // Strategy: find the section by data-section-id and replace it
  // Use cheerio to properly handle nested HTML elements

  let processedNewHtml = newSectionHtml.trim();

  // 🚨 CRITICAL FIX: Detect if AI generated multiple <tr> elements (duplication bug)
  // Use cheerio to properly parse and extract only the first top-level <tr>
  const $new = cheerio.load(`<body>${processedNewHtml}</body>`);
  const topLevelTrs = $new('body > tr');

  if (topLevelTrs.length > 1) {
    console.warn(`⚠️ AI generated ${topLevelTrs.length} <tr> elements instead of 1! Fixing duplication...`);

    // Keep ONLY the first top-level <tr>
    const firstTr = topLevelTrs.first();
    processedNewHtml = $new.html(firstTr) || processedNewHtml;
    console.log('✅ Fixed: Kept only the first <tr> element');
  } else if (topLevelTrs.length === 1) {
    // Single <tr> found - use it
    processedNewHtml = $new.html(topLevelTrs.first()) || processedNewHtml;
  }

  // Check if the new section HTML has the data-section-id attribute
  // If not, add it
  if (!processedNewHtml.includes(`data-section-id="${sectionId}"`)) {
    // Use cheerio to properly add the attribute
    const $proc = cheerio.load(processedNewHtml);
    const tr = $proc('tr').first();
    if (tr.length > 0) {
      tr.attr('data-section-id', sectionId);
      processedNewHtml = $proc.html(tr) || processedNewHtml;
    }
  }

  // Now use cheerio to replace the section in fullHtml
  const $ = cheerio.load(fullHtml);
  const targetSection = $(`[data-section-id="${sectionId}"]`);

  if (targetSection.length === 0) {
    console.warn(`Failed to find section ${sectionId} in HTML for replacement`);
    return fullHtml; // Return original if replacement failed
  }

  // Replace the target section with the new HTML
  targetSection.replaceWith(processedNewHtml);

  return $.html();
}
