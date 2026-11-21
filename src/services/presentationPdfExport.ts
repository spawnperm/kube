import { jsPDF } from 'jspdf';
import {
  PORTAL_PRESENTATION_SLIDES,
  type PortalPresentationSlide,
  type SlideHighlightCard,
} from '../data/portalPresentationSlides';
import type { PresentationExportOptions } from './presentationPptxExport';
import { registerCyrillicPdfFonts } from './pdfCyrillicFonts';

const PAGE_W = 338.67; // 16:9 (13.333 in in mm)
const PAGE_H = 190.5; // 16:9 (7.5 in in mm)
const MARGIN_X = 14;
const CONTENT_W = PAGE_W - MARGIN_X * 2; // 310.67 mm
const BODY_START_Y = 37.5;
const BODY_END_Y = 174;
const BODY_MAX_H = BODY_END_Y - BODY_START_Y; // 136.5 mm

const ACCENT_RGB: Record<SlideHighlightCard['accent'], [number, number, number]> = {
  cyan: [34, 211, 238],
  amber: [245, 158, 11],
  emerald: [52, 211, 153],
  indigo: [129, 140, 248],
  rose: [251, 113, 133],
  purple: [192, 132, 252],
};

const BG_DARK: [number, number, number] = [3, 7, 18];
const CARD_BG: [number, number, number] = [15, 23, 42];
const CARD_ALT_BG: [number, number, number] = [17, 28, 51];
const CARD_BORDER: [number, number, number] = [30, 41, 59];
const TEXT_WHITE: [number, number, number] = [248, 250, 252];
const TEXT_LIGHT: [number, number, number] = [203, 213, 225];
const TEXT_MUTED: [number, number, number] = [148, 163, 184];
const CYAN: [number, number, number] = [34, 211, 238];
const AMBER: [number, number, number] = [245, 158, 11];

function fitLinesToBox(
  doc: jsPDF,
  text: string,
  maxWidthMm: number,
  maxHeightMm: number,
  startFontPt: number,
  minFontPt = 7.5,
  fontStyle: 'normal' | 'bold' = 'normal',
): { fontSize: number; lines: string[]; lineHeightMm: number } {
  doc.setFont('DejaVuSans', fontStyle);
  let pt = startFontPt;
  while (pt >= minFontPt) {
    doc.setFontSize(pt);
    const lines = doc.splitTextToSize(text, maxWidthMm) as string[];
    const lineHeightMm = pt * 0.3527 * 1.32;
    if (lines.length * lineHeightMm <= maxHeightMm) {
      return { fontSize: pt, lines, lineHeightMm };
    }
    pt -= 0.5;
  }
  doc.setFontSize(minFontPt);
  const lines = doc.splitTextToSize(text, maxWidthMm) as string[];
  return { fontSize: minFontPt, lines, lineHeightMm: minFontPt * 0.3527 * 1.32 };
}

function drawSlideChrome(
  doc: jsPDF,
  data: PortalPresentationSlide,
  totalSlides: number,
  options?: PresentationExportOptions,
) {
  // Full dark background
  doc.setFillColor(...BG_DARK);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Top cyan accent line
  doc.setFillColor(...CYAN);
  doc.rect(0, 0, PAGE_W, 1.5, 'F');

  // Kicker
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...CYAN);
  doc.text(data.kicker, MARGIN_X, 9.5);

  if (options?.teamName && data.number === 1) {
    doc.setTextColor(...AMBER);
    doc.text(`Экипаж: ${options.teamName}`, PAGE_W - MARGIN_X, 9.5, { align: 'right' });
  }

  // Title (auto-fit single or compact 2 lines)
  const titleFit = fitLinesToBox(
    doc,
    data.title,
    CONTENT_W,
    13,
    data.layout === 'cover' ? 22 : 18.5,
    13,
    'bold',
  );
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(titleFit.fontSize);
  doc.setTextColor(...TEXT_WHITE);
  doc.text(titleFit.lines, MARGIN_X, 18);

  // Subtitle
  const subFit = fitLinesToBox(doc, data.subtitle, CONTENT_W, 11, 10, 8, 'normal');
  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(subFit.fontSize);
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(subFit.lines, MARGIN_X, 27);

  // Footer divider & footer text
  doc.setDrawColor(...CARD_BORDER);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, 177, PAGE_W - MARGIN_X, 177);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  const footerLines = doc.splitTextToSize(data.footerNote, CONTENT_W - 28) as string[];
  doc.text(footerLines[0] || '', MARGIN_X, 183.5);

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...CYAN);
  doc.text(`${data.number} / ${totalSlides}`, PAGE_W - MARGIN_X, 183.5, { align: 'right' });
}

