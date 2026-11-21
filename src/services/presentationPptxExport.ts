import PptxGenJS from 'pptxgenjs';
import {
  PORTAL_PRESENTATION_SLIDES,
  type PortalPresentationSlide,
  type SlideHighlightCard,
} from '../data/portalPresentationSlides';

export interface PresentationExportOptions {
  teamName?: string;
  totalTeams?: number;
  generatedDate?: string;
  fileName?: string;
}

const ACCENT_HEX: Record<SlideHighlightCard['accent'], string> = {
  cyan: '22D3EE',
  amber: 'F59E0B',
  emerald: '34D399',
  indigo: '818CF8',
  rose: 'FB7185',
  purple: 'C084FC',
};

const BG_DARK = '030712';
const CARD_BG = '0F172A';
const CARD_BORDER = '1E293B';
const TEXT_WHITE = 'F8FAFC';
const TEXT_LIGHT = 'CBD5E1';
const TEXT_MUTED = '94A3B8';
const CYAN = '22D3EE';

const SLIDE_W = 13.333;
const MARGIN_X = 0.55;
const CONTENT_W = SLIDE_W - MARGIN_X * 2; // 12.233"
const BODY_START_Y = 1.48;
const BODY_END_Y = 6.86;
const BODY_MAX_H = BODY_END_Y - BODY_START_Y; // 5.38"

function addSlideChrome(
  slide: PptxGenJS.Slide,
  data: PortalPresentationSlide,
  totalSlides: number,
  options?: PresentationExportOptions,
) {
  slide.background = { color: BG_DARK };

  // Top accent bar
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 0.06,
    fill: { color: CYAN },
    line: { color: CYAN, width: 0 },
  });

  // Header kicker & optional active team badge
  slide.addText(data.kicker, {
    x: MARGIN_X,
    y: 0.2,
    w: 9.0,
    h: 0.24,
    fontFace: 'Arial',
    fontSize: 9.5,
    bold: true,
    color: CYAN,
    charSpacing: 1.4,
    margin: 0,
  });

  if (options?.teamName && data.number === 1) {
    slide.addText(`Экипаж: ${options.teamName}`, {
      x: 9.65,
      y: 0.2,
      w: 3.13,
      h: 0.24,
      fontFace: 'Arial',
      fontSize: 9.5,
      bold: true,
      color: 'F59E0B',
      align: 'right',
      margin: 0,
    });
  }

  // Slide Title (fit: 'shrink' guarantees single-box containment)
  slide.addText(data.title, {
    x: MARGIN_X,
    y: 0.46,
    w: CONTENT_W,
    h: 0.44,
    fontFace: 'Arial',
    fontSize: data.layout === 'cover' ? 24 : 19.5,
    bold: true,
    color: TEXT_WHITE,
    valign: 'middle',
    fit: 'shrink',
    margin: 0,
  });

  // Subtitle
  slide.addText(data.subtitle, {
    x: MARGIN_X,
    y: 0.93,
    w: CONTENT_W,
    h: 0.44,
    fontFace: 'Arial',
    fontSize: 10.5,
    color: TEXT_LIGHT,
    valign: 'top',
    fit: 'shrink',
    margin: 0,
  });

  // Footer divider
  slide.addShape('line', {
    x: MARGIN_X,
    y: 6.96,
    w: CONTENT_W,
    h: 0,
    line: { color: CARD_BORDER, width: 1 },
  });

  // Footer note & slide counter
  slide.addText(data.footerNote, {
    x: MARGIN_X,
    y: 7.03,
    w: 10.8,
    h: 0.28,
    fontFace: 'Arial',
    fontSize: 9,
    color: TEXT_MUTED,
    valign: 'middle',
    fit: 'shrink',
    margin: 0,
  });

  slide.addText(`${data.number} / ${totalSlides}`, {
    x: 11.45,
    y: 7.03,
    w: 1.33,
    h: 0.28,
    fontFace: 'Arial',
    fontSize: 9.5,
    bold: true,
    color: CYAN,
    align: 'right',
    valign: 'middle',
    margin: 0,
  });
}

