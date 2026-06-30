import type { jsPDF } from 'jspdf';
import { SynonymWord } from '../../../../features/quiz/types';
import { PDFGenerationConfig } from '../../../../hooks/usePDFGenerator';

// Constants
const PDF_BG_COLOR = '#F0F9FF'; // light blue tint for synonyms
const TEXT_COLOR_DARK = '#000000';
const PAGE_MARGIN_X = 15;
const PAGE_MARGIN_Y = 15;

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
 * Generates the Synonym PDF.
 */
export const generateSynonymPDF = async (data: any[], config: PDFGenerationConfig): Promise<Blob> => {
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

    if (i > 0 && isTop) {
      doc.addPage();
      doc.setFillColor(PDF_BG_COLOR);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    const startY = isTop ? PAGE_MARGIN_Y : halfPageHeight + PAGE_MARGIN_Y;
    let currentY = startY;

    // --- WORD ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEXT_COLOR_DARK);

    const wordText = doc.splitTextToSize(item.word, contentWidth);
    doc.text(wordText, PAGE_MARGIN_X, currentY);
    currentY += (doc.getTextDimensions(wordText).h + 6);

    const addField = (label: string, content: string | string[], isHindiImage: boolean = false) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(label.toUpperCase(), PAGE_MARGIN_X, currentY);

      currentY += 4;

      if (isHindiImage && typeof content === 'string') {
        return;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(TEXT_COLOR_DARK);

      const textStr = Array.isArray(content) ? content.join(', ') : content;
      const lines = doc.splitTextToSize(textStr, contentWidth);
      doc.text(lines, PAGE_MARGIN_X, currentY);
      currentY += (doc.getTextDimensions(lines).h + 5);
    };

    // POS
    if (item.pos) {
      addField('Part of Speech', item.pos);
    }

    // Meaning (English)
    addField('Meaning', item.meaning);

    // Meaning (Hindi) - IMAGE
    if (item.hindiMeaning) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('HINDI MEANING', PAGE_MARGIN_X, currentY);
      currentY += 4;

      const hindiImgData = await renderHindiToImage(item.hindiMeaning, html2canvas);

      const imgProps = doc.getImageProperties(hindiImgData);
      const finalImgWidth = 100;
      const finalImgHeight = (imgProps.height * finalImgWidth) / imgProps.width;

      doc.addImage(hindiImgData, 'JPEG', PAGE_MARGIN_X, currentY, finalImgWidth, finalImgHeight);
      currentY += (finalImgHeight + 5);
    }

    // Top Synonyms
    if (item.synonyms && item.synonyms.length > 0) {
      const topSynonyms = item.synonyms.map((s: any) => s.text);
      addField('Top Synonyms', topSynonyms);
    }

    // Confusable With
    if (item.confusable_with && item.confusable_with.length > 0) {
      addField('Confusable With', item.confusable_with);
    }

    // Frequency/Importance Score
    if (item.importance_score) {
      addField('Frequency Score', item.importance_score.toString());
    }

    // Draw a separator line if it's the top item
    if (isTop) {
       doc.setDrawColor(200, 200, 200);
       (doc as any).setLineDash([2, 2], 0);
       doc.line(10, halfPageHeight, pageWidth - 10, halfPageHeight);
       (doc as any).setLineDash([], 0);
    }
  }

  return doc.output('blob');
};
