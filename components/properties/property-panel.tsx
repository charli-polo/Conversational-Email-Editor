'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AlignLeft, AlignCenter, AlignRight, Upload } from 'lucide-react';
import { EmailSection, EmailElement } from '@/components/preview/email-preview';

interface PropertyPanelProps {
  selectedSection: EmailSection | null;
  selectedElement: EmailElement | null;
  currentHtml: string;
  onHtmlUpdate: (html: string) => void;
  onClose?: () => void;
}

interface SectionProperties {
  backgroundColor: string;
  padding: string;
  textAlign: string;
}

interface ImageProperties {
  src: string;
  alt: string;
  width: string;
  height: string;
  widthValue: string;
  widthUnit: 'px' | '%';
}

export function PropertyPanel({
  selectedSection,
  selectedElement,
  currentHtml,
  onHtmlUpdate,
  onClose
}: PropertyPanelProps) {
  const [properties, setProperties] = useState<SectionProperties>({
    backgroundColor: '',
    padding: '',
    textAlign: ''
  });

  const [imageProperties, setImageProperties] = useState<ImageProperties>({
    src: '',
    alt: '',
    width: '',
    height: '',
    widthValue: '',
    widthUnit: 'px'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract properties from section HTML when section changes
  useEffect(() => {
    if (selectedSection) {
      const extracted = extractPropertiesFromHtml(selectedSection.html);
      setProperties(extracted);
    }
  }, [selectedSection]);

  // Extract image properties when element changes
  useEffect(() => {
    if (selectedElement && selectedElement.type === 'image') {
      const extracted = extractImageProperties(currentHtml, selectedElement.id);
      setImageProperties(extracted);
    }
  }, [selectedElement, currentHtml]);

  // Handler functions (must be before JSX)
  const handleImagePropertyChange = (property: keyof ImageProperties, value: string) => {
    if (!selectedElement) return;

    setImageProperties(prev => ({ ...prev, [property]: value }));

    // Update HTML immediately
    const updatedHtml = updateImageProperties(
      currentHtml,
      selectedElement.id,
      { ...imageProperties, [property]: value }
    );

    onHtmlUpdate(updatedHtml);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 2MB for base64)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image is too large (max 2MB). Please use a smaller image or paste a URL.');
      return;
    }

    // Read file and convert to data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Update image src with data URL
        handleImagePropertyChange('src', dataUrl);
      }
    };
    reader.onerror = () => {
      alert('Failed to read image file');
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleWidthChange = (value: string, unit: 'px' | '%') => {
    if (!selectedElement) return;

    const newWidth = value ? `${value}${unit}` : '';
    console.log('Width change:', { value, unit, newWidth, elementId: selectedElement.id });

    setImageProperties(prev => ({
      ...prev,
      widthValue: value,
      widthUnit: unit,
      width: newWidth
    }));

    // Update HTML immediately with new properties
    const updatedHtml = updateImageProperties(
      currentHtml,
      selectedElement.id,
      {
        ...imageProperties,
        width: newWidth,
        widthValue: value,
        widthUnit: unit
      }
    );

    console.log('HTML updated:', updatedHtml !== currentHtml);
    onHtmlUpdate(updatedHtml);
  };

  // Guard: require either section or element
  if (!selectedSection && !selectedElement) {
    return null;
  }

  // Handle image element
  if (selectedElement && selectedElement.type === 'image') {
    return (
      <div className="flex flex-col h-full bg-background border-r border-border">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {selectedElement.label}
          </h2>
        </div>

        {/* Image preview */}
        <div className="p-4 border-b border-border">
          <div className="relative rounded-lg overflow-hidden bg-gray-100 border border-border">
            {imageProperties.src ? (
              <img
                src={imageProperties.src}
                alt={imageProperties.alt}
                className="w-full h-auto object-contain"
                style={{ maxHeight: '300px' }}
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {imageProperties.width && imageProperties.height && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {imageProperties.width} × {imageProperties.height} px
            </p>
          )}
        </div>

        {/* Properties form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Replace button */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Replace
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e)}
            />
          </div>

          {/* Width */}
          <div className="flex items-center justify-between">
            <Label htmlFor="width" className="text-base font-normal">
              Width
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="width"
                type="number"
                value={imageProperties.widthValue}
                onChange={(e) => handleWidthChange(e.target.value, imageProperties.widthUnit)}
                placeholder="600"
                className="w-24 text-right"
                min="0"
              />
              <select
                value={imageProperties.widthUnit}
                onChange={(e) => handleWidthChange(imageProperties.widthValue, e.target.value as 'px' | '%')}
                className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="px">px</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image-url" className="text-sm font-medium">
              Image URL
            </Label>
            <Input
              id="image-url"
              type="url"
              value={imageProperties.src}
              onChange={(e) => handleImagePropertyChange('src', e.target.value)}
              placeholder="https://..."
              className="font-mono text-sm"
            />
          </div>

          {/* Alt text */}
          <div className="space-y-2">
            <Label htmlFor="alt-text" className="text-sm font-medium">
              Alt text
            </Label>
            <Input
              id="alt-text"
              type="text"
              value={imageProperties.alt}
              onChange={(e) => handleImagePropertyChange('alt', e.target.value)}
              placeholder="Describe the image..."
            />
          </div>
        </div>
      </div>
    );
  }

  // Handle other element types (not yet implemented)
  if (!selectedSection) {
    return (
      <div className="flex flex-col h-full bg-background border-r border-border p-4">
        <p className="text-sm text-muted-foreground">
          Element properties coming soon...
        </p>
      </div>
    );
  }

  const handlePropertyChange = (property: keyof SectionProperties, value: string) => {
    console.log('=== PROPERTY CHANGE ===');
    console.log('Property:', property);
    console.log('Value:', value);
    console.log('Section ID:', selectedSection?.id);

    setProperties(prev => ({ ...prev, [property]: value }));

    // Update HTML immediately
    if (selectedSection) {
      const updatedHtml = updateSectionProperties(
        currentHtml,
        selectedSection.id,
        { ...properties, [property]: value }
      );

      console.log('Updated HTML length:', updatedHtml.length);
      console.log('HTML changed:', updatedHtml !== currentHtml);

      onHtmlUpdate(updatedHtml);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          {selectedSection.label}
        </h2>
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

  // Strategy: Find the main content table (width="600" is standard for email sections)
  // Apply styles to the first <td> inside that table
  const mainTable = sectionRow.querySelector('table[width="600"]') ||
                    sectionRow.querySelector('table[width="100%"]') ||
                    sectionRow.querySelector('table');

  if (mainTable) {
    // Find the first <td> in the main table - this is typically the content container
    const contentCell = mainTable.querySelector('td');

    if (contentCell) {
      const existingStyle = contentCell.getAttribute('style') || '';
      const styles = parseInlineStyles(existingStyle);

      // Only update properties that have values
      if (properties.backgroundColor) {
        styles['background-color'] = properties.backgroundColor;
      }
      if (properties.padding) {
        styles['padding'] = properties.padding;
      }

      const newStyle = Object.entries(styles)
        .map(([key, value]) => `${key}:${value}`)
        .join(';');
      contentCell.setAttribute('style', newStyle);
    }
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

// Helper function to extract image properties from HTML
function extractImageProperties(fullHtml: string, elementId: string): ImageProperties {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, 'text/html');

  const img = doc.querySelector(`img[data-element-id="${elementId}"]`);

  if (!img) {
    return { src: '', alt: '', width: '', height: '', widthValue: '', widthUnit: 'px' };
  }

  const width = img.getAttribute('width') || '';

  // Parse width to extract value and unit
  let widthValue = '';
  let widthUnit: 'px' | '%' = 'px';

  if (width) {
    const match = width.match(/^(\d+)(px|%)?$/);
    if (match) {
      widthValue = match[1];
      widthUnit = (match[2] as 'px' | '%') || 'px';
    }
  }

  return {
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
    width: width,
    height: img.getAttribute('height') || '',
    widthValue,
    widthUnit
  };
}

// Helper function to update image properties in full HTML
function updateImageProperties(
  fullHtml: string,
  elementId: string,
  properties: ImageProperties
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, 'text/html');

  const img = doc.querySelector(`img[data-element-id="${elementId}"]`);

  if (!img) {
    console.warn('Image not found:', elementId);
    return fullHtml;
  }

  // Update image attributes
  if (properties.src) {
    img.setAttribute('src', properties.src);
  }
  if (properties.alt !== undefined) {
    img.setAttribute('alt', properties.alt);
  }
  if (properties.width !== undefined) {
    // Get existing inline styles
    const existingStyle = img.getAttribute('style') || '';
    const styles = parseInlineStyles(existingStyle);

    if (properties.width) {
      // Update width in INLINE STYLE (not attribute) - this is what actually works in emails
      styles['width'] = properties.width;
      styles['height'] = 'auto';

      // Center the image to avoid grey zones when resizing
      styles['display'] = 'block';
      styles['margin-left'] = 'auto';
      styles['margin-right'] = 'auto';

      // Also update the attribute for compatibility
      const widthValue = properties.width.replace(/px$/, '');
      img.setAttribute('width', widthValue);
      img.removeAttribute('height');
    } else {
      // Remove width from style
      delete styles['width'];
      img.removeAttribute('width');
    }

    // Apply all styles
    const newStyle = Object.entries(styles)
      .map(([key, value]) => `${key}:${value}`)
      .join(';');
    img.setAttribute('style', newStyle);
  }

  return doc.body.innerHTML;
}
