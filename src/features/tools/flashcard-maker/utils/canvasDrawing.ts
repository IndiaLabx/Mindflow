
import { FlashcardData, CardTemplate } from '../types';

// Constants that don't depend on orientation
const PADDING = 60;

// Palettes
const PALETTES = {
  idiom: {
    bg: '#ECF7E6', // Light grassy fresh green
    ink: '#1C3321', // Deep Forest Green ink
    accent: '#4C8538', // Fresh Grassy Green
    gold: '#C5A005', // Bright Gold
    grid: 'rgba(28, 51, 33, 0.05)',
  },
  ows: {
    bg: '#F0F4F8', // Cool Vintage White
    ink: '#1A202C', // Dark Slate
    accent: '#2C7A7B', // Vintage Teal
    gold: '#D69E2E', // Muted Gold (or could be a rust #C05621)
    grid: 'rgba(26, 32, 44, 0.05)',
  }
};

// Fonts
const FONTS = {
  heading: '700 72px "Playfair Display", serif',
  subheading: 'italic 700 32px "Playfair Display", serif',
  pos: 'italic 600 36px "Playfair Display", serif', // For Part of Speech
  body: '400 29px "Crimson Text", serif', // 0.6x of 48px
  hindi: '400 29px "Noto Sans Devanagari", sans-serif', // 0.6x of 48px
  label: '700 22px "Playfair Display", serif', // 0.6x of 36px
};

/**
 * Helper to wrap text into lines based on max width.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): string[] {
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Draws a vintage ornamental corner.
 */
function drawCorner(ctx: CanvasRenderingContext2D, x: number, y: number, colors: typeof PALETTES.idiom, scale: number = 1, rotation: number = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(rotation);

  ctx.beginPath();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;

  // Outer Scroll
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(20, 0, 40, 20, 40, 40);
  ctx.stroke();

  // Inner detail
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.moveTo(5, 5);
  ctx.bezierCurveTo(20, 5, 35, 20, 35, 35);
  ctx.stroke();

  // Decorative dot
  ctx.beginPath();
  ctx.fillStyle = colors.gold;
  ctx.arc(10, 10, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a decorative divider.
 */
function drawDivider(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, colors: typeof PALETTES.idiom) {
  ctx.save();
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width / 2 - 15, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width / 2 + 15, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();

  // Center diamond
  ctx.fillStyle = colors.accent;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y - 4);
  ctx.lineTo(x + width / 2 + 4, y);
  ctx.lineTo(x + width / 2, y + 4);
  ctx.lineTo(x + width / 2 - 4, y);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a labeled box containing text content.
 * Returns the total height of the drawn box.
 */
function drawSectionBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  content: string,
  colors: typeof PALETTES.idiom,
  options: {
    isItalic?: boolean;
    isHindi?: boolean;
    minHeight?: number;
  } = {}
): number {
  // Scaled down by ~0.6x from previous version
  const PADDING_BOX = 14;
  const LABEL_HEIGHT = 26;
  const GAP = 7;
  const LINE_HEIGHT = 36;

  const { isItalic = false, isHindi = false, minHeight = 0 } = options;

  // Determine font
  let fontBody = FONTS.body;
  if (isHindi) fontBody = `400 29px "Noto Sans Devanagari", "Crimson Text", serif`;
  if (isItalic) fontBody = `italic 400 29px "Crimson Text", serif`;

  // Calculate Text Layout
  ctx.font = fontBody;
  const textWidth = width - (PADDING_BOX * 2);
  const textToWrap = isItalic ? `"${content}"` : content;
  const lines = wrapText(ctx, textToWrap, textWidth, LINE_HEIGHT);

  const contentHeight = (lines.length * LINE_HEIGHT);
  let boxHeight = PADDING_BOX + LABEL_HEIGHT + GAP + contentHeight + PADDING_BOX;

  if (boxHeight < minHeight) boxHeight = minHeight;

  // Draw Box Outline
  ctx.save();
  ctx.lineWidth = 1; // Fine outline
  ctx.strokeStyle = colors.ink;
  ctx.strokeRect(x, y, width, boxHeight);

  // Draw Label
  ctx.font = FONTS.label;
  ctx.fillStyle = colors.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x + PADDING_BOX, y + PADDING_BOX);

  // Draw Content
  ctx.font = fontBody;
  ctx.fillStyle = isItalic && colors !== PALETTES.ows ? '#4A3728' : colors.ink;

  let currentTextY = y + PADDING_BOX + LABEL_HEIGHT + GAP;
  lines.forEach(line => {
    ctx.fillText(line, x + PADDING_BOX, currentTextY);
    currentTextY += LINE_HEIGHT;
  });

  ctx.restore();

  return boxHeight;
}

/**
 * Draws a diagonal ribbon label in the top-left corner.
 */
