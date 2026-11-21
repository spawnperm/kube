/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CRM Планировщик этапов кейс-чемпионата «КОСМОПОРТ» (ЦУП)
 *
 * Включает:
 * 1. Интерактивную временную шкалу (Timeline) с прогрессом, контрольными точками и дедлайнами.
 * 2. Статусы этапов: Завершён, Текущий (приём открыт), Горящий дедлайн (< 48 ч), Запланирован.
 * 3. Автоматическую связку дедлайнов с системой оповещений Бортового компьютера «Леший»:
 *    - Авто-напоминания за 7 дней, 3 дня, 24 часа и 2 часа до дедлайна.
 *    - Рассылка официальных циркуляров капитанам (наставникам) и в бортовые журналы.
 *    - Кнопка симуляции/тестирования автоматического срабатывания оповещения Лешего.
 *    - Журнал отправленных директив Лешего.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Bot,
  Bell,
  Send,
  Radio,
  Flame,
  Check,
  ChevronRight,
  Shield,
  Edit3,
  Sliders,
  Volume2,
  Info,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Zap,
} from 'lucide-react';
import {
  CrmChampionshipStage,
  CrmNotificationEmail,
  KubikDeadlineAlert,
} from '@/src/shared/types/index';
import {
  kubikAlertService,
  KubikAutomationConfig,
} from '@/src/contexts/championship/services/kubikAlertService';
import { audioService } from '@/src/shared/lib/audioService';

interface CrmStagesSchedulerProps {
  stages?: CrmChampionshipStage[];
  onBroadcastStage?: (stage: CrmChampionshipStage, emailLetter: CrmNotificationEmail) => void;
  mentorEmail?: string;
  mentorName?: string;
  shipName?: string;
  onNavigateToMascot?: () => void;
}

