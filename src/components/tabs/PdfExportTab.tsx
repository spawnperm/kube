import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, Presentation } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Team, Submission } from '../../types';
import { CASE_STAGES } from '../../data/mockData';
import { generateTeamProgressPdf } from '../../services/pdfExport';
import { downloadPortalPresentationPptx } from '../../services/presentationPptxExport';
import { downloadPortalPresentationPdf } from '../../services/presentationPdfExport';

interface PdfExportTabProps {
  teams: Team[];
  activeTeam: Team;
  submissions: Submission[];
  onOpenPresentation?: () => void;
}

export const PdfExportTab: React.FC<PdfExportTabProps> = ({
  teams,
  activeTeam,
  submissions,
  onOpenPresentation,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(activeTeam.id);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [isExportingPresPdf, setIsExportingPresPdf] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [pptxDone, setPptxDone] = useState<string | null>(null);

  const team = teams.find((t) => t.id === selectedTeamId) || activeTeam;
  const teamSubmissions = submissions.filter((s) => s.teamId === team.id);

  const handleDownloadPdf = () => {
    setIsExporting(true);
    setTimeout(() => {
      void generateTeamProgressPdf(team, teamSubmissions);
      setIsExporting(false);
      setExportDone(true);

      // Trigger celebratory confetti
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => setExportDone(false), 4000);
    }, 400);
  };

  const handleDownloadPptx = async () => {
    setIsExportingPptx(true);
    try {
      const name = await downloadPortalPresentationPptx({
        teamName: team.name,
        totalTeams: teams.length,
        generatedDate: new Date().toLocaleDateString('ru-RU'),
      });
      setPptxDone(name);
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
      });
      setTimeout(() => setPptxDone(null), 4500);
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleDownloadPresPdf = async () => {
    setIsExportingPresPdf(true);
    try {
      const name = await downloadPortalPresentationPdf({
        teamName: team.name,
        totalTeams: teams.length,
        generatedDate: new Date().toLocaleDateString('ru-RU'),
      });
      setPptxDone(name);
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.6 },
      });
      setTimeout(() => setPptxDone(null), 4500);
    } finally {
      setIsExportingPresPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/90 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Экспорт отчетов о прогрессе в PDF</h1>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                OFFICIAL REPORT GENERATOR
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Генерация официального «Паспорта готовности миссии КубСат» для школьной администрации,
              наставников и оргкомитета запуска.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Формирование PDF...' : 'Скачать отчет в PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPptx}
            disabled={isExportingPptx || isExportingPresPdf}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Presentation className="h-4 w-4" />
            <span>{isExportingPptx ? 'Сборка PPTX...' : 'Презентация (.PPTX)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPresPdf}
            disabled={isExportingPptx || isExportingPresPdf}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>{isExportingPresPdf ? 'Сборка PDF...' : 'Презентация (.PDF)'}</span>
          </button>

          {onOpenPresentation && (
            <button
              type="button"
              onClick={onOpenPresentation}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:border-cyan-500/40 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              <Presentation className="h-3.5 w-3.5 text-cyan-400" />
              <span>Открыть слайды</span>
            </button>
          )}
        </div>
      </div>

      {pptxDone && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 text-amber-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            Презентация портала «{pptxDone}» (10 слайдов, 16:9) успешно сохранена на ваше
            устройство!
          </span>
        </div>
      )}

      {/* Select Team Dropdown */}
      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 font-medium">Команда для формирования отчета:</span>
        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-white focus:outline-none focus:border-cyan-500"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              «{t.name}» — {t.school} ({t.city})
            </option>
          ))}
        </select>
      </div>

      {exportDone && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Файл PDF «{team.name}_Kosmos_Prosto_Mission_Report.pdf» успешно сохранен на ваше
            устройство!
          </span>
        </div>
      )}

      {/* Visual Report Document Preview */}
      <div className="rounded-2xl border border-slate-700 bg-white text-slate-900 p-8 shadow-2xl max-w-4xl mx-auto space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <div className="text-[10px] font-bold text-sky-600 tracking-widest uppercase">
              Всероссийский кейс-чемпионат по физике «МИРОВИЗОР»
            </div>
            <h2 className="text-2xl font-black text-slate-950 mt-1">
              ПАСПОРТ ГОТОВНОСТИ МИССИИ КУБСАТ
            </h2>
            <div className="text-xs text-slate-600 mt-0.5">
              Команда: <strong>«{team.name}»</strong> • {team.school} ({team.city})
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block rounded border border-slate-300 bg-slate-50 px-2 py-1 text-[10px] font-mono text-slate-600">
              DOC-ID: KOSMOS-{team.id.toUpperCase().substring(0, 10)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Дата: {new Date().toLocaleDateString('ru-RU')}
            </div>
          </div>
        </div>

        {/* Key Mission Indicators Table */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Сумма баллов</div>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">
              {team.totalScore} / 500
            </div>
            <div className="text-[10px] text-sky-600 font-medium mt-0.5">
              Рейтинг: #{team.rank} в лиге
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">
              Индекс готовности
            </div>
            <div className="text-xl font-black text-emerald-600 mt-0.5 font-mono">
              {team.launchReadinessPercent}%
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">Рекомендован к пуску</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase">
              Бортовой комплекс
            </div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {team.cubesatSpecs.format} ({team.cubesatSpecs.massKg} кг)
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              Орбита {team.cubesatSpecs.orbitAltitudeKm} км, маяк {team.cubesatSpecs.radioFreqMhz}{' '}
              МГц
            </div>
          </div>
        </div>

        {/* Stages Breakdown Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            1. Прогресс и результаты по этапам кейса
          </h3>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2 w-10">№</th>
                <th className="p-2">Название этапа</th>
                <th className="p-2">Статус проверки</th>
                <th className="p-2 text-right">Баллы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {CASE_STAGES.map((stage) => {
                const score = team.stageScores[stage.id];
                const status = team.stageStatuses[stage.id];
                return (
                  <tr key={stage.id} className="hover:bg-slate-50">
                    <td className="p-2 font-mono font-bold text-slate-500">{stage.number}</td>
                    <td className="p-2 font-medium text-slate-900">{stage.title}</td>
                    <td className="p-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'submitted'
                              ? 'bg-sky-100 text-sky-800'
                              : status === 'under_review'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {status === 'approved'
                          ? 'ЗАЧТЕНО'
                          : status === 'submitted'
                            ? 'ОТПРАВЛЕНО'
                            : 'В РАБОТЕ'}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {score} / 100
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expert Jury Feedback Section */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            2. Заключение экспертного жюри
          </h3>
          <div className="space-y-2">
            {teamSubmissions
              .filter((s) => s.juryFeedback)
              .map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                >
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{sub.title}</span>
                    <span className="text-emerald-700 font-mono">
                      {sub.juryFeedback?.totalScore}/100 б.
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Эксперт: {sub.juryFeedback?.juryName} ({sub.juryFeedback?.juryTitle})
                  </div>
                  <p className="mt-1.5 text-slate-700 italic text-[11px]">
                    «{sub.juryFeedback?.comment}»
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Roster & Signatures */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              Научный руководитель команды:
            </div>
            <div className="font-bold text-slate-900 mt-0.5">{team.mentorName}</div>
            <div className="text-[10px] text-slate-600">{team.mentorTitle}</div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              Председатель комиссии кейс-чемпионата:
            </div>
            <div className="font-bold text-slate-900 mt-0.5">Проф. А.И. Мельников, Д.ф.-м.н.</div>
            <div className="text-[10px] text-emerald-700 font-bold mt-1">
              ✓ ЭЛЕКТРОННАЯ ПОДПИСЬ ВЕРИФИЦИРОВАНА
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