function renderCardsGrid(slide: PptxGenJS.Slide, cards: SlideHighlightCard[]) {
  const cols = 2;
  const rows = Math.ceil(cards.length / cols);
  const gapX = 0.26;
  const gapY = 0.2;
  const cardW = (CONTENT_W - gapX) / cols;
  const cardH = (BODY_MAX_H - gapY * (rows - 1)) / rows; // 2.59" for 2 rows

  cards.forEach((card, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = MARGIN_X + col * (cardW + gapX);
    const y = BODY_START_Y + row * (cardH + gapY);
    const accent = ACCENT_HEX[card.accent];

    slide.addShape('roundRect', {
      x,
      y,
      w: cardW,
      h: cardH,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1.1 },
    });

    // Left accent stripe
    slide.addShape('rect', {
      x: x + 0.03,
      y: y + 0.14,
      w: 0.055,
      h: cardH - 0.28,
      fill: { color: accent },
      line: { color: accent, width: 0 },
    });

    // Badge
    slide.addText(card.badge, {
      x: x + 0.2,
      y: y + 0.12,
      w: cardW - 0.34,
      h: 0.22,
      fontFace: 'Arial',
      fontSize: 8.5,
      bold: true,
      color: accent,
      margin: 0,
    });

    // Card title
    slide.addText(card.title, {
      x: x + 0.2,
      y: y + 0.34,
      w: cardW - 0.34,
      h: 0.3,
      fontFace: 'Arial',
      fontSize: 12.5,
      bold: true,
      color: TEXT_WHITE,
      fit: 'shrink',
      margin: 0,
    });

    // Bullet paragraphs without trailing '\n' (breakLine alone creates clean paragraphs)
    const itemCount = card.items.length;
    const itemFontSize = itemCount >= 5 ? 9.0 : 9.6;
    const bulletRuns: PptxGenJS.TextProps[] = card.items.map((item, i) => ({
      text: item,
      options: {
        fontFace: 'Arial',
        fontSize: itemFontSize,
        color: TEXT_LIGHT,
        breakLine: i < itemCount - 1,
        paraSpaceAfter: itemCount >= 5 ? 2 : 4,
      },
    }));

    slide.addText(bulletRuns, {
      x: x + 0.2,
      y: y + 0.68,
      w: cardW - 0.34,
      h: cardH - 0.8,
      valign: 'top',
      fit: 'shrink',
      margin: [2, 2, 2, 0],
    });
  });
}

function renderStepsList(
  slide: PptxGenJS.Slide,
  steps: NonNullable<PortalPresentationSlide['steps']>,
) {
  const count = steps.length;
  const gap = count >= 7 ? 0.09 : 0.13;
  const rowH = (BODY_MAX_H - gap * (count - 1)) / count;
  const isDense = count >= 7;

  steps.forEach((item, idx) => {
    const y = BODY_START_Y + idx * (rowH + gap);
    const isHighlight = item.step === '04' || item.step === 'Шаг 4';
    const badgeColor = isHighlight ? 'F59E0B' : CYAN;

    slide.addShape('roundRect', {
      x: MARGIN_X,
      y,
      w: CONTENT_W,
      h: rowH,
      rectRadius: 0.08,
      fill: { color: CARD_BG },
      line: { color: isHighlight ? 'F59E0B' : CARD_BORDER, width: 1.1 },
    });

    const pillH = Math.min(0.36, rowH - 0.14);
    const pillY = y + (rowH - pillH) / 2;

    slide.addShape('roundRect', {
      x: MARGIN_X + 0.14,
      y: pillY,
      w: 0.86,
      h: pillH,
      rectRadius: 0.06,
      fill: { color: '1E293B' },
      line: { color: badgeColor, width: 1 },
    });

    slide.addText(item.step, {
      x: MARGIN_X + 0.14,
      y: pillY,
      w: 0.86,
      h: pillH,
      fontFace: 'Arial',
      fontSize: isDense ? 9.5 : 10,
      bold: true,
      color: badgeColor,
      align: 'center',
      valign: 'middle',
      margin: 0,
    });

    slide.addText(item.title, {
      x: MARGIN_X + 1.14,
      y: y + 0.05,
      w: 3.35,
      h: rowH - 0.1,
      fontFace: 'Arial',
      fontSize: isDense ? 10 : 11,
      bold: true,
      color: TEXT_WHITE,
      valign: 'middle',
      fit: 'shrink',
      margin: [0, 4, 0, 0],
    });

    slide.addText(item.detail, {
      x: MARGIN_X + 4.58,
      y: y + 0.05,
      w: CONTENT_W - 4.72,
      h: rowH - 0.1,
      fontFace: 'Arial',
      fontSize: isDense ? 9.2 : 9.8,
      color: TEXT_LIGHT,
      valign: 'middle',
      fit: 'shrink',
      margin: [0, 4, 0, 0],
    });
  });
}