export const CrmStagesScheduler: React.FC<CrmStagesSchedulerProps> = ({
  onBroadcastStage,
  mentorEmail = 'dsbondarenko@yandex.ru',
  mentorName = 'Бондаренко Дарья Сергеевна',
  shipName = 'Восток-81',
  onNavigateToMascot,
}) => {
  const [stages, setStages] = useState<CrmChampionshipStage[]>(() => kubikAlertService.getStages());
  const [alerts, setAlerts] = useState<KubikDeadlineAlert[]>(() => kubikAlertService.getAlerts());
  const [config, setConfig] = useState<KubikAutomationConfig>(() => kubikAlertService.getConfig());

  const [selectedStageId, setSelectedStageId] = useState<string>(stages[1]?.id || stages[0]?.id);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null);

  // Quick edit deadline modal/state
  const [editingDeadlineStageId, setEditingDeadlineStageId] = useState<string | null>(null);
  const [tempDeadlineTime, setTempDeadlineTime] = useState('');
  const [tempDates, setTempDates] = useState('');

  // Active filter for stages in timeline
  const [stageFilter, setStageFilter] = useState<'all' | 'current' | 'future' | 'past'>('all');

  // Sync with kubikAlertService updates
  useEffect(() => {
    const unsubscribe = kubikAlertService.subscribe(() => {
      setStages(kubikAlertService.getStages());
      setAlerts(kubikAlertService.getAlerts());
      setConfig(kubikAlertService.getConfig());
    });
    return () => unsubscribe();
  }, []);

  const overallProgress = useMemo(() => {
    return kubikAlertService.getOverallProgress();
  }, [stages]);

  const activeStage = stages.find((s) => s.id === selectedStageId) || stages[1] || stages[0];

  // Handle stage status change
  const handleChangeStatus = (
    stageId: string,
    newStatus: 'past' | 'current' | 'future' | 'urgent',
  ) => {
    const updated = kubikAlertService.updateStageStatus(stageId, newStatus);
    setStages(updated);
    audioService.playClickSound();

    const target = updated.find((s) => s.id === stageId);
    setBroadcastNotice(
      `Статус этапа №${target?.number} обновлен: ${getStatusLabel(newStatus)}. Оповещение передано Лешему.`,
    );
    setTimeout(() => setBroadcastNotice(null), 4000);
  };

  // Broadcast stage to Captain & Kubik
  const handleBroadcastStage = (stage: CrmChampionshipStage) => {
    setIsBroadcasting(true);
    audioService.playClickSound();

    setTimeout(() => {
      const res = kubikAlertService.broadcastStageFromCrm(
        stage.id,
        mentorEmail,
        mentorName,
        shipName,
      );
      setIsBroadcasting(false);
      setBroadcastNotice(
        `📢 Официальный циркуляр по этапу №${stage.number} разослан! Бортовой компьютер «Леший» оповестил экипаж «${shipName}», извещение направлено на ${mentorEmail}.`,
      );
      if (onBroadcastStage) {
        onBroadcastStage(res.stage, res.email);
      }
      setTimeout(() => setBroadcastNotice(null), 6000);
    }, 500);
  };

  // Test Kubik Alert Simulation
  const handleTestKubikAlert = () => {
    const alert = kubikAlertService.testKubikAlertSimulation(activeStage.number);
    setBroadcastNotice(
      `⚡ Леший сработал в реальном времени: «${alert.title}» добавлено в журнал и бортовой чат!`,
    );
    setTimeout(() => setBroadcastNotice(null), 5000);
  };

  // Save edited deadline
  const handleSaveDeadline = (stageId: string) => {
    if (!tempDeadlineTime.trim()) return;
    const updated = kubikAlertService.updateStageDeadline(
      stageId,
      tempDeadlineTime.trim(),
      tempDates.trim() || undefined,
    );
    setStages(updated);
    setEditingDeadlineStageId(null);
    audioService.playSuccessChime();
    setBroadcastNotice(
      `Дедлайн скорректирован. Бортовой компьютер «Леший» обновил таймер для кораблей.`,
    );
    setTimeout(() => setBroadcastNotice(null), 4000);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'past':
        return 'Завершён';
      case 'current':
        return 'Текущий (приём открыт)';
      case 'urgent':
        return 'Горящий дедлайн (< 48 ч)';
      case 'future':
        return 'Запланирован';
      default:
        return status;
    }
  };

  const filteredStages = stages.filter((s) => {
    if (stageFilter === 'all') return true;
    if (stageFilter === 'current') return s.status === 'current' || s.status === 'urgent';
    if (stageFilter === 'future') return s.status === 'future';
    if (stageFilter === 'past') return s.status === 'past';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* TOP HEADER: MCC Overview & Real-time Progress */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Планировщик этапов ЦУП</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Синхронизация с Лешим: АКТИВНА</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              График кейс-чемпионата и автоматизация дедлайнов
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Управление 5 контрольными этапами, согласование дат с регламентом МАОУ ДПО «ЦРСО» и
              автоматическая передача предупреждений в систему оповещений Бортового компьютера
              «Леший».
            </p>
          </div>

          {/* Action Button: Quick test Kubik */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleTestKubikAlert}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-200 animate-bounce" />
              <span>Тест оповещения Лешего</span>
            </button>

            {onNavigateToMascot && (
              <button
                onClick={onNavigateToMascot}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Открыть Лешего</span>
              </button>
            )}
          </div>
        </div>

        {/* METRICS & OVERALL PROGRESS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Общий прогресс чемпионата</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
              {overallProgress.percent}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgress.percent}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Текущий активный этап</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-emerald-300 truncate mt-0.5">
              №{overallProgress.currentStage?.number || 2}:{' '}
              {overallProgress.currentStage?.title || 'Квиз'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Сроки: {overallProgress.currentStage?.dates || '11 – 14 окт'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-amber-900/40 bg-amber-950/10">
            <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Ближайший дедлайн</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-amber-300 mt-0.5">
              {overallProgress.nextDeadline}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-1 font-mono">
              Осталось: 1 дн. 18 ч.
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-[11px] text-cyan-400 font-semibold flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span>Оповещений Лешего</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5">
              {alerts.length} директив
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Непрочитанных:{' '}
              <span className="text-rose-400 font-bold">
                {kubikAlertService.getUnreadAlertsCount()}
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {broadcastNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{broadcastNotice}</span>
            </div>
            <button
              onClick={() => setBroadcastNotice(null)}
              className="text-emerald-400 hover:text-white ml-2 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. VISUAL INTERACTIVE TIMELINE (ВРЕМЕННАЯ ШКАЛА) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Временная шкала контрольных точек чемпионата</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Октябрь 2026
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Нажмите на этап на шкале, чтобы открыть подробности, критерии сдачи и управление
              оповещениями
            </p>
          </div>

          {/* Filter by stage status */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setStageFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                stageFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Все (5)
            </button>
            <button
              onClick={() => setStageFilter('current')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                stageFilter === 'current'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-emerald-400 hover:text-white'
              }`}
            >
              Текущие
            </button>
            <button
              onClick={() => setStageFilter('future')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                stageFilter === 'future'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-indigo-400 hover:text-white'
              }`}
            >
              Будущие
            </button>
            <button
              onClick={() => setStageFilter('past')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                stageFilter === 'past'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Завершенные
            </button>
          </div>
        </div>

        {/* TIMELINE TRACK VISUALIZATION (DESKTOP & TABLET) */}
        <div className="relative pt-4 pb-2">
          {/* Connecting Line Track */}
          <div className="hidden md:block absolute top-10 left-8 right-8 h-1 bg-slate-800 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress.percent}%` }}
            />
          </div>

          {/* Step Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
            {stages.map((stage) => {
              const isSelected = stage.id === selectedStageId;
              const isCurrent = stage.status === 'current' || stage.status === 'urgent';
              const isPast = stage.status === 'past';
              const timeInfo = kubikAlertService.calculateTimeRemaining(stage);

              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setSelectedStageId(stage.id);
                    audioService.playClickSound();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-slate-950 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-950/40'
                      : isCurrent
                        ? 'bg-slate-950/90 border-emerald-500/60 hover:border-emerald-400'
                        : isPast
                          ? 'bg-slate-950/50 border-slate-800 opacity-80 hover:opacity-100 hover:border-slate-700'
                          : 'bg-slate-950/70 border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  {/* Top Node Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-transform group-hover:scale-105 ${
                        isCurrent
                          ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : isPast
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : stage.number}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                          : isPast
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPast ? 'Завершён' : isCurrent ? 'Идёт сейчас' : 'План'}
                    </span>
                  </div>

                  {/* Title & Dates */}
                  <div className="space-y-1 mb-2">
                    <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors">
                      {stage.title}
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono">{stage.dates}</div>
                  </div>

                  {/* Deadline & Countdown Pill */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Дедлайн:</span>
                    <span
                      className={`font-mono font-bold ${
                        isCurrent ? 'text-amber-300' : isPast ? 'text-slate-500' : 'text-indigo-300'
                      }`}
                    >
                      {timeInfo.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. DETAILED STAGE INSPECTOR & KUBIK AUTOMATION CONTROLS */}
      {activeStage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Stage Details & Actions */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                    activeStage.status === 'current'
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                      : activeStage.status === 'past'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}
                >
                  №{activeStage.number}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {activeStage.title}
                    </h3>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        activeStage.status === 'current'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : activeStage.status === 'past'
                            ? 'bg-slate-800 text-slate-400'
                            : activeStage.status === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {getStatusLabel(activeStage.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span>
                      🗓️ <strong>{activeStage.dates}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Дедлайн:{' '}
                      <strong className="text-amber-300">{activeStage.deadlineTime}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Куратор:{' '}
                      <strong className="text-slate-200">
                        {activeStage.responsibleMCC || 'ЦУП'}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit deadline button */}
              <button
                onClick={() => {
                  setEditingDeadlineStageId(activeStage.id);
                  setTempDeadlineTime(activeStage.deadlineTime);
                  setTempDates(activeStage.dates);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 self-start sm:self-auto transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Изменить дедлайн</span>
              </button>
            </div>

            {/* Quick Edit Deadline Form inline if active */}
            {editingDeadlineStageId === activeStage.id && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Редактирование сроков этапа №{activeStage.number}:</span>
                  <span className="text-[11px] text-cyan-300 font-mono">
                    Леший автоматически уведомит экипажи об изменении
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Сроки проведения:
                    </label>
                    <input
                      type="text"
                      value={tempDates}
                      onChange={(e) => setTempDates(e.target.value)}
                      placeholder="Например: 11 – 14 октября 2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Точное время дедлайна:
                    </label>
                    <input
                      type="text"
                      value={tempDeadlineTime}
                      onChange={(e) => setTempDeadlineTime(e.target.value)}
                      placeholder="Например: 14 октября, 21:00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setEditingDeadlineStageId(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleSaveDeadline(activeStage.id)}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30"
                  >
                    Сохранить и уведомить Лешего
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeStage.description}
            </p>

            {/* Required Deliverables Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Обязательные материалы для защиты этапа:</span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {activeStage.requiredDeliverables.length} критерия(ев)
                </span>
              </div>

              <div className="space-y-2">
                {activeStage.requiredDeliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 text-xs"
                  >
                    <div className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar: Change Status & Broadcast */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Status Switcher */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Сменить статус:</span>
                <button
                  onClick={() => handleChangeStatus(activeStage.id, 'current')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeStage.status === 'current'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Сделать текущим
                </button>
                <button
                  onClick={() => handleChangeStatus(activeStage.id, 'past')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeStage.status === 'past'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Завершить
                </button>
                <button
                  onClick={() => handleChangeStatus(activeStage.id, 'future')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeStage.status === 'future'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  В план
                </button>
              </div>

              {/* Official Broadcast Button */}
              <button
                onClick={() => handleBroadcastStage(activeStage)}
                disabled={isBroadcasting}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                {isBroadcasting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {isBroadcasting
                    ? 'Рассылка...'
                    : activeStage.notificationSent
                      ? 'Повторить оповещение экипажу'
                      : '📢 Объявить этап через Лешего'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Col: Kubik Automation Hub & Directives Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-base shadow-md shadow-indigo-500/30">
                    🤖
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Оркестратор Лешего</h4>
                    <span className="text-[10px] text-cyan-300 font-mono">
                      Авто-контроль дедлайнов
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Активен
                </span>
              </div>

              {/* Automation Toggles */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Авто-оповещения Лешего:</span>
                  <input
                    type="checkbox"
                    checked={config.autoAlertsEnabled}
                    onChange={(e) => {
                      kubikAlertService.updateConfig({ autoAlertsEnabled: e.target.checked });
                      audioService.playClickSound();
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-300">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Интервалы автоматических сигналов:
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.alertIntervals.sevenDays}
                      onChange={(e) =>
                        kubikAlertService.updateConfig({
                          alertIntervals: { ...config.alertIntervals, sevenDays: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span>За 7 дней (Старт и методические материалы)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.alertIntervals.threeDays}
                      onChange={(e) =>
                        kubikAlertService.updateConfig({
                          alertIntervals: { ...config.alertIntervals, threeDays: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span>За 3 дня (Промежуточный аудит слайдов)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.alertIntervals.oneDay}
                      onChange={(e) =>
                        kubikAlertService.updateConfig({
                          alertIntervals: { ...config.alertIntervals, oneDay: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span>За 24 часа (Предупреждение повышенного внимания)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.alertIntervals.twoHours}
                      onChange={(e) =>
                        kubikAlertService.updateConfig({
                          alertIntervals: { ...config.alertIntervals, twoHours: e.target.checked },
                        })
                      }
                      className="rounded text-indigo-600"
                    />
                    <span>За 2 часа (Экстренный сигнал ЦУП)</span>
                  </label>
                </div>
              </div>

              {/* Directives Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>Журнал директив Лешего ({alerts.length}):</span>
                  <button
                    onClick={() => {
                      kubikAlertService.markAllAlertsAsRead();
                      audioService.playClickSound();
                    }}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Прочитать все
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {alerts.slice(0, 4).map((alt) => (
                    <div
                      key={alt.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        alt.isRead
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                          : alt.alertLevel === 'urgent'
                            ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                            : 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold truncate text-white">{alt.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {alt.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed line-clamp-2">{alt.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Simulation trigger */}
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={handleTestKubikAlert}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-500/30 flex items-center justify-center gap-2 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Проверить сигнал бортового компьютера «Леший»</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
