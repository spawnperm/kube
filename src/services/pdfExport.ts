import type { Team, Submission } from '../types';
import { CASE_STAGES } from '../data/mockData';

export async function generateTeamProgressPdf(
  team: Team,
  submissions: Submission[],
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Background header band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Title
  doc.setTextColor(56, 189, 248); // sky-400
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CASE-CHAMPIONSHIP "KOSMOS-PROSTO" | ORBITAL CUBESAT LAUNCH', 15, y);

  y += 7;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`MISSION READINESS REPORT: ${team.name.toUpperCase()}`, 15, y);

  y += 6;
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${team.school} (${team.city}) | League: ${team.league}`, 15, y);

  y = 52;
  // Summary Grid Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, y, pageWidth - 30, 32, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KEY MISSION INDICATORS', 20, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Score: ${team.totalScore} / 500 pts`, 20, y + 16);
  doc.text(`Current Rank: #${team.rank} in League`, 20, y + 23);
  doc.text(`Launch Readiness: ${team.launchReadinessPercent}%`, 80, y + 16);
  doc.text(
    `CubeSat Format: ${team.cubesatSpecs.format} (${team.cubesatSpecs.massKg} kg)`,
    80,
    y + 23,
  );
  doc.text(
    `Orbit: ${team.cubesatSpecs.orbitAltitudeKm} km, inc ${team.cubesatSpecs.inclinationDeg} deg`,
    140,
    y + 16,
  );
  doc.text(`Radio Beacon: ${team.cubesatSpecs.radioFreqMhz} MHz`, 140, y + 23);

  y += 42;
  // Section: Stages Progress
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('CASE STAGES BREAKDOWN & SCORES', 15, y);

  y += 6;
  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('#', 18, y + 5.5);
  doc.text('Stage Title', 26, y + 5.5);
  doc.text('Status', 120, y + 5.5);
  doc.text('Score', 165, y + 5.5);

  y += 8;
  CASE_STAGES.forEach((stage, idx) => {
    const status = team.stageStatuses[stage.id];
    const score = team.stageScores[stage.id] || 0;

    // row background alternating
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, pageWidth - 30, 8, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${stage.number}`, 18, y + 5.5);

    // Shorten title if needed
    const shortTitle = stage.title.length > 55 ? stage.title.substring(0, 52) + '...' : stage.title;
    doc.text(shortTitle, 26, y + 5.5);

    const statusLabel =
      status === 'approved'
        ? 'APPROVED'
        : status === 'submitted'
          ? 'SUBMITTED'
          : status === 'under_review'
            ? 'UNDER REVIEW'
            : status === 'needs_revision'
              ? 'REVISION REQ.'
              : 'IN PROGRESS';

    doc.setTextColor(
      status === 'approved' ? 16 : 100,
      status === 'approved' ? 149 : 116,
      status === 'approved' ? 193 : 139,
    );
    doc.setFont('helvetica', 'bold');
    doc.text(statusLabel, 120, y + 5.5);

    doc.setTextColor(15, 23, 42);
    doc.text(`${score} / 100`, 165, y + 5.5);

    y += 8;
  });

  y += 6;
  // Jury Reviews Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('EXPERT JURY EVALUATION SUMMARY', 15, y);

  y += 6;
  const approvedSubs = submissions.filter((s) => s.juryFeedback);
  if (approvedSubs.length > 0) {
    approvedSubs.forEach((sub) => {
      if (y > 245) {
        doc.addPage();
        y = 20;
      }
      const fb = sub.juryFeedback!;
      const stage = CASE_STAGES.find((s) => s.id === sub.stageId);

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, y, pageWidth - 30, 24, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Stage ${stage?.number}: ${stage?.title} (Score: ${fb.totalScore}/100)`, 19, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Reviewer: ${fb.juryName} - ${fb.juryTitle}`, 19, y + 11);

      const commentSnippet =
        fb.comment.length > 110 ? fb.comment.substring(0, 107) + '...' : fb.comment;
      doc.text(`Feedback: "${commentSnippet}"`, 19, y + 17);

      y += 28;
    });
  }

  // Team roster & Mentor
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DEVELOPMENT CREW & MENTORSHIP', 15, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Scientific Mentor: ${team.mentorName} (${team.mentorTitle})`, 18, y);
  y += 5;

  const membersStr = team.members.map((m) => `${m.name} (${m.role}, ${m.grade})`).join(' | ');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Crew: ${membersStr}`, 18, y);

  // Footer / Stamp
  y = 270;
  doc.setDrawColor(203, 213, 225);
  doc.line(15, y, pageWidth - 15, y);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  const dateStr = new Date().toLocaleDateString('ru-RU');
  doc.text(
    `Document verified by Kosmos-Prosto Scientific Committee | Generated: ${dateStr}`,
    15,
    y + 6,
  );
  doc.text(
    `CUBESAT-VERIFY-ID: ${team.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    15,
    y + 10,
  );
  doc.text('Official Flight Certification Protocol', pageWidth - 65, y + 8);

  doc.save(`${team.name}_Kosmos_Prosto_Mission_Report.pdf`);
}

