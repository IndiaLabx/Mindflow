import type { jsPDF } from 'jspdf';
import { Idiom } from '../../../types/models';
import { PDFGenerationConfig } from '../../../hooks/usePDFGenerator';

// Constants
const PDF_BG_COLOR = '#FFE9E2';
const TEXT_COLOR_DARK = '#000000';
const PAGE_EDGE_PADDING = 10;
const CARD_PADDING = 10;

/**
 * Helper to render Hindi text to an image.
 */
const renderHindiToImage = async (text: string, html2canvas: any): Promise<string> => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '500px';
  container.style.backgroundColor = PDF_BG_COLOR;
  container.style.padding = '4px';
  container.style.fontFamily = 'serif';
  container.style.fontSize = '24pt';
  container.style.color = TEXT_COLOR_DARK;
  container.style.lineHeight = '1.5';
  container.innerText = text;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: PDF_BG_COLOR,
      scale: 2,
      logging: false,
    });
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Generates the Idioms PDF.
 */
export const generateIdiomsPDF = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {
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
  const halfPageHeight = pageHeight / 2;
  const cardWidth = pageWidth - (PAGE_EDGE_PADDING * 2);
  const cardHeight = halfPageHeight - (PAGE_EDGE_PADDING * 2);
  const contentWidth = cardWidth - (CARD_PADDING * 2);

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    await new Promise(resolve => setTimeout(resolve, 0)); // Yield to main thread to prevent UI freeze
    const isTop = i % 2 === 0;

    if (i > 0 && isTop) {
      doc.addPage();
    }

    const cardStartX = PAGE_EDGE_PADDING;
    const cardStartY = isTop ? PAGE_EDGE_PADDING : (halfPageHeight + PAGE_EDGE_PADDING);

    // Draw Card Background
    // Use explicit RGB values (255, 233, 226) for #FFE9E2 to prevent black background issue
    doc.setFillColor(255, 233, 226);
    doc.rect(cardStartX, cardStartY, cardWidth, cardHeight, 'F');

    let currentX = cardStartX + CARD_PADDING;
    let currentY = cardStartY + CARD_PADDING;

    // --- PHRASE (Topic) ---
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK);

    const phraseText = doc.splitTextToSize(item.content.phrase, contentWidth);
    doc.text(phraseText, currentX, currentY + 5);
    currentY += (doc.getTextDimensions(phraseText).h + 8);

    const addField = (label: string, content: string | string[], isHindiImage: boolean = false) => {
      // Label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(label.toUpperCase(), currentX, currentY);

      currentY += 4;

      if (isHindiImage) {
        return;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(TEXT_COLOR_DARK);

      const textStr = Array.isArray(content) ? content.join('; ') : content;
      const lines = doc.splitTextToSize(textStr, contentWidth);
      doc.text(lines, currentX, currentY);
      currentY += (doc.getTextDimensions(lines).h + 5);
    };

    // Meaning (English)
    addField('Meaning', item.content.meanings.english);

    // Meaning (Hindi) - IMAGE
    if (item.content.meanings.hindi) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('HINDI MEANING', currentX, currentY);
        currentY += 4;

        const hindiImgData = await renderHindiToImage(item.content.meanings.hindi, html2canvas);

        const imgProps = doc.getImageProperties(hindiImgData);
        const finalImgWidth = 80;
        const finalImgHeight = (imgProps.height * finalImgWidth) / imgProps.width;

        doc.addImage(hindiImgData, 'JPEG', currentX, currentY, finalImgWidth, finalImgHeight);
        currentY += (finalImgHeight + 5);
    }

    // Usage
    if (item.content.usage) {
      addField('Usage', item.content.usage);
    }

    // Origin
    if (item.content.extras.origin) {
      addField('Origin', item.content.extras.origin);
    }

    // Mnemonic
    if (item.content.extras.mnemonic) {
      addField('Mnemonic', item.content.extras.mnemonic);
    }
  }

  return doc.output('blob');
};
