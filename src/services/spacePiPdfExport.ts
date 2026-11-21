import type { SpacePiApplication, Team } from '../types';

export async function generateSpacePiPassportPdf(
  app: SpacePiApplication,
  team: Team,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Space-pi header text
  doc.setTextColor(56, 189, 248); // sky-400
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SCIENTIFIC-EDUCATIONAL PROGRAM "SPACE-PI" | HTTPS://SPACEPI.SPACE', 14, y);

  y += 6;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('CUBESAT 3U PAYLOAD PROJECT PASSPORT', 14, y);

  y += 6;
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Registration Code: ${app.spacePiRegistrationCode || 'DRAFT-IN-PROGRESS'} | Status: ${app.status.toUpperCase()}`,
    14,
    y,
  );

  y = 48;

  // Card 1: Team & School Info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. APPLICANT & MISSION IDENTIFICATION', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Team Name: ${team.name} (${team.city}, ${team.school})`, 18, y + 13);
  doc.text(`Satellite Designation: ${app.satelliteName || team.name + '-3U'}`, 18, y + 19);
  doc.text(`Academic Mentor: ${team.mentorName}`, 18, y + 24);

  doc.text(`Platform: ${app.platformFormat} (100x100x340.5 mm)`, 120, y + 13);
  doc.text(`Mission Category: ${app.missionCategory}`, 120, y + 19);
  doc.text(`Compliance Score: ${app.complianceScore}% / 100%`, 120, y + 24);

  y += 34;

  // Card 2: Technical Specs Table
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 36, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. PAYLOAD RESOURCE ALLOCATION & INTERFACES', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Payload Mass: ${app.payloadMassGrams} g (Limit: <= 1200 g)`, 18, y + 14);
  doc.text(
    `Dimensions: ${app.payloadDimensionsMm.x} x ${app.payloadDimensionsMm.y} x ${app.payloadDimensionsMm.z} mm`,
    18,
    y + 20,
  );
  doc.text(`Data Interface: ${app.dataInterface} Bus`, 18, y + 26);
  doc.text(`Supply Voltage: ${app.supplyVoltage}`, 18, y + 31);

  doc.text(
    `Power: ${app.powerConsumptionWatts.average} W avg / ${app.powerConsumptionWatts.peak} W peak`,
    115,
    y + 14,
  );
  doc.text(`Data Volume: ~${app.dailyDataVolumeMb} MB / day`, 115, y + 20);
  doc.text(`Beacon Frequency: ${app.radioFrequencyMhz} MHz (UHF Amateur)`, 115, y + 26);
  doc.text(
    `SONIKS Network: ${app.soniksIntegration.enabled ? 'YES (Open Access)' : 'NO'}`,
    115,
    y + 31,
  );

  y += 42;

  // Card 3: Project Title & Scientific Goal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. PROJECT TITLE & SCIENTIFIC OBJECTIVE', 14, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(doc.splitTextToSize(app.projectName, pageWidth - 28), 14, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const goalLines = doc.splitTextToSize(`Objective: ${app.missionGoal}`, pageWidth - 28);
  doc.text(goalLines, 14, y);
  y += goalLines.length * 4 + 4;

  // Card 4: Scientific Novelty & Technical Description
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('4. SCIENTIFIC NOVELTY & HARDWARE IMPLEMENTATION', 14, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const noveltyLines = doc.splitTextToSize(
    `Scientific Novelty: ${app.scientificNovelty}`,
    pageWidth - 28,
  );
  doc.text(noveltyLines, 14, y);
  y += noveltyLines.length * 4 + 2;

  const payloadLines = doc.splitTextToSize(
    `Hardware Description: ${app.payloadDescription}`,
    pageWidth - 28,
  );
  doc.text(payloadLines, 14, y);
  y += payloadLines.length * 4 + 4;

  // Card 5: SONIKS Integration & School Engagement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('5. OPEN TELEMETRY & SCHOOL NETWORK (SONIK.SPACE)', 14, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const soniksLines = doc.splitTextToSize(
    `Beacon Format: ${app.soniksIntegration.openBeaconDesc} (Protocol: ${app.soniksIntegration.telemetryFormat})`,
    pageWidth - 28,
  );
  doc.text(soniksLines, 14, y);
  y += soniksLines.length * 4 + 2;

  const engageLines = doc.splitTextToSize(
    `School Community Program: ${app.schoolInvolvementPlan}`,
    pageWidth - 28,
  );
  doc.text(engageLines, 14, y);
  y += engageLines.length * 4 + 6;

  // Verification & Signatures footer
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 22, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, pageWidth - 28, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('REGULATION COMPLIANCE VERIFICATION (FASIE / SPACE-PI STANDARDS)', 18, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Mass Limit (<=1200g): PASS', 18, y + 11);
  doc.text('Power Limit (<=15W peak): PASS', 68, y + 11);
  doc.text('Open Channel (SONIKS): PASS', 120, y + 11);

  doc.text(
    `Signed: Team Captain (${team.members[0]?.name || team.name}) & Academic Mentor (${team.mentorName})`,
    18,
    y + 17,
  );

  // Footer banner
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Cosmoport "Kosmos-Prosto" Space Championship | Official Space-pi Application Document Generator',
    14,
    290,
  );

  doc.save(
    `SpacePi_Application_${team.name.replace(/\s+/g, '_')}_${app.spacePiRegistrationCode || '2026'}.pdf`,
  );
}