function drawCornerLabel(ctx: CanvasRenderingContext2D, text: string, colors: typeof PALETTES.idiom, template: CardTemplate) {
  ctx.save();
  // Rotate -45 degrees around the top-left origin
  ctx.rotate(-Math.PI / 4);

  const ribbonY = 45; // Distance from virtual top-left to top of ribbon
  const ribbonHeight = 32;
  const ribbonWidth = 400; // Wide enough to cover the corner

  // Draw Shadow
  ctx.fillStyle = 'rgba(44, 24, 16, 0.2)';
  ctx.fillRect(-ribbonWidth/2, ribbonY + 3, ribbonWidth, ribbonHeight);

  // Draw Ribbon Background
  // OWS uses a Teal/Green ribbon, Idiom uses Yellow
  ctx.fillStyle = template === 'ows' ? '#81E6D9' : '#FFD700';
  ctx.fillRect(-ribbonWidth/2, ribbonY, ribbonWidth, ribbonHeight);

  // Inner Border
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(-ribbonWidth/2, ribbonY + 3, ribbonWidth, ribbonHeight - 6);
  ctx.stroke();

  // Text
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 15px "Playfair Display", serif';

  const spreadText = text.split('').join(' ');
  ctx.fillText(spreadText, 0, ribbonY + (ribbonHeight/2) + 1);

  ctx.restore();
}

/**
 * Main rendering function.
 */