function drawCardsGrid(doc: jsPDF, cards: SlideHighlightCard[]) {
  const cols = 2;
  const rows = Math.ceil(cards.length / cols);
  const gapX = 6.5;
  const gapY = 5.5;
  const cardW = (CONTENT_W - gapX) / cols;
  const cardH = (BODY_MAX_H - gapY * (rows - 1)) / rows;

  cards.forEach((card, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = MARGIN_X + col * (cardW + gapX);
    const y = BODY_START_Y + row * (cardH + gapY);
    const accent = ACCENT_RGB[card.accent];

    // Card surface
    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...CARD_BORDER);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'FD');

    // Left accent stripe
    doc.setFillColor(...accent);
    doc.rect(x + 0.8, y + 3.5, 1.4, cardH - 7, 'F');

    // Badge
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...accent);
    doc.text(card.badge, x + 5.5, y + 7.5);

    // Card Title
    const cTitleFit = fitLinesToBox(doc, card.title, cardW - 9, 8, 12, 9.5, 'bold');
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(cTitleFit.fontSize);
    doc.setTextColor(...TEXT_WHITE);
    doc.text(cTitleFit.lines, x + 5.5, y + 14);

    // Items fitted inside remaining card height
    const textStartY = y + 20.5;
    const availH = y + cardH - 3 - textStartY;
    const textMaxW = cardW - 9;

    let pt = card.items.length >= 5 ? 8.8 : 9.4;
    let computedLines: string[][] = [];
    let lineH = 4;
    let itemGap = 1.4;

    while (pt >= 7.5) {
      doc.setFont('DejaVuSans', 'normal');
      doc.setFontSize(pt);
      lineH = pt * 0.3527 * 1.32;
      itemGap = card.items.length >= 5 ? 0.9 : 1.6;
      computedLines = card.items.map((item) => doc.splitTextToSize(item, textMaxW) as string[]);
      const totalH =
        computedLines.reduce((acc, ls) => acc + ls.length * lineH, 0) +
        itemGap * Math.max(0, card.items.length - 1);
      if (totalH <= availH) break;
      pt -= 0.4;
    }

    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(pt);
    doc.setTextColor(...TEXT_LIGHT);

    let cursorY = textStartY;
    computedLines.forEach((lines) => {
      doc.text(lines, x + 5.5, cursorY);
      cursorY += lines.length * lineH + itemGap;
    });
  });
}

function drawStepsList(
  doc: jsPDF,
  steps: NonNullable<PortalPresentationSlide['steps']>,
) {
  const count = steps.length;
  const gap = count >= 7 ? 2.4 : 3.5;
  const rowH = (BODY_MAX_H - gap * (count - 1)) / count;
  const isDense = count >= 7;

  steps.forEach((item, idx) => {
    const y = BODY_START_Y + idx * (rowH + gap);
    const isHighlight = item.step === '04' || item.step === 'Шаг 4';
    const badgeColor = isHighlight ? AMBER : CYAN;

    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...(isHighlight ? AMBER : CARD_BORDER));
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN_X, y, CONTENT_W, rowH, 2, 2, 'FD');

    const pillW = 22;
    const pillH = Math.min(9, rowH - 3.5);
    const pillX = MARGIN_X + 3.5;
    const pillY = y + (rowH - pillH) / 2;

    doc.setFillColor(30, 41, 59);
    doc.setDrawColor(...badgeColor);
    doc.setLineWidth(0.35);
    doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'FD');

    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(isDense ? 9 : 9.5);
    doc.setTextColor(...badgeColor);
    doc.text(item.step, pillX + pillW / 2, pillY + pillH / 2 + 1.1, { align: 'center' });

    const titleX = MARGIN_X + 29;
    const titleW = 84;
    const titleFit = fitLinesToBox(
      doc,
      item.title,
      titleW,
      rowH - 3,
      isDense ? 9.8 : 10.8,
      8,
      'bold',
    );
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(titleFit.fontSize);
    doc.setTextColor(...TEXT_WHITE);
    const titleBlockH = titleFit.lines.length * titleFit.lineHeightMm;
    const titleBaselineY = y + (rowH - titleBlockH) / 2 + titleFit.lineHeightMm * 0.78;
    doc.text(titleFit.lines, titleX, titleBaselineY);

    const detailX = MARGIN_X + 116;
    const detailW = CONTENT_W - 120;
    const detailFit = fitLinesToBox(
      doc,
      item.detail,
      detailW,
      rowH - 3,
      isDense ? 9 : 9.5,
      7.5,
      'normal',
    );
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(detailFit.fontSize);
    doc.setTextColor(...TEXT_LIGHT);
    const detailBlockH = detailFit.lines.length * detailFit.lineHeightMm;
    const detailBaselineY = y + (rowH - detailBlockH) / 2 + detailFit.lineHeightMm * 0.78;
    doc.text(detailFit.lines, detailX, detailBaselineY);
  });
}

function getPdfTableWidths(slideId: string): number[] {
  if (slideId === 'slide-tasks-5stages') {
    return [26, 65, 122, 97.67];
  }
  if (slideId === 'slide-guide-jury') {
    return [68, 32, 114, 96.67];
  }
  return [53, 88, 85, 84.67];
}

