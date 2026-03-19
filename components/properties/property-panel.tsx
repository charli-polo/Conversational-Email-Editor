'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { EmailSection } from '@/components/preview/email-preview';

interface PropertyPanelProps {
  selectedSection: EmailSection;
  currentHtml: string;
  onHtmlUpdate: (html: string) => void;
  onClose?: () => void;
}

interface SectionProperties {
  backgroundColor: string;
  padding: string;
  textAlign: string;
}

export function PropertyPanel({
  selectedSection,
  currentHtml,
  onHtmlUpdate,
  onClose
}: PropertyPanelProps) {
  const [properties, setProperties] = useState<SectionProperties>({
    backgroundColor: '',
    padding: '',
    textAlign: ''
  });

  // Extract properties from section HTML when section changes
  useEffect(() => {
    const extracted = extractPropertiesFromHtml(selectedSection.html);
    setProperties(extracted);
  }, [selectedSection]);

  const handlePropertyChange = (property: keyof SectionProperties, value: string) => {
    console.log('=== PROPERTY CHANGE ===');
    console.log('Property:', property);
    console.log('Value:', value);
    console.log('Section ID:', selectedSection.id);

    setProperties(prev => ({ ...prev, [property]: value }));

    // Update HTML immediately
    const updatedHtml = updateSectionProperties(
      currentHtml,
      selectedSection.id,
      { ...properties, [property]: value }
    );

    console.log('Updated HTML length:', updatedHtml.length);
    console.log('HTML changed:', updatedHtml !== currentHtml);

    onHtmlUpdate(updatedHtml);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Design
        </h2>
        <p className="text-sm text-muted-foreground">
          Editing: {selectedSection.label}
        </p>
      </div>

      {/* Properties form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Text Alignment */}
        <div className="flex items-center justify-between">
          <Label className="text-base font-normal">
            Text Alignment
          </Label>
          <ToggleGroup
            type="single"
            value={properties.textAlign}
            onValueChange={(value) => value && handlePropertyChange('textAlign', value)}
          >
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Padding */}
        <div className="flex items-center justify-between">
          <Label htmlFor="padding" className="text-base font-normal">
            Padding
          </Label>
          <Input
            id="padding"
            type="text"
            value={properties.padding}
            onChange={(e) => handlePropertyChange('padding', e.target.value)}
            placeholder="16px 48px"
            className="w-48"
          />
        </div>

        {/* Background Color */}
        <div className="flex items-center justify-between">
          <Label htmlFor="bg-color" className="text-base font-normal">
            Background color
          </Label>
          <Input
            id="bg-color"
            type="color"
            value={properties.backgroundColor || '#ffffff'}
            onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
            className="w-16 h-10 p-1 cursor-pointer rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}

// Helper function to extract properties from section HTML
function extractPropertiesFromHtml(html: string): SectionProperties {
  const properties: SectionProperties = {
    backgroundColor: '',
    padding: '',
    textAlign: ''
  };

  // Parse inline styles from the <tr> or <td> elements
  const bgColorMatch = html.match(/background-color:\s*([^;}"]+)/i) ||
                       html.match(/bgcolor=["']([^"']+)["']/i);
  if (bgColorMatch) {
    properties.backgroundColor = bgColorMatch[1].trim();
  }

  const paddingMatch = html.match(/padding:\s*([^;}"]+)/i);
  if (paddingMatch) {
    properties.padding = paddingMatch[1].trim();
  }

  const textAlignMatch = html.match(/text-align:\s*([^;}"]+)/i);
  if (textAlignMatch) {
    properties.textAlign = textAlignMatch[1].trim();
  }

  return properties;
}

// Helper function to update section properties in full HTML
function updateSectionProperties(
  fullHtml: string,
  sectionId: string,
  properties: SectionProperties
): string {
  console.log('updateSectionProperties called');
  console.log('Section ID:', sectionId);
  console.log('Properties:', properties);

  // Use DOMParser for client-side HTML parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, 'text/html');

  // Find the section row
  const sectionRow = doc.querySelector(`[data-section-id="${sectionId}"]`);

  if (!sectionRow) {
    console.warn('Section not found:', sectionId);
    return fullHtml;
  }

  console.log('Section found!');

  // Find the main table inside this section (usually the first one)
  const mainTable = sectionRow.querySelector('table');

  // Update background color on the main table
  if (properties.backgroundColor && mainTable) {
    const existingStyle = mainTable.getAttribute('style') || '';
    const styles = parseInlineStyles(existingStyle);
    styles['background-color'] = properties.backgroundColor;
    const newStyle = Object.entries(styles)
      .map(([key, value]) => `${key}:${value}`)
      .join(';');
    mainTable.setAttribute('style', newStyle);
  }

  // Update padding on the main table
  if (properties.padding && mainTable) {
    const existingStyle = mainTable.getAttribute('style') || '';
    const styles = parseInlineStyles(existingStyle);
    styles['padding'] = properties.padding;
    const newStyle = Object.entries(styles)
      .map(([key, value]) => `${key}:${value}`)
      .join(';');
    mainTable.setAttribute('style', newStyle);
  }

  // Update text alignment on all text elements
  if (properties.textAlign) {
    // Apply to all text containers within the section
    const textElements = sectionRow.querySelectorAll('p, h1, h2, h3, h4, h5, h6, td');
    textElements.forEach((el) => {
      const existingStyle = el.getAttribute('style') || '';
      const styles = parseInlineStyles(existingStyle);
      styles['text-align'] = properties.textAlign;
      const newStyle = Object.entries(styles)
        .map(([key, value]) => `${key}:${value}`)
        .join(';');
      el.setAttribute('style', newStyle);
    });
  }

  console.log('Properties applied successfully');

  // Return the full HTML (body content)
  return doc.body.innerHTML;
}

// Helper to parse inline styles string into object
function parseInlineStyles(styleString: string): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!styleString) return styles;

  styleString.split(';').forEach(rule => {
    const [key, value] = rule.split(':').map(s => s.trim());
    if (key && value) {
      styles[key] = value;
    }
  });

  return styles;
}