export interface CertificateOptions {
  style: 'gold' | 'blue' | 'cyber';
  recipientType: 'team' | 'member';
  memberName?: string;
  memberRole?: string;
}

export async function generateDigitalCertificatePdf(
  team: Team,
  options: CertificateOptions = { style: 'gold', recipientType: 'team' },
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth(); // 297 mm
  const height = doc.internal.pageSize.getHeight(); // 210 mm

  // Background style
  if (options.style === 'cyber') {
    doc.setFillColor(3, 7, 18); // slate-950
    doc.rect(0, 0, width, height, 'F');
    // Inner border
    doc.setDrawColor(56, 189, 248); // sky-400
    doc.setLineWidth(1.5);
    doc.rect(10, 10, width - 20, height - 20);
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.5);
    doc.rect(13, 13, width - 26, height - 26);
  } else if (options.style === 'blue') {
    doc.setFillColor(240, 249, 255); // sky-50
    doc.rect(0, 0, width, height, 'F');
    doc.setDrawColor(2, 132, 199); // sky-600
    doc.setLineWidth(2);
    doc.rect(10, 10, width - 20, height - 20);
    doc.setDrawColor(186, 230, 253);
    doc.setLineWidth(1);
    doc.rect(13, 13, width - 26, height - 26);
  } else {
    // Gold Luxury style
    doc.setFillColor(254, 252, 232); // amber-50
    doc.rect(0, 0, width, height, 'F');
    doc.setDrawColor(217, 119, 6); // amber-600
    doc.setLineWidth(2.5);
    doc.rect(10, 10, width - 20, height - 20);
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.setLineWidth(0.8);
    doc.rect(13, 13, width - 26, height - 26);
  }

  // Corner decorative marks
  const isDark = options.style === 'cyber';
  doc.setDrawColor(isDark ? 56 : 217, isDark ? 189 : 119, isDark ? 248 : 6);
  doc.setLineWidth(1);
  const corners = [
    [10, 10],
    [width - 10, 10],
    [10, height - 10],
    [width - 10, height - 10],
  ];
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 4);
  });

  // Top Title Banner
  let y = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(isDark ? 56 : 180, isDark ? 189 : 83, isDark ? 248 : 9);
  doc.text('CASE-CHAMPIONSHIP "KOSMOS-PROSTO" | ORBITAL CUBESAT MISSION', width / 2, y, {
    align: 'center',
  });

  y += 12;
  doc.setFontSize(24);
  doc.setTextColor(isDark ? 255 : 15, isDark ? 255 : 23, isDark ? 255 : 42);
  doc.text('ORBITAL FLIGHT QUALIFICATION DIPLOMA', width / 2, y, { align: 'center' });

  y += 7;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
  doc.text('Official Space Mission Readiness Certificate', width / 2, y, { align: 'center' });

  y += 14;
  doc.setFontSize(12);
  doc.setTextColor(isDark ? 203 : 71, isDark ? 213 : 85, isDark ? 225 : 105);
  doc.text('PRESENTED TO:', width / 2, y, { align: 'center' });

  // Recipient Name
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(isDark ? 56 : 15, isDark ? 189 : 23, isDark ? 248 : 42);

  if (options.recipientType === 'member' && options.memberName) {
    doc.text(options.memberName.toUpperCase(), width / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
    doc.text(
      `Crew Member: ${options.memberRole || 'Specialist'} | Team «${team.name}»`,
      width / 2,
      y,
      { align: 'center' },
    );
  } else {
    doc.text(`TEAM «${team.name.toUpperCase()}»`, width / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
    doc.text(`${team.school} (${team.city}) | League: ${team.league}`, width / 2, y, {
      align: 'center',
    });
  }

  // Citation Paragraph
  y += 12;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(isDark ? 203 : 51, isDark ? 213 : 65, isDark ? 225 : 85);
  const citationText =
    `This certificate confirms that Team «${team.name}» has successfully completed the qualification stages of the Kosmos-Prosto case-championship, ` +
    `achieving a final score of ${team.totalScore} / 500 points and Final Rank #${team.rank} in the ${team.league}. ` +
    `With Keplerian orbital mechanics validated and 3U systems flight-ready, the satellite has been granted official orbital insertion clearance for Sun-Synchronous Orbit (SSO, h=${team.cubesatSpecs.orbitAltitudeKm} km) from Vostochny Cosmodrome.`;

  const splitCitation = doc.splitTextToSize(citationText, width - 60);
  doc.text(splitCitation, width / 2, y, { align: 'center' });

  // Technical Specs Strip
  y += 18;
  doc.setFillColor(isDark ? 15 : 255, isDark ? 23 : 255, isDark ? 42 : 255);
  doc.setDrawColor(isDark ? 51 : 203, isDark ? 65 : 213, isDark ? 85 : 225);
  doc.roundedRect(25, y, width - 50, 16, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isDark ? 56 : 14, isDark ? 189 : 116, isDark ? 248 : 144);
  doc.text(`CUBESAT: ${team.cubesatSpecs.format} (${team.cubesatSpecs.massKg} kg)`, 30, y + 10);
  doc.text(`SCORE: ${team.totalScore} / 500 PTS`, 92, y + 10);
  doc.text(`FINAL RANK: #${team.rank} IN LEAGUE`, 152, y + 10);
  doc.text(`BEACON: ${team.cubesatSpecs.radioFreqMhz} MHz`, 218, y + 10);

  // Signatures & Stamp
  y = height - 38;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isDark ? 255 : 15, isDark ? 255 : 23, isDark ? 255 : 42);
  doc.text('Prof. A.I. Melnikov, D.Phys-Math.Sc.', 45, y);
  doc.text(team.mentorName, width - 90, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(isDark ? 148 : 100, isDark ? 163 : 116, isDark ? 184 : 139);
  doc.text('Chairman of Scientific Jury Panel', 45, y);
  doc.text(`Academic Mentor (${team.mentorTitle.substring(0, 32)})`, width - 90, y);

  // Center Seal / Hash
  const certId = `CERT-KOSMOS-${team.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  doc.setTextColor(isDark ? 56 : 180, isDark ? 189 : 83, isDark ? 248 : 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('★ VERIFIED ORBITAL CLEARANCE SEAL ★', width / 2, height - 33, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(isDark ? 100 : 148, isDark ? 116 : 163, isDark ? 139 : 184);
  doc.text(`ID: ${certId} • Electronically Signed Protocol`, width / 2, height - 28, {
    align: 'center',
  });

  const filename =
    options.recipientType === 'member' && options.memberName
      ? `${team.name}_${options.memberName.replace(/\s+/g, '_')}_Flight_Certificate.pdf`
      : `${team.name}_Orbital_Flight_Qualification_Certificate.pdf`;

  doc.save(filename);
}