function drawDataTable(doc: jsPDF, data: PortalPresentationSlide) {
  const headers = data.tableHeaders || [];
  const rows = data.tableRows || [];
  const colWidths = getPdfTableWidths(data.id);

  const headerH = 10;
  let y = BODY_START_Y;

  // Header row
  doc.setFillColor(...CYAN);
  doc.rect(MARGIN_X, y, CONTENT_W, headerH, 'F');
  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(3, 7, 18);

  let cx = MARGIN_X;
  headers.forEach((h, i) => {
    doc.text(h, cx + 2.5, y + 6.5);
    cx += colWidths[i] || 75;
  });

  y += headerH;

  const availTableBodyH = BODY_END_Y - y;
  const maxPerRow = availTableBodyH / Math.max(1, rows.length);

  // Measure uniform font size that fits all rows within maxPerRow
  let pt = rows.length >= 5 ? 8.6 : 9.0;
  let rowHeights: number[] = [];
  let wrappedMatrix: string[][][] = [];
  let lineH = 3.8;

  while (pt >= 7.2) {
    lineH = pt * 0.3527 * 1.32;
    wrappedMatrix = rows.map((row) =>
      row.map((cell, cIdx) => {
        doc.setFont('DejaVuSans', cIdx === 0 ? 'bold' : 'normal');
        doc.setFontSize(pt);
        return doc.splitTextToSize(cell, (colWidths[cIdx] || 75) - 5) as string[];
      }),
    );

    const neededHeights = wrappedMatrix.map((cells) => {
      const maxLines = Math.max(...cells.map((ls) => ls.length), 1);
      return Math.max(15, maxLines * lineH + 5);
    });

    const totalNeeded = neededHeights.reduce((a, b) => a + b, 0);
    if (totalNeeded <= availTableBodyH) {
      rowHeights = neededHeights.map((h) => Math.max(h, Math.min(maxPerRow, h + 2)));
      // Clamp total height if adding padding pushed slightly over
      const sumH = rowHeights.reduce((a, b) => a + b, 0);
      if (sumH > availTableBodyH) {
        rowHeights = neededHeights;
      }
      break;
    }
    pt -= 0.4;
  }

  if (rowHeights.length === 0) {
    rowHeights = rows.map(() => maxPerRow);
  }

  rows.forEach((row, rIdx) => {
    const rh = rowHeights[rIdx];
    const bg = rIdx % 2 === 0 ? CARD_BG : CARD_ALT_BG;
    doc.setFillColor(...bg);
    doc.setDrawColor(...CARD_BORDER);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN_X, y, CONTENT_W, rh, 'FD');

    let colX = MARGIN_X;
    row.forEach((_, cIdx) => {
      const w = colWidths[cIdx] || 75;
      if (cIdx > 0) {
        doc.setDrawColor(...CARD_BORDER);
        doc.line(colX, y, colX, y + rh);
      }

      const lines = wrappedMatrix[rIdx]?.[cIdx] || [];
      doc.setFont('DejaVuSans', cIdx === 0 ? 'bold' : 'normal');
      doc.setFontSize(pt);
      doc.setTextColor(...(cIdx === 0 ? CYAN : TEXT_LIGHT));

      const blockH = lines.length * lineH;
      const startTextY = y + (rh - blockH) / 2 + lineH * 0.78;
      doc.text(lines, colX + 2.5, startTextY);

      colX += w;
    });

    y += rh;
  });
}

export async function buildPortalPresentationPdf(
  options?: PresentationExportOptions,
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_W, PAGE_H],
  });

  await registerCyrillicPdfFonts(doc);

  doc.setProperties({
    title: 'Презентация портала КОСМОПОРТ (.PDF)',
    subject: 'Функционал портала, задачи и руководства по ролям',
    author: 'КОСМОПОРТ (Kube)',
    creator: 'КОСМОПОРТ ЦУП',
  });

  const totalSlides = PORTAL_PRESENTATION_SLIDES.length;

  PORTAL_PRESENTATION_SLIDES.forEach((slideData, idx) => {
    if (idx > 0) {
      doc.addPage([PAGE_W, PAGE_H], 'landscape');
    }

    drawSlideChrome(doc, slideData, totalSlides, options);

    if ((slideData.layout === 'cover' || slideData.layout === 'cards') && slideData.cards) {
      drawCardsGrid(doc, slideData.cards);
    } else if (
      (slideData.layout === 'stages' || slideData.layout === 'guide') &&
      slideData.steps
    ) {
      drawStepsList(doc, slideData.steps);
    } else if (slideData.layout === 'table' && slideData.tableHeaders && slideData.tableRows) {
      drawDataTable(doc, slideData);
    }
  });

  return doc;
}

export async function downloadPortalPresentationPdf(
  options?: PresentationExportOptions,
): Promise<string> {
  const doc = await buildPortalPresentationPdf(options);
  const fileName = options?.fileName || 'Cosmoport_Portal_Presentation.pdf';
  const blob = doc.output('blob');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return fileName;
}
