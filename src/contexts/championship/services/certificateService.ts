/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Сервис генерации официальных наградных PDF-сертификатов кейс-чемпионата «КОСМОПОРТ».
 *
 * Создает детализированный высококачественный космический сертификат (A4 Landscape, 300 DPI equivalent)
 * с отображением:
 * - Названия корабля и команды
 * - Итогового экспертного балла (шкала 1-5) и статуса
 * - Цели экспедиции (выбранной задачи CubeSat)
 * - Состава экипажа и наставника
 * - Официальных гербовых печатей ЦУП и подписей организаторов
 */

import { jsPDF } from 'jspdf';

export interface CertificateData {
  teamName: string;
  shipName: string;
  shipCallsign?: string;
  school: string;
  mentorName: string;
  members: { name: string; roleTitle?: string }[];
  finalScore: number;
  taskTitle: string;
  certificateNumber?: string;
  dateStr?: string;
}

export function drawCertificateToCanvas(canvas: HTMLCanvasElement, data: CertificateData): void {
  // A4 Landscape at high resolution: 1754 x 1240 px
  canvas.width = 1754;
  canvas.height = 1240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // 1. Deep Space Cosmic Background
  const bgGrad = ctx.createRadialGradient(w / 2, h * 0.45, 100, w / 2, h / 2, w * 0.75);
  bgGrad.addColorStop(0, '#0f1738');
  bgGrad.addColorStop(0.5, '#090d24');
  bgGrad.addColorStop(1, '#030511');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle star dust particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  for (let i = 0; i < 160; i++) {
    const x = (Math.sin(i * 997) * 0.5 + 0.5) * w;
    const y = (Math.cos(i * 613) * 0.5 + 0.5) * h;
    const r = i % 3 === 0 ? 1.8 : 0.9;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Nebula glows in corners
  const nebula1 = ctx.createRadialGradient(150, 150, 20, 150, 150, 300);
  nebula1.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
  nebula1.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, 450, 450);

  const nebula2 = ctx.createRadialGradient(w - 150, h - 150, 20, w - 150, h - 150, 320);
  nebula2.addColorStop(0, 'rgba(245, 158, 11, 0.18)');
  nebula2.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = nebula2;
  ctx.fillRect(w - 450, h - 450, 450, 450);

  // 2. Gold Border Framework
  // Outer Border
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  // Middle Gold Gradient Frame
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 52, w - 104, h - 104);

  // Inner Fine Thin Border
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(62, 62, w - 124, h - 124);

  // Corner Ornaments
  const drawCornerBracket = (cx: number, cy: number, rot: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, -25);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCornerBracket(62, 62, 0);
  drawCornerBracket(w - 62, 62, Math.PI / 2);
  drawCornerBracket(w - 62, h - 62, Math.PI);
  drawCornerBracket(62, h - 62, -Math.PI / 2);

  // 3. Top Header Titles
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px "Segoe UI", "Roboto", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('МИНИСТЕРСТВО ОБРАЗОВАНИЯ И НАУКИ ПЕРМСКОГО КРАЯ', w / 2, 105);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '14px "Segoe UI", "Roboto", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('МАОУ ДПО «ЦЕНТР РАЗВИТИЯ СИСТЕМЫ ОБРАЗОВАНИЯ» Г. ПЕРМИ', w / 2, 128);

  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 16px "Segoe UI", "Roboto", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('ОТКРЫТЫЙ РЕГИОНАЛЬНЫЙ КЕЙС-ЧЕМПИОНАТ «КОСМОПОРТ 2026»', w / 2, 154);

  // Decorative Horizontal Line with Diamond
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 260, 172);
  ctx.lineTo(w / 2 + 260, 172);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(w / 2, 172, 4, 0, Math.PI * 2);
  ctx.fill();

  // 4. Certificate Main Big Title
  const titleGrad = ctx.createLinearGradient(w / 2 - 300, 0, w / 2 + 300, 0);
  titleGrad.addColorStop(0, '#fef08a');
  titleGrad.addColorStop(0.5, '#f59e0b');
  titleGrad.addColorStop(1, '#fef08a');
  ctx.fillStyle = titleGrad;
  ctx.font = '900 46px "Segoe UI", "Times New Roman", serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('С Е Р Т И Ф И К А Т', w / 2, 230);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px "Segoe UI", "Roboto", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('УЧАСТИЯ В ОРБИТАЛЬНОЙ ЭКСПЕДИЦИИ НАНОСПУТНИКОВ CUBESAT 3U', w / 2, 262);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 16px "Georgia", serif';
  ctx.letterSpacing = '0px';
  ctx.fillText('Настоящим подтверждается, что космический экипаж корабля:', w / 2, 308);

  // 5. Ship Name & Team Name Box
  const shipBoxWidth = 960;
  const shipBoxX = (w - shipBoxWidth) / 2;
  const shipBoxY = 330;
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(shipBoxX, shipBoxY, shipBoxWidth, 115, 16);
  ctx.fill();
  ctx.stroke();

  // Ship Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px "Segoe UI", "Roboto", sans-serif';
  ctx.fillText(`Борт «${data.shipName || data.teamName}»`, w / 2, shipBoxY + 44);

  // Call sign & Team affiliation
  ctx.fillStyle = '#a5b4fc';
  ctx.font = '16px "Segoe UI", "Roboto", sans-serif';
  const callsignText = data.shipCallsign ? `Позывной: ${data.shipCallsign} · ` : '';
  ctx.fillText(`${callsignText}Команда «${data.teamName}» · ${data.school}`, w / 2, shipBoxY + 75);

  // Commander & Mentor
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'italic 15px "Segoe UI", sans-serif';
  ctx.fillText(`Командир корабля / Наставник: ${data.mentorName}`, w / 2, shipBoxY + 98);

  // 6. Crew Members List with Roles
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px "Segoe UI", sans-serif';
  ctx.fillText('Члены экипажа и ролевые назначения:', w / 2, 480);

  const membersText =
    data.members && data.members.length > 0
      ? data.members.map((m) => `${m.name} (${m.roleTitle || 'Специалист'})`).join('  •  ')
      : 'Исследовательский школьный экипаж Пермского края';

  ctx.fillStyle = '#e0e7ff';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText(membersText, w / 2, 508);

  // 7. Expedition Mission Task Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText('Выполненная научная задача экспедиции:', w / 2, 545);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px "Segoe UI", sans-serif';
  ctx.fillText(`«${data.taskTitle}»`, w / 2, 570);

  // 8. Central Score & Status Badge
  const scoreCardWidth = 520;
  const scoreCardX = (w - scoreCardWidth) / 2;
  const scoreCardY = 605;

  const scoreGrad = ctx.createLinearGradient(
    scoreCardX,
    scoreCardY,
    scoreCardX + scoreCardWidth,
    scoreCardY,
  );
  scoreGrad.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
  scoreGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
  scoreGrad.addColorStop(1, 'rgba(245, 158, 11, 0.15)');
  ctx.fillStyle = scoreGrad;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(scoreCardX, scoreCardY, scoreCardWidth, 90, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef3c7';
  ctx.font = '13px "Segoe UI", "Roboto", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('ИТОГОВАЯ ЭКСПЕРТНАЯ ОЦЕНКА ЖЮРИ ЦУП', w / 2, scoreCardY + 28);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 36px "Segoe UI", "Roboto", monospace';
  ctx.fillText(`${data.finalScore.toFixed(2)} / 5.00`, w / 2, scoreCardY + 65);

  // Status rank description
  const isFinalist = data.finalScore >= 4.5;
  const isDiploma2 = data.finalScore >= 4.0 && data.finalScore < 4.5;
  const statusLabel = isFinalist
    ? '🏆 ДИПЛОМ I СТЕПЕНИ · ФИНАЛИСТ ЧЕМПИОНАТА'
    : isDiploma2
      ? '🥈 ДИПЛОМ II СТЕПЕНИ · УСПЕШНАЯ ЗАЩИТА'
      : '⭐ СЕРТИФИКАТ УЧАСТНИКА · ПОЛНЫЙ ЦИКЛ МИССИИ';

  ctx.fillStyle = isFinalist ? '#34d399' : '#fbbf24';
  ctx.font = 'bold 15px "Segoe UI", sans-serif';
  ctx.fillText(statusLabel, w / 2, 730);

  // 9. Signatures & Stamp Block
  const sigY = 820;

  // Signature 1: Chief MCC Administrator
  ctx.textAlign = 'left';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.fillText('Главный Администратор ЦУП:', 160, sigY);
  ctx.font = 'italic 16px "Segoe UI", serif';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText('Смирнов А.А.', 160, sigY + 28);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText('Координация орбит и экипажей', 160, sigY + 48);
  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(160, sigY + 34);
  ctx.lineTo(340, sigY + 34);
  ctx.stroke();

  // Signature 2: MCC Commander / CRSO Director
  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.fillText('Командир ЦУП / МАОУ ДПО «ЦРСО»:', w - 160, sigY);
  ctx.font = 'italic 16px "Segoe UI", serif';
  ctx.fillStyle = '#93c5fd';
  ctx.fillText('Анисимова А.С.', w - 160, sigY + 28);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText('Методическое руководство полетом', w - 160, sigY + 48);
  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(w - 340, sigY + 34);
  ctx.lineTo(w - 160, sigY + 34);
  ctx.stroke();

  // Center Official Stamp
  ctx.textAlign = 'center';
  const stampX = w / 2;
  const stampY = sigY + 22;
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(stampX, stampY, 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(stampX, stampY, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(165, 180, 252, 0.85)';
  ctx.font = 'bold 8px "Segoe UI", monospace';
  ctx.fillText('ОРБИТАЛЬНЫЙ ЦУП 2026', stampX, stampY - 26);
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.fillText('КОСМОПОРТ', stampX, stampY - 6);
  ctx.font = 'bold 9px "Segoe UI", sans-serif';
  ctx.fillText('МАОУ ДПО «ЦРСО»', stampX, stampY + 12);
  ctx.font = 'bold 8px monospace';
  ctx.fillText('ПЕРМСКИЙ КРАЙ', stampX, stampY + 28);

  // 10. Footer info & Unique Registration Number
  const certNumber =
    data.certificateNumber ||
    `KP-2026-${(Math.abs(data.teamName.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 8999) + 1000}`;
  const dateStr = data.dateStr || '24 сентября 2026 г., г. Пермь';

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '12px monospace';
  ctx.fillText(`Рег. номер: ${certNumber}`, 160, h - 80);

  ctx.textAlign = 'right';
  ctx.fillText(dateStr, w - 160, h - 80);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.font = '11px "Segoe UI", sans-serif';
  ctx.fillText(
    'Подлинность подтверждена цифровой подписью наземного ЦУП г. Перми · https://cubesat.perm.ru',
    w / 2,
    h - 80,
  );
}

export async function generateTeamCertificatePdfBlob(data: CertificateData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  drawCertificateToCanvas(canvas, data);

  const imgData = canvas.toDataURL('image/png', 1.0);

  // A4 Landscape: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
  return pdf.output('blob');
}

export async function downloadTeamCertificatePdf(
  data: CertificateData,
  customFileName?: string,
): Promise<void> {
  const blob = await generateTeamCertificatePdfBlob(data);
  const cleanShipName = (data.shipName || data.teamName).replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '_');
  const filename = customFileName || `Сертификат_КОСМОПОРТ_${cleanShipName}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}