export async function drawCard(
  canvas: HTMLCanvasElement,
  data: FlashcardData
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const template = data.template || 'idiom';
  const colors = PALETTES[template];

  const isPortrait = data.orientation === 'portrait';
  const CARD_WIDTH = isPortrait ? 800 : 1200;
  const CARD_HEIGHT = isPortrait ? 1200 : 800;
  const CONTENT_WIDTH = CARD_WIDTH - (PADDING * 2);

  // 1. Setup Canvas
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  // 2. Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Add Texture (Subtle Noise)
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.fillStyle = '#000';
  for (let i = 0; i < 5000; i++) {
     ctx.fillRect(Math.random() * CARD_WIDTH, Math.random() * CARD_HEIGHT, 2, 2);
  }
  ctx.restore();

  // 3. Border
  const borderInset = 20;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(borderInset, borderInset, CARD_WIDTH - borderInset * 2, CARD_HEIGHT - borderInset * 2);

  // Decorative inner border line
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 1;
  ctx.strokeRect(borderInset + 6, borderInset + 6, CARD_WIDTH - (borderInset * 2) - 12, CARD_HEIGHT - (borderInset * 2) - 12);

  // 3.1. Draw ID Circle (Top Center of Border)
  if (data.id) {
    const idStr = String(data.id);
    const centerX = CARD_WIDTH / 2;
    const centerY = borderInset;
    const radius = 18;

    // Draw background circle over the line to "erase" the border segment
    ctx.fillStyle = colors.bg;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Circle Outline
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw ID Text
    ctx.fillStyle = colors.ink;
    ctx.font = 'bold 16px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(idStr, centerX, centerY + 1);
  }

  // Corners
  drawCorner(ctx, borderInset + 2, borderInset + 2, colors, 1.5, 0); // Top Left
  drawCorner(ctx, CARD_WIDTH - borderInset - 2, borderInset + 2, colors, 1.5, Math.PI / 2); // Top Right
  drawCorner(ctx, CARD_WIDTH - borderInset - 2, CARD_HEIGHT - borderInset - 2, colors, 1.5, Math.PI); // Bottom Right
  drawCorner(ctx, borderInset + 2, CARD_HEIGHT - borderInset - 2, colors, 1.5, -Math.PI / 2); // Bottom Left

  // 4. Draw Corner Label (Ribbon)
  const ribbonText = template === 'ows' ? "ONE WORD" : "IDIOMS";
  drawCornerLabel(ctx, ribbonText, colors, template);

  // 5. Content Layout
  let currentY = 120;
  const BOX_GAP = 24;

  // -- MAIN HEADING (Idiom or Word) --
  ctx.fillStyle = colors.ink;
  ctx.font = FONTS.heading;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow for depth
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillText(data.idiom, CARD_WIDTH / 2 + 2, currentY + 2);
  ctx.restore();

  ctx.fillText(data.idiom, CARD_WIDTH / 2, currentY);

  currentY += 50;

  // -- PART OF SPEECH (OWS Only) --
  if (template === 'ows' && data.partOfSpeech) {
    ctx.font = FONTS.pos;
    ctx.fillStyle = colors.accent;
    ctx.fillText(data.partOfSpeech, CARD_WIDTH / 2, currentY);
    currentY += 50;
  } else {
    currentY += 10;
  }

  drawDivider(ctx, CARD_WIDTH / 2 - 200, currentY, 400, colors);
  currentY += 40; // Margin after divider

  // Labels based on template
  const labels = {
    mnemonic: template === 'ows' ? "NOTE" : "MNEMONIC",
    etymology: template === 'ows' ? "ORIGIN" : "ETYMOLOGY",
  };

  // LAYOUT BRANCHING
  if (isPortrait) {
    // === PORTRAIT LAYOUT (Stacked) ===
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const startX = PADDING;

    // -- IMAGE (Centered, Top) --
    if (data.image) {
       const img = new Image();
       img.src = data.image;
       await new Promise<void>((resolve) => {
         if (img.complete) {
            resolve();
         } else {
             img.onload = () => resolve();
             img.onerror = () => resolve();
         }
       });

       if (img.width > 0) {
           const maxImgHeight = 350;
           const maxImgWidth = CONTENT_WIDTH;
           const scale = Math.min(maxImgWidth / img.width, maxImgHeight / img.height);
           const w = img.width * scale;
           const h = img.height * scale;
           const imgX = (CARD_WIDTH - w) / 2;

           ctx.save();
           ctx.lineWidth = 1;
           ctx.strokeStyle = colors.ink;
           ctx.strokeRect(imgX - 5, currentY - 5, w + 10, h + 10);

           ctx.beginPath();
           ctx.rect(imgX, currentY, w, h);
           ctx.clip();
           ctx.drawImage(img, imgX, currentY, w, h);
           ctx.restore();

           currentY += h + 40;
       }
    }

    // -- Meaning Eng --
    currentY += drawSectionBox(ctx, startX, currentY, CONTENT_WIDTH, "MEANING", data.meaningEng, colors) + BOX_GAP;

    // -- Meaning Hindi --
    if (data.meaningHindi) {
       currentY += drawSectionBox(ctx, startX, currentY, CONTENT_WIDTH, "IN HINDI", data.meaningHindi, colors, { isHindi: true }) + BOX_GAP;
    }

    // -- Usage --
    if (data.usage) {
       currentY += drawSectionBox(ctx, startX, currentY, CONTENT_WIDTH, "USAGE", data.usage, colors, { isItalic: true }) + BOX_GAP;
    }

    // -- DIVIDER --
    currentY += 10;
    drawDivider(ctx, CARD_WIDTH / 2 - 100, currentY, 200, colors);
    currentY += 40;

    // -- Etymology --
    if (data.etymology) {
       currentY += drawSectionBox(ctx, startX, currentY, CONTENT_WIDTH, labels.etymology, data.etymology, colors) + BOX_GAP;
    }

    // -- Mnemonic / Note --
    if (data.mnemonic) {
       currentY += drawSectionBox(ctx, startX, currentY, CONTENT_WIDTH, labels.mnemonic, data.mnemonic, colors) + BOX_GAP;
    }

  } else {
    // === LANDSCAPE LAYOUT (Two Columns) ===
    const hasImage = !!data.image;
    const colGap = 40;

    // Calculate column widths
    let leftColWidth = hasImage ? (CONTENT_WIDTH * 0.60) : CONTENT_WIDTH;
    let rightColWidth = hasImage ? (CONTENT_WIDTH - leftColWidth - colGap) : 0;
    let startX = PADDING;

    let leftColY = currentY;

    // -- IMAGE RENDERING (Right Column) --
    if (hasImage && data.image) {
      const img = new Image();
      img.src = data.image;
      await new Promise<void>((resolve) => {
        if (img.complete) {
            resolve();
        } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
        }
      });

      if (img.width > 0) {
          const imgX = PADDING + leftColWidth + colGap;
          // Align top with text
          const imgY = leftColY;

          const maxImgHeight = 300;
          const scale = Math.min(rightColWidth / img.width, maxImgHeight / img.height);
          const w = img.width * scale;
          const h = img.height * scale;

          ctx.save();
          ctx.lineWidth = 1;
          ctx.strokeStyle = colors.ink;
          ctx.strokeRect(imgX - 5, imgY - 5, w + 10, h + 10);

          ctx.beginPath();
          ctx.rect(imgX, imgY, w, h);
          ctx.clip();
          ctx.drawImage(img, imgX, imgY, w, h);
          ctx.restore();
      }
    }

    // -- Left Column Boxes --
    leftColY += drawSectionBox(ctx, startX, leftColY, leftColWidth, "MEANING", data.meaningEng, colors) + BOX_GAP;

    if (data.meaningHindi) {
       leftColY += drawSectionBox(ctx, startX, leftColY, leftColWidth, "IN HINDI", data.meaningHindi, colors, { isHindi: true }) + BOX_GAP;
    }

    if (data.usage) {
       leftColY += drawSectionBox(ctx, startX, leftColY, leftColWidth, "USAGE", data.usage, colors, { isItalic: true }) + BOX_GAP;
    }

    // Determine where Bottom Section starts
    let bottomSectionStart = Math.max(leftColY + 10, 560);

    // Draw Divider
    drawDivider(ctx, CARD_WIDTH / 2 - 100, bottomSectionStart, 200, colors);

    let bottomContentY = bottomSectionStart + 40;
    const bottomColWidth = (CONTENT_WIDTH / 2) - (BOX_GAP / 2);

    // -- Etymology (Bottom Left) --
    if (data.etymology) {
       drawSectionBox(ctx, PADDING, bottomContentY, bottomColWidth, labels.etymology, data.etymology, colors);
    }

    // -- Mnemonic / Note (Bottom Right) --
    if (data.mnemonic) {
       drawSectionBox(ctx, PADDING + bottomColWidth + BOX_GAP, bottomContentY, bottomColWidth, labels.mnemonic, data.mnemonic, colors);
    }
  }
}