import type { jsPDF } from 'jspdf';
import type { SpacePiApplication, SpacePiMissionCategory, Team } from '../types';
import { INITIAL_SPACE_PI_APPLICATIONS } from '../data/spacePiData';
import { registerCyrillicPdfFonts } from './pdfCyrillicFonts';

const CATEGORY_LABELS: Record<SpacePiMissionCategory, string> = {
  space_weather: 'Космическая погода, геофизика и радиация',
  remote_sensing: 'Дистанционное зондирование Земли (ДЗЗ)',
  astrophysics: 'Астрофизика и оптические телескопы',
  biology: 'Космическая биология и агрофизика',
  amateur_radio: 'Радиолюбительская связь и открытый маяк SSTV',
  iot_ais: 'Интернет вещей (IoT) и прием сигналов АИС',
  materials_propulsion: 'Испытание наноматериалов и микродвигателей',
};

const STATUS_LABELS: Record<SpacePiApplication['status'], string> = {
  draft: 'Черновик в разработке',
  ready_for_review: 'Готова к экспертизе',
  jury_approved: 'Одобрена жюри к подаче',
  submitted_to_spacepi: 'Подана на spacepi.space (Фонд-М)',
};

const SAMPLE_TEAM: Team = {
  id: 'team_orion_3',
  name: 'Орион-3',
  city: 'Пермь',
  school: 'МАОУ «Лицей №1» г. Перми',
  league: 'Высшая лига 10–11 класс',
  mentorName: 'Соколов Виктор Андреевич',
  mentorTitle: 'к.ф.-м.н., доцент ПГНИУ, научный руководитель кружка',
  avatarColor: 'cyan',
  currentStageId: 'stage_5',
  stageStatuses: {
    stage_1: 'approved',
    stage_2: 'approved',
    stage_3: 'approved',
    stage_4: 'approved',
    stage_5: 'approved',
  },
  stageScores: {
    stage_1: 98,
    stage_2: 96,
    stage_3: 97,
    stage_4: 95,
    stage_5: 94,
  },
  totalScore: 480,
  rank: 1,
  launchReadinessPercent: 98,
  cubesatSpecs: {
    format: '3U',
    massKg: 3.4,
    orbitAltitudeKm: 540,
    inclinationDeg: 97.6,
    powerBudgetWatts: 18.5,
    radioFreqMhz: 437.425,
    payloadType: 'Узкополосный SiPM-фотометр ночного свечения атмосферы (557.7 нм)',
  },
  members: [
    { id: 'm1', name: 'Артём Кузнецов', role: 'Капитан', grade: '11 кл.' },
    { id: 'm2', name: 'Елена Воронова', role: 'Баллистик', grade: '10 кл.' },
    { id: 'm3', name: 'Михаил Седых', role: 'Конструктор', grade: '11 кл.' },
    { id: 'm4', name: 'Иван Третьяков', role: 'Радиоинженер', grade: '10 кл.' },
    { id: 'm5', name: 'София Лебедева', role: 'Разработчик ПН', grade: '11 кл.' },
  ],
};

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function buildSpacePiApplicationPdf(
  app: SpacePiApplication,
  team: Team,
  options?: { isSample?: boolean },
): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  await registerCyrillicPdfFonts(doc);

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const marginX = 14;
  const contentW = pageWidth - marginX * 2; // 182 mm

  doc.setProperties({
    title: options?.isSample
      ? 'Пример заявки в Space-π (КубСат 3U)'
      : `Паспорт заявки Space-π — ${team.name}`,
    subject: 'Конкурс полезных нагрузок наноспутников CubeSat 3U Space-π',
    author: 'КОСМОПОРТ (ЦУП)',
  });

  const drawFooter = (pageNum: number) => {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      options?.isSample
        ? 'ОБРАЗЕЦ ЗАПОЛНЕНИЯ ЗАЯВКИ SPACE-π • Платформа «КОСМОПОРТ» • spacepi.space'
        : `Портал «КОСМОПОРТ» • Заявка в программу Space-π • Дата: ${new Date().toLocaleDateString('ru-RU')}`,
      marginX,
      pageHeight - 8.5,
    );
    doc.text(`Стр. ${pageNum}`, pageWidth - marginX, pageHeight - 8.5, { align: 'right' });
  };

  let pageNumber = 1;
  let y = 14;

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > pageHeight - 20) {
      drawFooter(pageNumber);
      doc.addPage();
      pageNumber += 1;
      y = 16;
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 42, 'F');
  doc.setFillColor(56, 189, 248);
  doc.rect(0, 0, pageWidth, 1.8, 'F');

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(56, 189, 248);
  doc.text(
    'НАУЧНО-ОБРАЗОВАТЕЛЬНАЯ ПРОГРАММА «SPACE-π» • ДЕЖУРНЫЙ ПО ПЛАНЕТЕ • SPACEPI.SPACE',
    marginX,
    12,
  );

  if (options?.isSample) {
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - marginX - 44, 7, 44, 6.5, 1.5, 1.5, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ПРИМЕР ЗАЯВКИ', pageWidth - marginX - 22, 11.4, { align: 'center' });
  }

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ПАСПОРТ ПРОЕКТНОЙ ЗАЯВКИ КУБСАТ 3U (SPACE-π)', marginX, 22);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Код заявки: ${app.spacePiRegistrationCode || 'ЧЕРНОВИК-2026'}  |  Статус: ${STATUS_LABELS[app.status]}`,
    marginX,
    30,
  );
  doc.text(
    `Готовность по регламенту Фонда-М: ${app.complianceScore}%  |  Платформа: ${app.platformFormat}`,
    marginX,
    36,
  );

  y = 49;

  // Section 1: Applicant & Mission Identification
  const idBlockH = 38;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, y, contentW, idBlockH, 2.5, 2.5, 'FD');

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. ИДЕНТИФИКАЦИЯ ЗАЯВИТЕЛЯ И КОСМИЧЕСКОГО АППАРАТА', marginX + 4, y + 6.5);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);
  doc.text(`Команда: «${team.name}» (${team.city})`, marginX + 4, y + 13);
  doc.text(`Организация: ${team.school}`, marginX + 4, y + 18.5);
  doc.text(`Имя спутника: ${app.satelliteName || `${team.name}-3U`}`, marginX + 4, y + 24);
  doc.text(
    `Направление: ${CATEGORY_LABELS[app.missionCategory] || app.missionCategory}`,
    marginX + 4,
    y + 29.5,
  );
  doc.text(`Куратор: ${app.mentorSummary || team.mentorName}`, marginX + 4, y + 35);

  y += idBlockH + 6;

  // Section 2: Technical Resource Budgets
  const specsH = 34;
  ensureSpace(specsH + 6);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, y, contentW, specsH, 2.5, 2.5, 'FD');

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. БЮДЖЕТЫ РЕСУРСОВ ПОЛЕЗНОЙ НАГРУЗКИ (ЛИМИТЫ CUBESAT 3U)', marginX + 4, y + 6.5);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);

  doc.text(`Масса ПН: ${app.payloadMassGrams} г (лимит ≤ 1200 г)`, marginX + 4, y + 13.5);
  doc.text(
    `Габариты ПН: ${app.payloadDimensionsMm.x} × ${app.payloadDimensionsMm.y} × ${app.payloadDimensionsMm.z} мм`,
    marginX + 4,
    y + 19.5,
  );
  doc.text(`Шина данных: ${app.dataInterface}  |  Питание: ${app.supplyVoltage}`, marginX + 4, y + 25.5);
  doc.text(
    `Экипаж: ${(app.teamMembersSummary || team.members.map((m) => m.name).join(', ')).slice(0, 72)}`,
    marginX + 4,
    y + 31,
  );

  const rightColX = marginX + 96;
  doc.text(
    `Мощность: ${app.powerConsumptionWatts.average} Вт ср. / ${app.powerConsumptionWatts.peak} Вт пик.`,
    rightColX,
    y + 13.5,
  );
  doc.text(`Трафик данных: ~${app.dailyDataVolumeMb} МБайт/сутки`, rightColX, y + 19.5);
  doc.text(`Радиоканал UHF: ${app.radioFrequencyMhz} МГц`, rightColX, y + 25.5);
  doc.text(
    `Сеть СОНИКС: ${app.soniksIntegration.enabled ? 'ДА' : 'НЕТ'} (${app.soniksIntegration.amateurCallsign || 'RS-серия'})`,
    rightColX,
    y + 31,
  );

  y += specsH + 7;

  // Helper for multi-line wrapped narrative sections
  const drawTextSection = (
    title: string,
    blocks: Array<{ label?: string; text: string; highlight?: boolean }>,
  ) => {
    ensureSpace(18);
    doc.setFont('DejaVuSans', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, marginX, y);
    y += 2;
    doc.setDrawColor(56, 189, 248);
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + 42, y);
    y += 4.5;

    for (const block of blocks) {
      const prefix = block.label ? `${block.label}: ` : '';
      doc.setFont('DejaVuSans', block.highlight ? 'bold' : 'normal');
      doc.setFontSize(block.highlight ? 9.5 : 8.3);
      if (block.highlight) {
        doc.setTextColor(2, 132, 199);
      } else {
        doc.setTextColor(51, 65, 85);
      }

      const lines = doc.splitTextToSize(`${prefix}${block.text || 'Не заполнено'}`, contentW) as string[];
      const lineH = block.highlight ? 4.6 : 4.0;
      ensureSpace(lines.length * lineH + 3);
      doc.text(lines, marginX, y);
      y += lines.length * lineH + 2.5;
    }

    y += 3;
  };

  drawTextSection('3. НАЗВАНИЕ ПРОЕКТА И НАУЧНЫЕ ЦЕЛИ МИССИИ', [
    { text: app.projectName, highlight: true },
    { label: 'Главная цель эксперимента', text: app.missionGoal },
  ]);

  drawTextSection('4. НАУЧНАЯ НОВИЗНА И ОПИСАНИЕ ПОЛЕЗНОЙ НАГРУЗКИ', [
    { label: 'Научно-техническая новизна', text: app.scientificNovelty },
    { label: 'Состав и архитектура прибора', text: app.payloadDescription },
  ]);

  drawTextSection('5. РАДИОЛИНИЯ «СОНИКС» (SONIK.SPACE) И ШКОЛЬНАЯ ПРОГРАММА', [
    {
      label: 'Формат открытого маяка',
      text: `${app.soniksIntegration.openBeaconDesc} (Протокол: ${app.soniksIntegration.telemetryFormat})`,
    },
    { label: 'Вовлечение школьников РФ', text: app.schoolInvolvementPlan },
  ]);

  if (app.juryNotes && app.juryNotes.length > 0) {
    drawTextSection(
      '6. ЗАКЛЮЧЕНИЕ И РЕКОМЕНДАЦИИ ЭКСПЕРТНОЙ КОМИССИИ',
      app.juryNotes.map((note, idx) => ({
        label: `Замечание ${idx + 1}`,
        text: note,
      })),
    );
  }

  // Final Compliance Checklist & Signatures Box
  const checkBoxH = 26;
  ensureSpace(checkBoxH + 8);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, y, contentW, checkBoxH, 2, 2, 'FD');

  doc.setFont('DejaVuSans', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ПРОВЕРКА КРИТЕРИЕВ ДОПУСКА ФОНДА СОДЕЙСТВИЯ ИННОВАЦИЯМ (SPACE-π)', marginX + 4, y + 6);

  doc.setFont('DejaVuSans', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text(
    `✓ Масса ≤ 1200 г (${app.payloadMassGrams} г)   ✓ Пик ≤ 15 Вт (${app.powerConsumptionWatts.peak} Вт)   ✓ Канал СОНИКС: ${app.soniksIntegration.enabled ? 'Открыт' : 'Требуется'}   ✓ Наставник подтверждён`,
    marginX + 4,
    y + 12.5,
  );

  doc.setTextColor(51, 65, 85);
  doc.text(
    `Капитан команды: ${team.members[0]?.name || team.name}    |    Научный руководитель: ${team.mentorName}`,
    marginX + 4,
    y + 19.5,
  );

  drawFooter(pageNumber);
  return doc;
}

export async function generateSpacePiPassportPdf(
  app: SpacePiApplication,
  team: Team,
  options?: { isSample?: boolean; fileName?: string },
): Promise<string> {
  const doc = await buildSpacePiApplicationPdf(app, team, options);
  const fileName =
    options?.fileName ||
    `SpacePi_Application_${team.name.replace(/\s+/g, '_')}_${app.spacePiRegistrationCode || '2026'}.pdf`;
  const blob = doc.output('blob');
  triggerBlobDownload(blob, fileName);
  return fileName;
}

export async function buildSpacePiSampleApplicationPdf(): Promise<jsPDF> {
  const sampleApp =
    INITIAL_SPACE_PI_APPLICATIONS.team_orion_3 ||
    Object.values(INITIAL_SPACE_PI_APPLICATIONS)[0];
  return buildSpacePiApplicationPdf(
    {
      ...sampleApp,
      complianceScore: 100,
    },
    SAMPLE_TEAM,
    { isSample: true },
  );
}

export async function downloadSpacePiSampleApplicationPdf(): Promise<string> {
  const doc = await buildSpacePiSampleApplicationPdf();
  const fileName = 'SpacePi_Sample_Application.pdf';
  const blob = doc.output('blob');
  triggerBlobDownload(blob, fileName);
  return fileName;
}
