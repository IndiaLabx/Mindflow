import type { jsPDF } from 'jspdf';
import { OneWord } from '../../../../types/models';
import { PDFGenerationConfig } from '../../../../hooks/usePDFGenerator';

// Constants
const PDF_BG_COLOR = '#FFE9E2';
const TEXT_COLOR_DARK = '#000000'; // Or a dark gray if preferred
const PAGE_MARGIN_X = 15;
const PAGE_MARGIN_Y = 15;

/**
 * Helper to render Hindi text to an image.
 */
const renderHindiToImage = async (text: string, html2canvas: any): Promise<string> => {
  // Create a container for the text
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '500px'; // Fixed width for consistency
  container.style.backgroundColor = PDF_BG_COLOR;
  container.style.padding = '4px';
  container.style.fontFamily = 'serif'; // Use a standard serif font or specific Hindi font if available
  container.style.fontSize = '24pt'; // Increased size as per user request
  container.style.color = TEXT_COLOR_DARK;
  container.style.lineHeight = '1.5';
  container.innerText = text;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: PDF_BG_COLOR,
      scale: 2, // Higher scale for better quality, then we display it smaller
      logging: false,
    });
    return canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with compression
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Generates the OWS PDF.
 */
export const generateOWSPDF = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {
  const { jsPDF } = await import('jspdf');
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (PAGE_MARGIN_X * 2);
  const halfPageHeight = pageHeight / 2;

  // Set background for the first page
  doc.setFillColor(PDF_BG_COLOR);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread to prevent UI freeze
    const isTop = i % 2 === 0;

    // Add new page if we are starting an odd index (which goes to top) and it's not the first item
    if (i > 0 && isTop) {
      doc.addPage();
      doc.setFillColor(PDF_BG_COLOR);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    const startY = isTop ? PAGE_MARGIN_Y : halfPageHeight + PAGE_MARGIN_Y;
    let currentY = startY;

    // --- WORD (Topic) ---
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK);

    const wordText = doc.splitTextToSize(item.content.word, contentWidth);
    doc.text(wordText, PAGE_MARGIN_X, currentY);
    currentY += (doc.getTextDimensions(wordText).h + 6);

    // Helper to add labeled fields
    const addField = (label: string, content: string | string[], isHindiImage: boolean = false) => {
      // Label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100); // Lighter for label? Or keep black. Let's keep dark grey.
      doc.text(label.toUpperCase(), PAGE_MARGIN_X, currentY);

      const labelWidth = doc.getTextWidth(label.toUpperCase());
      // Small gap after label if inline? No, let's put content below or inline depending on space.
      // Design requirement: "Little short size font" for label. "Normal font size" for content.
      // Let's put content on next line or same line with offset.
      // User said "And then each part ... will have little short size font. And Then main content inside these will be of Normal font size".

      // Let's drop a line for content to be safe and clean.
      currentY += 4;

      if (isHindiImage && typeof content === 'string') {
        // We handle this externally in the loop for async reasons,
        // but if we were strictly using this helper we'd need to pause.
        // So we won't use this helper for the Hindi Image part directly inside the standard flow if we need async.
        return;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(TEXT_COLOR_DARK);

      const textStr = Array.isArray(content) ? content.join('; ') : content;
      const lines = doc.splitTextToSize(textStr, contentWidth);
      doc.text(lines, PAGE_MARGIN_X, currentY);
      currentY += (doc.getTextDimensions(lines).h + 5);
    };

    // POS
    addField('Part of Speech', item.content.pos);

    // Meaning (English)
    addField('Meaning', item.content.meaning_en);

    // Meaning (Hindi) - IMAGE
    // Label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text('HINDI MEANING', PAGE_MARGIN_X, currentY);
    currentY += 4;

    // Render Image
    const hindiImgData = await renderHindiToImage(item.content.meaning_hi, html2canvas);

    // Calculate dimensions to fit width but keep aspect ratio
    // We generated it at 500px width.
    const imgProps = doc.getImageProperties(hindiImgData);
    const renderedWidth = Math.min(contentWidth, 100); // Limit width to 100mm (~half page width) or full width?
    // Let's give it full content width capability but usually it's short.
    // Let's map the 500px width to something reasonable.
    // If we use full content width, it might be huge.
    // Let's use a fixed width of say 80mm unless text is long.
    // Actually, `renderHindiToImage` fixed width at 500px.
    // Let's assume we want to display it at 500px / (pixels per mm).
    // Better: let's scale it to fit nicely.
    const finalImgWidth = 100; // 10cm wide
    const finalImgHeight = (imgProps.height * finalImgWidth) / imgProps.width;

    doc.addImage(hindiImgData, 'JPEG', PAGE_MARGIN_X, currentY, finalImgWidth, finalImgHeight);
    currentY += (finalImgHeight + 5);

    // Usage
    if (item.content.usage_sentences && item.content.usage_sentences.length > 0) {
      addField('Usage', item.content.usage_sentences);
    }

    // Origin
    if (item.content.origin) {
      addField('Origin', item.content.origin);
    }

    // Mnemonics (Extras) - OWS model has 'note' or 'origin'.
    // Model doesn't have explicit mnemonics field but user mentioned it.
    // We'll check 'note'.
    if (item.content.note) {
      addField('Note', item.content.note);
    }

    // Draw a separator line if it's the top item
    if (isTop) {
       doc.setDrawColor(200, 200, 200); // Light grey line
       // Cast to any because setLineDash is missing from @types/jspdf but exists in the library
       (doc as any).setLineDash([2, 2], 0);
       doc.line(10, halfPageHeight, pageWidth - 10, halfPageHeight);
       (doc as any).setLineDash([], 0); // Reset
    }
  }

  return doc.output('blob');
};
