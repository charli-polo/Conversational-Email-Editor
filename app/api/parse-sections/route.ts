import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export interface EmailSection {
  id: string; // e.g. "section-0", "section-1"
  html: string; // the full <tr>...</tr> HTML
  label: string; // human-readable description
  index: number; // position in the email
}

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Invalid HTML provided' },
        { status: 400 }
      );
    }

    const { sections, annotatedHtml } = parseEmailSections(html);

    return NextResponse.json({ sections, annotatedHtml });
  } catch (error) {
    console.error('Error parsing sections:', error);
    return NextResponse.json(
      { error: 'Failed to parse email sections' },
      { status: 500 }
    );
  }
}

function parseEmailSections(html: string): { sections: EmailSection[]; annotatedHtml: string } {
  const $ = cheerio.load(html);
  const sections: EmailSection[] = [];

  // Find the main 600px email table
  // Strategy: find table with width="600" or style containing "width: 600"
  const mainTable = $('table[width="600"]').first();

  if (mainTable.length === 0) {
    // Fallback: try to find table with inline style width: 600px
    const fallbackTable = $('table').filter((_, el) => {
      const style = $(el).attr('style') || '';
      return style.includes('width: 600') || style.includes('width:600');
    }).first();

    if (fallbackTable.length === 0) {
      console.warn('Could not find main email table (width="600")');
      return { sections: [], annotatedHtml: html };
    }

    const extractedSections = extractSectionsFromTable(fallbackTable, $);
    return { sections: extractedSections, annotatedHtml: $.html() };
  }

  const extractedSections = extractSectionsFromTable(mainTable, $);
  return { sections: extractedSections, annotatedHtml: $.html() };
}

function extractSectionsFromTable(
  table: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI
): EmailSection[] {
  const sections: EmailSection[] = [];

  // Get direct <tr> children of the main table
  // Try direct <tr> first, then look in <tbody>
  let rows = table.find('> tr');
  if (rows.length === 0) {
    rows = table.find('> tbody > tr');
  }

  rows.each((index, row) => {
    const $row = $(row);

    // Add data-section-id attribute for later reference
    const sectionId = `section-${index}`;
    $row.attr('data-section-id', sectionId);

    // Extract HTML for this section
    const sectionHtml = $.html($row);

    // Generate a human-readable label based on content
    const label = generateSectionLabel($row, $, index);

    sections.push({
      id: sectionId,
      html: sectionHtml,
      label,
      index,
    });
  });

  return sections;
}

function generateSectionLabel(
  row: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
  index: number
): string {
  const text = row.text().trim().toLowerCase();
  const images = row.find('img');
  const headings = row.find('h1, h2, h3');
  const links = row.find('a');
  const buttons = row.find('a[style*="background-color"]');
  const tables = row.find('table');

  // Check for HR separator
  const hr = row.find('hr');
  if (hr.length > 0 && text.length < 10) {
    return 'Divider';
  }

  // Check for footer (unsubscribe, copyright, legal text)
  if (text.includes('unsubscribe') || text.includes('©') || text.includes('copyright') ||
      text.includes('all rights reserved') || text.includes('manage your preferences')) {
    return 'Footer';
  }

  // Check for header (logo + navigation)
  const hasLogo = images.filter((_, img) => {
    const src = $(img).attr('src') || '';
    const alt = $(img).attr('alt') || '';
    return src.includes('logo') || alt.toLowerCase().includes('logo');
  }).length > 0;

  const hasNav = links.length >= 3 && links.filter((_, a) => {
    const href = $(a).attr('href') || '';
    return href.includes('/') && !href.includes('instagram') && !href.includes('facebook');
  }).length >= 3;

  if (hasLogo && hasNav) {
    return 'Header';
  }

  // Check for features grid (multiple feature boxes)
  const featureBoxes = row.find('table[style*="background-color:#f8f9fa"]');
  if (featureBoxes.length >= 2 || (headings.length > 0 && text.includes('engineered'))) {
    return 'Features';
  }

  // Check for quote section (italic text, centered, no images)
  const hasItalic = row.find('p[style*="font-style:italic"]').length > 0;
  if (hasItalic && images.length === 0 && text.length > 50 && text.length < 300) {
    return 'Quote';
  }

  // Check for product section (heading + price + button)
  const hasPrice = text.includes('eur') || text.includes('$') || /\d+[,.]00/.test(text);
  if (headings.length > 0 && hasPrice && buttons.length > 0) {
    return 'Product details';
  }

  // Check for CTA section (button + large heading)
  if (buttons.length > 0 && headings.length > 0 && text.includes('?')) {
    return 'Call to action';
  }

  // Check for text + image sections (zigzag layouts)
  if (images.length > 0 && headings.length > 0 && text.length > 100) {
    return 'Text + Image';
  }

  // Check for image-only sections (just an image, minimal text)
  if (images.length > 0 && text.length < 50) {
    return 'Image section';
  }

  // Check for hero sections (large image at top)
  if (images.length > 0 && index < 3) {
    return 'Hero image';
  }

  // Check for image section
  if (images.length > 0) {
    return 'Image section';
  }

  // Text-only sections
  if (headings.length > 0) {
    return 'Text section';
  }

  // Last resort
  return `Section ${index + 1}`;
}
