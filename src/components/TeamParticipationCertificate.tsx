import React, { useState } from 'react';
import {
  Award,
  Download,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  Users,
  User,
  Palette,
  Check,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Team } from '../types';
import { generateDigitalCertificatePdf } from '../services/pdfExport';

interface TeamParticipationCertificateProps {
  team: Team;
  className?: string;
}

export const TeamParticipationCertificate: React.FC<TeamParticipationCertificateProps> = ({
  team,
  className = '',
}) => {
  const [certStyle, setCertStyle] = useState<'gold' | 'blue' | 'cyber'>('gold');
  const [recipientType, setRecipientType] = useState<'team' | 'member'>('team');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(team.members[0]?.id || '');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const selectedMember = team.members.find((m) => m.id === selectedMemberId) || team.members[0];

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      void generateDigitalCertificatePdf(team, {
        style: certStyle,
        recipientType,
        memberName: recipientType === 'member' ? selectedMember?.name : undefined,
        memberRole: recipientType === 'member' ? selectedMember?.role : undefined,
      });
      setIsExporting(false);
      setDownloadSuccess(true);

      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#eab308', '#38bdf8', '#818cf8', '#34d399'],
        });
      } catch {
        // Safe fallback in headless/test
      }

      setTimeout(() => setDownloadSuccess(false), 4000);
    }, 300);
  };

  const handleCopyVerificationLink = () => {
    navigator.clipboard.writeText(
      `https://kosmos-prosto.space/verify/CERT-${team.id.toUpperCase()}-RANK${team.rank}`,
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getRankBadge = () => {
    if (team.rank === 1) {
      return {
        label: 'Победитель (1 место)',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: '🥇',
      };
    }
    if (team.rank === 2) {
      return {
        label: 'Призер (2 место)',
        badgeClass: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
        icon: '🥈',
      };
    }
    if (team.rank === 3) {
      return {
        label: 'Призер (3 место)',
        badgeClass: 'bg-amber-700/20 text-amber-300 border-amber-700/40',
        icon: '🥉',
      };
    }
    return {
      label: `Финалист (${team.rank} место в лиге)`,
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: '🛰️',
    };
  };

  const rankBadge = getRankBadge();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">
                Официальный PDF-сертификат участия команды
              </h2>
              <span
                className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${rankBadge.badgeClass}`}
              >
                <span>{rankBadge.icon}</span>
                <span>{rankBadge.label}</span>
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Генерация официального наградного диплома допуска к запуску наноспутника CubeSat на
              основе текущего рейтинга команды «{team.name}».
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
        >
          <Download className="h-4 w-4" />
          <span>{isExporting ? 'Формирование PDF...' : 'Скачать PDF-сертификат'}</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>
            PDF-сертификат команды «{team.name}» с финальным рейтингом #{team.rank} успешно создан и
            загружен!
          </span>
        </div>
      )}

      {/* Control Studio & Live Artboard Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Options Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 text-xs shadow-xl space-y-4">
            <div className="font-bold text-white pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>Параметры формирования</span>
              <Palette className="h-4 w-4 text-amber-400" />
            </div>

            {/* Team summary card */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Команда:</span>
                <span className="font-bold text-white">«{team.name}»</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Финальный рейтинг:</span>
                <span className="font-mono font-bold text-amber-400">
                  #{team.rank} в Лиге ({team.totalScore} б.)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Учебное заведение:</span>
                <span className="text-slate-300 text-right truncate max-w-[180px]">
                  {team.school}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Готовность к запуску:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {team.launchReadinessPercent}%
                </span>
              </div>
            </div>

            {/* Recipient Type */}
            <div>
              <span className="block text-slate-400 mb-1.5 font-medium">Формат сертификата:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientType('team')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-semibold transition-all border ${
                    recipientType === 'team'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Командный</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientType('member')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 font-semibold transition-all border ${
                    recipientType === 'member'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>Именной</span>
                </button>
              </div>
            </div>

            {/* Member selector if member type */}
            {recipientType === 'member' && (
              <div>
                <label htmlFor="cert-member-select" className="block text-slate-400 mb-1">
                  Член экипажа для диплома:
                </label>
                <select
                  id="cert-member-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {team.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.role} ({m.grade})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Visual Style Theme */}
            <div>
              <span className="block text-slate-400 mb-1.5 font-medium">Цветовая гамма:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCertStyle('gold')}
                  className={`rounded-lg p-2 text-center transition-all border ${
                    certStyle === 'gold'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  🥇 Золото
                </button>
                <button
                  type="button"
                  onClick={() => setCertStyle('blue')}
                  className={`rounded-lg p-2 text-center transition-all border ${
                    certStyle === 'blue'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-300 font-bold shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  🔷 Сапфир
                </button>
                <button
                  type="button"
                  onClick={() => setCertStyle('cyber')}
                  className={`rounded-lg p-2 text-center transition-all border ${
                    certStyle === 'cyber'
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  🌌 Космос
                </button>
              </div>
            </div>

            {/* Verification Barcode Info */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Верифицирован в реестре ЦУП</span>
                </span>
                <span className="font-mono text-slate-500 text-[10px]">SHA-256</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono break-all">
                CERT-KOSMOS-{team.id.toUpperCase()}-RANK{team.rank}-2026
              </p>
              <button
                type="button"
                onClick={handleCopyVerificationLink}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedLink ? 'Ссылка скопирована' : 'Скопировать ссылку проверки'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Live Artboard Certificate Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="font-bold text-white text-xs flex items-center justify-between">
            <span>Предпросмотр бланка (А4 Альбомный, 300 DPI):</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-mono text-amber-400 font-semibold">
                Финальный рейтинг: #{team.rank}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Векторный PDF</span>
            </div>
          </div>

          {/* Certificate Artboard Container */}
          <div
            className={`relative overflow-hidden rounded-2xl p-8 sm:p-10 shadow-2xl transition-all border-4 ${
              certStyle === 'cyber'
                ? 'bg-slate-950 text-slate-100 border-sky-500/50 shadow-sky-500/10'
                : certStyle === 'blue'
                  ? 'bg-gradient-to-b from-sky-50 to-white text-slate-900 border-sky-600 shadow-sky-500/10'
                  : 'bg-gradient-to-b from-amber-50 to-amber-100/60 text-slate-900 border-amber-600 shadow-amber-500/10'
            }`}
          >
            {/* Double Ornamental Inner Border */}
            <div
              className={`absolute inset-3 rounded-xl border pointer-events-none ${
                certStyle === 'cyber'
                  ? 'border-sky-400/30'
                  : certStyle === 'blue'
                    ? 'border-sky-300'
                    : 'border-amber-400/60'
              }`}
            />
            <div
              className={`absolute inset-4 rounded-lg border pointer-events-none ${
                certStyle === 'cyber'
                  ? 'border-indigo-500/20'
                  : certStyle === 'blue'
                    ? 'border-sky-200'
                    : 'border-amber-300/40'
              }`}
            />

            {/* Corner Decorative Dots */}
            <div className="absolute top-5 left-5 h-2 w-2 rounded-full bg-amber-500" />
            <div className="absolute top-5 right-5 h-2 w-2 rounded-full bg-amber-500" />
            <div className="absolute bottom-5 left-5 h-2 w-2 rounded-full bg-amber-500" />
            <div className="absolute bottom-5 right-5 h-2 w-2 rounded-full bg-amber-500" />

            {/* Certificate Header */}
            <div className="text-center space-y-1.5 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <span className="h-0.5 w-12 bg-amber-500/60 inline-block" />
                <span
                  className={`text-[10px] font-black tracking-widest uppercase ${
                    certStyle === 'cyber'
                      ? 'text-sky-400'
                      : certStyle === 'blue'
                        ? 'text-sky-700'
                        : 'text-amber-800'
                  }`}
                >
                  Всероссийский кейс-чемпионат по физике «Космос-просто»
                </span>
                <span className="h-0.5 w-12 bg-amber-500/60 inline-block" />
              </div>

              <h3
                className={`text-2xl sm:text-3xl font-black tracking-tight ${
                  certStyle === 'cyber' ? 'text-white' : 'text-slate-950'
                }`}
              >
                СЕРТИФИКАТ УЧАСТИЯ И КВАЛИФИКАЦИИ CUBESAT
              </h3>

              <p
                className={`text-xs font-serif italic ${
                  certStyle === 'cyber' ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                Orbital Flight Qualification & Official Participation Diploma
              </p>
            </div>

            {/* Recipient Presentation */}
            <div className="text-center my-6 relative z-10 space-y-1">
              <div
                className={`text-[11px] uppercase tracking-wider font-semibold ${
                  certStyle === 'cyber' ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                НАГРАЖДАЕТСЯ:
              </div>

              <div
                className={`text-xl sm:text-2xl font-black ${
                  certStyle === 'cyber'
                    ? 'text-cyan-300'
                    : certStyle === 'blue'
                      ? 'text-sky-900'
                      : 'text-amber-950'
                }`}
              >
                {recipientType === 'member'
                  ? selectedMember?.name.toUpperCase()
                  : `КОМАНДА «${team.name.toUpperCase()}»`}
              </div>

              <div
                className={`text-xs ${certStyle === 'cyber' ? 'text-slate-300' : 'text-slate-700'}`}
              >
                {recipientType === 'member'
                  ? `${selectedMember?.role} (${selectedMember?.grade}) • Команда «${team.name}» • ${team.school} (${team.city})`
                  : `${team.school} (${team.city}) • ${team.league}`}
              </div>
            </div>

            {/* Citation Narrative Paragraph */}
            <div className="relative z-10 max-w-xl mx-auto text-center">
              <p
                className={`text-xs leading-relaxed ${
                  certStyle === 'cyber' ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                За успешное прохождение всех этапов кейс-чемпионата, высокий уровень решения
                инженерных задач по направлению «
                {team.trackTitle || 'Орбитальная механика и CubeSat'}», достижение{' '}
                <strong className="underline decoration-amber-500">
                  финального рейтинга #{team.rank} в Лиге
                </strong>{' '}
                с суммарным результатом {team.totalScore} баллов и официальный допуск наноспутника к
                пуску.
              </p>
            </div>

            {/* CubeSat Parameters Banner with Rank */}
            <div
              className={`my-5 rounded-xl border p-3 flex flex-wrap items-center justify-around gap-2 text-center text-xs relative z-10 ${
                certStyle === 'cyber'
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                  : 'bg-white/80 border-slate-300 text-slate-800'
              }`}
            >
              <div>
                <div className="text-[10px] text-slate-500 font-semibold">ФИНАЛЬНЫЙ РЕЙТИНГ</div>
                <div className="font-bold text-sm font-mono mt-0.5 text-amber-600 flex items-center justify-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>#{team.rank} в Лиге</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-300/40" />
              <div>
                <div className="text-[10px] text-slate-500 font-semibold">ИТОГОВЫЙ БАЛЛ</div>
                <div className="font-bold text-sm font-mono mt-0.5 text-cyan-600">
                  {team.totalScore} / 500 б.
                </div>
              </div>
              <div className="h-6 w-px bg-slate-300/40" />
              <div>
                <div className="text-[10px] text-slate-500 font-semibold">ФОРМАТ CUBESAT</div>
                <div className="font-bold text-sm font-mono mt-0.5">
                  {team.cubesatSpecs.format} • {team.cubesatSpecs.massKg} кг
                </div>
              </div>
              <div className="h-6 w-px bg-slate-300/40" />
              <div>
                <div className="text-[10px] text-slate-500 font-semibold">ОРБИТА ВЫВЕДЕНИЯ</div>
                <div className="font-bold text-sm font-mono mt-0.5">
                  {team.cubesatSpecs.orbitAltitudeKm} км ССО
                </div>
              </div>
            </div>

            {/* Signatures & Seal Footer */}
            <div className="pt-4 border-t border-slate-300/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10">
              <div className="text-center sm:text-left">
                <div className="font-bold text-slate-900 dark:text-white">Проф. А.И. Мельников</div>
                <div className="text-[10px] text-slate-500">
                  Председатель экспертного жюри, Д.ф.-м.н.
                </div>
              </div>

              {/* Official Seal Emblem */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-600 bg-amber-500/10 text-amber-700 font-black text-xs shadow-inner">
                  ★ ЦУП ★
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1">
                  № {team.id.toUpperCase().substring(0, 8)}-RANK{team.rank}
                </span>
              </div>

              <div className="text-center sm:text-right">
                <div className="font-bold text-slate-900 dark:text-white">{team.mentorName}</div>
                <div className="text-[10px] text-slate-500">Научный руководитель команды</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