function getTableColumnWidths(slideId: string): number[] {
  if (slideId === 'slide-tasks-5stages') {
    return [1.05, 2.55, 4.78, 3.85];
  }
  if (slideId === 'slide-guide-jury') {
    return [2.7, 1.25, 4.48, 3.8];
  }
  return [2.1, 3.45, 3.35, 3.33];
}

function renderDataTable(slide: PptxGenJS.Slide, data: PortalPresentationSlide) {
  const headers = data.tableHeaders || [];
  const rows = data.tableRows || [];
  const colW = getTableColumnWidths(data.id);
  const headerH = 0.38;
  const maxBodyH = BODY_MAX_H - headerH - 0.08;
  const rowHVal = Number(Math.min(1.12, maxBodyH / Math.max(1, rows.length)).toFixed(2));
  const bodyFontSize = rows.length >= 5 ? 8.8 : 9.2;

  const tableData: PptxGenJS.TableRow[] = [
    headers.map((h) => ({
      text: h,
      options: {
        bold: true,
        fontSize: 9.5,
        fontFace: 'Arial',
        color: '030712',
        fill: { color: CYAN },
        valign: 'middle',
      },
    })),
    ...rows.map((row, rIdx) =>
      row.map((cell, cIdx) => ({
        text: cell,
        options: {
          bold: cIdx === 0,
          fontSize: bodyFontSize,
          fontFace: 'Arial',
          color: cIdx === 0 ? CYAN : TEXT_LIGHT,
          fill: { color: rIdx % 2 === 0 ? CARD_BG : '111C33' },
          valign: 'middle',
        },
      })),
    ),
  ];

  slide.addTable(tableData, {
    x: MARGIN_X,
    y: BODY_START_Y,
    w: CONTENT_W,
    colW,
    border: { type: 'solid', pt: 0.75, color: CARD_BORDER },
    rowH: [headerH, ...rows.map(() => rowHVal)],
    margin: [3, 5, 3, 5],
    autoPage: false,
  });
}

export function buildPortalPresentationPptx(options?: PresentationExportOptions): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'КОСМОПОРТ (Kube)';
  pptx.company = 'Всероссийский кейс-чемпионат «Космос-просто»';
  pptx.subject = 'Функционал портала, задачи и руководства по ролям';
  pptx.title = 'Презентация портала КОСМОПОРТ (.PPTX)';

  const totalSlides = PORTAL_PRESENTATION_SLIDES.length;

  for (const slideData of PORTAL_PRESENTATION_SLIDES) {
    const slide = pptx.addSlide();
    addSlideChrome(slide, slideData, totalSlides, options);

    if ((slideData.layout === 'cover' || slideData.layout === 'cards') && slideData.cards) {
      renderCardsGrid(slide, slideData.cards);
    } else if (
      (slideData.layout === 'stages' || slideData.layout === 'guide') &&
      slideData.steps
    ) {
      renderStepsList(slide, slideData.steps);
    } else if (slideData.layout === 'table' && slideData.tableHeaders && slideData.tableRows) {
      renderDataTable(slide, slideData);
    }
  }

  return pptx;
}

export async function downloadPortalPresentationPptx(
  options?: PresentationExportOptions,
): Promise<string> {
  const pptx = buildPortalPresentationPptx(options);
  const fileName = options?.fileName || 'Cosmoport_Portal_Presentation.pptx';
  const blobData = (await pptx.write({ outputType: 'blob' })) as Blob;

  const url = URL.createObjectURL(blobData);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return fileName;
}
