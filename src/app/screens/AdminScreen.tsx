import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  Server,
  Activity,
  Cpu,
  Database,
  Radio,
  Sliders,
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  Settings,
  Eye,
  Bot,
  Zap,
  Globe,
  HardDrive,
  Network,
  Trash2,
  Plus,
  Clock,
  Check,
  Users,
  Rocket,
  X,
  FileText,
  Search,
  Filter,
  BarChart3,
  Play,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, Team, TeamMember, ChampionshipNews } from '@/src/shared/types/index';
import { DEMO_PROFILES } from '@/src/shared/data/mockData';
import { CRM_TEAMS_DATABASE, CrmTeamRecord } from '@/src/contexts/crew/data/crmTeamsData';
import { audioService } from '@/src/shared/lib/audioService';
import { RoleManagementTab } from '@/src/contexts/crew/components/RoleManagementTab';
import { ServerResourcesMonitorWidget } from '@/src/components/admin/ServerResourcesMonitorWidget';
import type {
  SystemLogEntry,
  SystemStatsResponse,
  HealthCheckResponse,
} from '@/src/shared/types/stageDirector';

interface AdminScreenProps {
  currentUser: UserProfile;
  activeTeam: Team;
  allTeams?: CrmTeamRecord[];
  newsList: ChampionshipNews[];
  onImpersonateUser: (targetUser: UserProfile, targetTeamId?: string) => void;
  onResetFactoryState: () => void;
  onOpenAiRegistration?: (prefillTeamId?: string) => void;
  onApproveMember?: (memberId: string) => void;
  onRejectMember?: (memberId: string) => void;
  onAddMember?: (newMember: Omit<TeamMember, 'id'>) => void;
  onNavigateToScreen?: (screen: string) => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  currentUser,
  activeTeam,
  allTeams = CRM_TEAMS_DATABASE,
  newsList,
  onImpersonateUser,
  onResetFactoryState,
  onOpenAiRegistration,
  onApproveMember,
  onRejectMember,
  onAddMember,
  onNavigateToScreen,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<
    | 'monitoring'
    | 'logs'
    | 'reports'
    | 'registrations'
    | 'roles'
    | 'config'
    | 'impersonate'
    | 'database'
  >('monitoring');

  // Manual participant registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGrade, setRegGrade] = useState<number>(10);
  const [regRole, setRegRole] = useState<'captain' | 'physicist' | 'engineer' | 'biologist'>(
    'physicist',
  );
  const [regSuccessBanner, setRegSuccessBanner] = useState<string | null>(null);

  // System logs filter & state
  const [logFilterLevel, setLogFilterLevel] = useState<string>('all');
  const [logFilterSubsystem, setLogFilterSubsystem] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [logsList, setLogsList] = useState<SystemLogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000).toLocaleTimeString('ru-RU'),
      level: 'info',
      subsystem: 'SYS',
      message:
        'Node.js 22 runtime инициализирован на порту 3000 (0.0.0.0). Режим: Vite SPA + Express API.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3200000).toLocaleTimeString('ru-RU'),
      level: 'info',
      subsystem: 'TELEMETRY',
      message:
        'Служба AX.25 радиомаяка активна. Частота 437.425 МГц, синхронизация со станциями сети СОНИКС.',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 2400000).toLocaleTimeString('ru-RU'),
      level: 'audit',
      subsystem: 'AUTH',
      message: `Администратор «${currentUser.name}» открыл главный пульт управления порталом.`,
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 1200000).toLocaleTimeString('ru-RU'),
      level: 'info',
      subsystem: 'STAGE_CTRL',
      message:
        'Диспетчер сценических экранов готов: активный экран по умолчанию «Стартовые позиции кораблей».',
    },
    {
      id: 'log-5',
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString('ru-RU'),
      level: 'info',
      subsystem: 'CRM',
      message:
        'Реестр 10 команд проверен. Все экипажи укомплектованы (Капитан, Физик, Инженер, Биолог).',
    },
  ]);

  // Error tracking state
  const [errorsList, setErrorsList] = useState<
    Array<{ timestamp: string; message: string; status: number }>
  >([
    {
      timestamp: new Date(Date.now() - 5400000).toLocaleTimeString('ru-RU'),
      message:
        'Кэш DNS: временный таймаут пинга внешнего TLE-сервера Space-Track (задействован локальный эмулятор TLE)',
      status: 200,
    },
  ]);

  // Simulated real-time server metrics
  const [serverMetrics, setServerMetrics] = useState({
    heapUsedMb: 68.4,
    heapTotalMb: 112.0,
    rssMb: 145.2,
    externalMb: 24.8,
    systemTotalMb: 4096,
    systemFreeMb: 2180,
    percentHeapUsed: 61,
    cpuPercent: 3.2,
    geminiLatencyMs: 410,
    wsActiveSockets: 2,
    uptimeSeconds: 4210,
    rateLimitRequests: 48,
    totalErrorsCount: 0,
  });

  // Feature Flags state
  const [featureFlags, setFeatureFlags] = useState({
    geminiLiveAudio: true,
    kubikAutoAlerts: true,
    offlinePwaCache: true,
    soundEffectsEnabled: true,
    strictOfficeFormatCheck: true,
    telemetryBroadcastEnabled: true,
    maxFileSizeMb: 25,
    selectedAiModel: 'gemini-3.8-flash',
  });

  // Fetch real server stats if available from backend
  useEffect(() => {
    fetch('/api/admin/system-stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SystemStatsResponse | null) => {
        if (data) {
          setServerMetrics((prev) => ({
            ...prev,
            heapUsedMb: data.memory.heapUsedMb,
            heapTotalMb: data.memory.heapTotalMb,
            rssMb: data.memory.rssMb,
            externalMb: data.memory.externalMb,
            systemTotalMb: data.memory.systemTotalMb,
            systemFreeMb: data.memory.systemFreeMb,
            percentHeapUsed: data.memory.percentHeapUsed,
            uptimeSeconds: data.uptimeSeconds,
            totalErrorsCount: data.errors.totalCount,
            cpuPercent: data.cpu.percentUsed ?? prev.cpuPercent,
            wsActiveSockets: data.websocket?.activeConnections ?? prev.wsActiveSockets,
          }));
          if (data.errors.lastErrors.length > 0) {
            setErrorsList(data.errors.lastErrors);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Periodic metric pulse
  useEffect(() => {
    const timer = setInterval(() => {
      setServerMetrics((prev) => {
        const nextUsed = Number((prev.heapUsedMb + (Math.random() * 2 - 1)).toFixed(1));
        return {
          ...prev,
          heapUsedMb: Math.max(55, Math.min(95, nextUsed)),
          percentHeapUsed: Math.round((nextUsed / prev.heapTotalMb) * 100),
          cpuPercent: Number((2.5 + Math.random() * 2.5).toFixed(1)),
          geminiLatencyMs: Math.floor(390 + Math.random() * 50),
          uptimeSeconds: prev.uptimeSeconds + 3,
          rateLimitRequests: prev.rateLimitRequests + (Math.random() > 0.7 ? 1 : 0),
        };
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}ч ${m}м ${s}с`;
  };

  const handleManualRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) return;

    if (onAddMember) {
      onAddMember({
        name: regName.trim(),
        email: regEmail.trim(),
        grade: regGrade,
        role: regRole,
        status: 'pending_approval',
        registeredByMentorId: currentUser.id,
        registeredAt: new Date().toLocaleDateString(),
      });
    }

    setRegSuccessBanner(`Заявка участника «${regName.trim()}» успешно внесена в реестр модерации!`);
    setRegName('');
    setRegEmail('');
    audioService.playSuccessChime();
  };

  const handleAddTestLog = () => {
    const newLog: SystemLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      level: 'info',
      subsystem: 'SYS',
      message: `Тестовая диагностическая запись: проверка очереди событий и каналов API.`,
    };
    setLogsList((prev) => [newLog, ...prev]);
    audioService.playClickSound();

    fetch('/api/admin/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog),
    }).catch(() => {});
  };

  const handleTriggerTestError = () => {
    const errorEntry = {
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      message: 'Искусственная симуляция инцидента: проверка журнала системных ошибок и алертинга',
      status: 500,
    };
    setErrorsList((prev) => [errorEntry, ...prev]);
    setServerMetrics((prev) => ({ ...prev, totalErrorsCount: prev.totalErrorsCount + 1 }));

    const errorLog: SystemLogEntry = {
      id: `err-${Date.now()}`,
      timestamp: errorEntry.timestamp,
      level: 'error',
      subsystem: 'SYS',
      message: `[HTTP 500] ${errorEntry.message}`,
    };
    setLogsList((prev) => [errorLog, ...prev]);
    audioService.playTimerWarning();

    fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'trigger_test_error' }),
    }).catch(() => {});
  };

  const handleClearLogs = () => {
    setLogsList([]);
    audioService.playClickSound();
    fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear_logs' }),
    }).catch(() => {});
  };

  const handleTriggerGc = () => {
    setServerMetrics((prev) => ({
      ...prev,
      heapUsedMb: Math.max(52, prev.heapUsedMb - 12),
      percentHeapUsed: 48,
    }));
    const log: SystemLogEntry = {
      id: `log-gc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      level: 'audit',
      subsystem: 'SYS',
      message: 'Вызов V8 Garbage Collection: оперативная память Node.js дефрагментирована.',
    };
    setLogsList((prev) => [log, ...prev]);
    audioService.playSuccessChime();

    fetch('/api/admin/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'gc_hint' }),
    }).catch(() => {});
  };

  const handleExportDatabaseDump = () => {
    const dump = {
      exportedAt: new Date().toISOString(),
      platform: 'КОСМОПОРТ Портал кейс-чемпионата',
      version: '2.5.0',
      serverMetrics,
      logs: logsList,
      teamsCount: allTeams.length,
      newsCount: newsList.length,
      teams: allTeams,
      news: newsList,
      activeTeam,
      currentUser,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dump, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kosmoport_sys_dump_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    audioService.playSuccessChime();
  };

  // Filtered system logs
  const filteredLogs = logsList.filter((log) => {
    const matchLevel = logFilterLevel === 'all' || log.level === logFilterLevel;
    const matchSubsystem = logFilterSubsystem === 'all' || log.subsystem === logFilterSubsystem;
    const matchQuery =
      !logSearchQuery.trim() || log.message.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchLevel && matchSubsystem && matchQuery;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. ADMIN HEADER */}
      <div className="rounded-3xl bg-slate-900/95 border border-rose-500/40 p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>СИСТЕМНЫЙ ПУЛЬТ АДМИНИСТРАТОРА И DEVOPS ПОРТАЛА</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Администрирование, мониторинг и программирование
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Администратор: <strong>{currentUser.name}</strong> • Полный контроль портов, памяти,
              ошибок, событий и ролей
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToScreen && (
              <button
                type="button"
                onClick={() => onNavigateToScreen('stage_director')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-slate-950" />
                <span>Пульт управления фронтендом</span>
              </button>
            )}
            <button
              onClick={handleExportDatabaseDump}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Экспорт дампа</span>
            </button>
          </div>
        </div>

        {/* 2. ADMIN NAVIGATION TABS */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'monitoring', label: '📊 Мониторинг: Порты & Память', icon: Activity },
            { id: 'logs', label: '📜 Журнал системных событий', icon: FileCode },
            { id: 'reports', label: '📈 Отчёты и аналитика работы', icon: BarChart3 },
            { id: 'config', label: '⚙️ Программирование & Фичи', icon: Settings },
            { id: 'registrations', label: '📝 Реестр регистраций', icon: UserCheck },
            { id: 'roles', label: '🛡️ Управление ролями', icon: Shield },
            { id: 'impersonate', label: '👤 Имперсонация капитанов', icon: Users },
            { id: 'database', label: '💾 База данных', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAdminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: REAL-TIME MONITORING (PORTS, MEMORY, ERRORS, CPU) */}
      {/* ========================================================================= */}
      {activeAdminTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Dedicated Server Health & Resource Monitoring Widget */}
          <ServerResourcesMonitorWidget />

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-cyan-400" /> Основной сетевой порт
                </span>
                <span className="text-emerald-400 font-bold">● LISTEN</span>
              </div>
              <div className="text-xl font-black text-white font-mono">0.0.0.0 : 3000</div>
              <div className="text-[11px] text-slate-400 font-mono">
                Uptime: {formatUptime(serverMetrics.uptimeSeconds)} • HTTP & WS
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" /> Оперативная память
                </span>
                <span className="text-cyan-300 font-mono">
                  {serverMetrics.percentHeapUsed}% Heap
                </span>
              </div>
              <div className="text-xl font-black text-white font-mono">
                {serverMetrics.heapUsedMb} МБ
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Heap Total: {serverMetrics.heapTotalMb} МБ • RSS: {serverMetrics.rssMb} МБ
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Ошибки системы
                </span>
                <span
                  className={
                    serverMetrics.totalErrorsCount > 0
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400 font-bold'
                  }
                >
                  {serverMetrics.totalErrorsCount > 0
                    ? `${serverMetrics.totalErrorsCount} зафиксировано`
                    : '0 критических'}
                </span>
              </div>
              <div className="text-xl font-black text-white font-mono">
                {serverMetrics.totalErrorsCount} инцидентов
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Rate Limit: {serverMetrics.rateLimitRequests} запросов
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" /> Live WebSocket
                </span>
                <span className="text-emerald-400 font-bold">Активен</span>
              </div>
              <div className="text-xl font-black text-cyan-300 font-mono">
                {serverMetrics.wsActiveSockets} сессии
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Телеметрия 1 Гц • Голосовой мост Gemini
              </div>
            </div>
          </div>

          {/* REAL-TIME PORTS AND NETWORK INTERFACES TABLE */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <span>Занятые сетевые порты и слушатели сервисов в режиме реального времени</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Среда: Linux-x64 (Node.js 22)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                    <th className="py-2.5 px-3">Порт</th>
                    <th className="py-2.5 px-3">Протокол</th>
                    <th className="py-2.5 px-3">Хост / Привязка</th>
                    <th className="py-2.5 px-3">Статус</th>
                    <th className="py-2.5 px-3">Назначение сервиса</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-cyan-300">3000</td>
                    <td className="py-2.5 px-3 text-slate-300">HTTP / 1.1</td>
                    <td className="py-2.5 px-3 text-slate-300">0.0.0.0</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      LISTEN (ACTIVE)
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      Web-портал КОСМОПОРТ, Vite SPA Middleware, Express REST API
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-cyan-300">3000 /ws</td>
                    <td className="py-2.5 px-3 text-slate-300">WSS / WebSocket</td>
                    <td className="py-2.5 px-3 text-slate-300">0.0.0.0</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      ESTABLISHED
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      Шлюз реального времени голосового AI «Кубик» и телеметрии
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-purple-300">437</td>
                    <td className="py-2.5 px-3 text-slate-300">AX.25 VIRTUAL</td>
                    <td className="py-2.5 px-3 text-slate-300">127.0.0.1</td>
                    <td className="py-2.5 px-3 text-indigo-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      BROADCAST (1 Hz)
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-sans">
                      Частота радиомаяка 437.425 МГц (Space-Pi & Сеть СОНИКС)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* DETAILED MEMORY AND ERROR BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Memory Meters */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span>Детализация оперативной памяти V8 Heap</span>
                </h3>
                <button
                  type="button"
                  onClick={handleTriggerGc}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-bold transition-all cursor-pointer"
                  title="Оптимизировать память и сбросить временные буферы"
                >
                  Очистить память (GC)
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">
                      V8 Heap Used: {serverMetrics.heapUsedMb} МБ
                    </span>
                    <span className="text-purple-300 font-bold">
                      {serverMetrics.percentHeapUsed}% от пула
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, serverMetrics.percentHeapUsed)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Heap Total</span>
                    <span className="font-bold text-white">{serverMetrics.heapTotalMb} МБ</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Resident (RSS)</span>
                    <span className="font-bold text-white">{serverMetrics.rssMb} МБ</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">External / C++</span>
                    <span className="font-bold text-white">{serverMetrics.externalMb} МБ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Tracker & Incident Log */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Журнал сетевых ошибок и статус-кодов (4xx / 5xx)</span>
                </h3>
                <button
                  type="button"
                  onClick={handleTriggerTestError}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
                >
                  Симуляция ошибки
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {errorsList.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold">
                        [{err.status === 200 ? 'LOG/INFO' : `HTTP ${err.status}`}]
                      </span>
                      <span className="text-[10px] text-slate-400">{err.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">{err.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM EVENT LOGS (FULL AUDIT & SUBSYSTEM LOGS) */}
      {/* ========================================================================= */}
      {activeAdminTab === 'logs' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>Журнал системных событий и аудита платформы</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Всего событий в буфере: {logsList.length} • Отобрано фильтрами:{' '}
                  {filteredLogs.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddTestLog}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  + Тестовая запись
                </button>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Очистить
                </button>
              </div>
            </div>

            {/* Filters bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Поиск по тексту события..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <select
                  value={logFilterLevel}
                  onChange={(e) => setLogFilterLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="all">Все уровни важности</option>
                  <option value="info">INFO • Информационные</option>
                  <option value="warn">WARN • Предупреждения</option>
                  <option value="error">ERROR • Ошибки</option>
                  <option value="audit">AUDIT • Действия администратора</option>
                </select>
              </div>

              <div>
                <select
                  value={logFilterSubsystem}
                  onChange={(e) => setLogFilterSubsystem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="all">Все подсистемы</option>
                  <option value="STAGE_CTRL">[STAGE_CTRL] Пульт управления сценой</option>
                  <option value="CRM">[CRM] Реестр команд и кейсов</option>
                  <option value="TELEMETRY">[TELEMETRY] Радиолиния AX.25</option>
                  <option value="JURY">[JURY] Экспертное голосование</option>
                  <option value="SYS">[SYS] Ядро сервера Node.js</option>
                  <option value="AUTH">[AUTH] Безопасность и вход</option>
                </select>
              </div>
            </div>

            {/* Logs List Container */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1 font-mono text-xs">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    События не найдены по заданным критериям
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const levelColors: Record<string, string> = {
                      info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
                      warn: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                      error: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
                      audit: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
                    };
                    return (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl hover:bg-slate-900/60 flex items-start gap-3"
                      >
                        <span className="text-[10px] text-slate-500 shrink-0 pt-0.5">
                          {log.timestamp}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${
                            levelColors[log.level] || levelColors.info
                          }`}
                        >
                          {log.level}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 shrink-0">
                          [{log.subsystem}]
                        </span>
                        <span className="text-slate-200 font-sans text-xs flex-1 break-words">
                          {log.message}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REPORTS & ANALYTICS */}
      {/* ========================================================================= */}
      {activeAdminTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-mono">Охват команд и участников</span>
              <div className="text-3xl font-black text-white">{allTeams.length} экипажей</div>
              <p className="text-xs text-emerald-400">
                40 участников (10 педагогов, 30 школьников)
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-mono">
                Средний индекс освоенного объема (SPI)
              </span>
              <div className="text-3xl font-black text-cyan-400">1.08</div>
              <p className="text-xs text-slate-300">Опережение планового графика на 8%</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-mono">Банк физических кейсов</span>
              <div className="text-3xl font-black text-purple-400">500 задач</div>
              <p className="text-xs text-slate-300">Верифицировано МАОУ ДПО «ЦРСО»</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONFIGURATION & PROGRAMMING */}
      {/* ========================================================================= */}
      {activeAdminTab === 'config' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Параметры программирования и конфигурации портала</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">
                    Google Gemini 3.8 Flash Live Audio
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Двусторонний голосовой диалог с штурманом Кубиком
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={featureFlags.geminiLiveAudio}
                  onChange={(e) =>
                    setFeatureFlags({ ...featureFlags, geminiLiveAudio: e.target.checked })
                  }
                  className="toggle toggle-primary"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">
                    Радиомаяк AX.25 (437.425 МГц)
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Генерация телеметрических пакетов CubeSat 3U с частотой 1 Гц
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={featureFlags.telemetryBroadcastEnabled}
                  onChange={(e) =>
                    setFeatureFlags({
                      ...featureFlags,
                      telemetryBroadcastEnabled: e.target.checked,
                    })
                  }
                  className="toggle toggle-primary"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">Оффлайн-кэш PWA</strong>
                  <span className="text-[11px] text-slate-400">
                    Кэширование для автономной работы в экранированных залах
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={featureFlags.offlinePwaCache}
                  onChange={(e) =>
                    setFeatureFlags({ ...featureFlags, offlinePwaCache: e.target.checked })
                  }
                  className="toggle toggle-primary"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-white text-xs block">Звуковые сигналы ЦУП</strong>
                  <span className="text-[11px] text-slate-400">
                    Аудиоэффекты подтверждения действий и алертов
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={featureFlags.soundEffectsEnabled}
                  onChange={(e) =>
                    setFeatureFlags({ ...featureFlags, soundEffectsEnabled: e.target.checked })
                  }
                  className="toggle toggle-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REGISTRATIONS */}
      {/* ========================================================================= */}
      {activeAdminTab === 'registrations' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Реестр экипажей и ручная модерация участников</span>
            </h3>

            {regSuccessBanner && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{regSuccessBanner}</span>
              </div>
            )}

            <form onSubmit={handleManualRegister} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="ФИО школьника"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="email"
                placeholder="Email участника"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="physicist">Физик-исследователь</option>
                <option value="engineer">Инженер-конструктор CubeSat</option>
                <option value="biologist">Биолог / Эколог</option>
                <option value="captain">Капитан экипажа</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Зарегистрировать в экипаж
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ROLES */}
      {/* ========================================================================= */}
      {activeAdminTab === 'roles' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
          <RoleManagementTab currentUserRole={currentUser.role} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: IMPERSONATION (ENTER AS TEAM CAPTAIN) */}
      {/* ========================================================================= */}
      {activeAdminTab === 'impersonate' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Вход под пользователем капитана космического корабля</span>
              </h3>
              <p className="text-xs text-slate-400">
                Позволяет администратору или организатору увидеть точь-в-точь интерфейс пульта
                выбранного корабля и проверить слайды
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allTeams.map((team) => (
              <div
                key={team.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div>
                  <div className="font-bold text-sm text-white">{team.shipName}</div>
                  <div className="text-xs text-cyan-300 font-mono">{team.shipCallsign}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{team.school}</div>
                </div>

                <div className="text-xs text-slate-300">
                  Капитан: <strong>{team.mentorName}</strong> ({team.mentorEmail})
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const captainProfile: UserProfile = {
                      id: `mentor-${team.id}`,
                      name: team.mentorName,
                      email: team.mentorEmail,
                      role: 'mentor',
                      school: team.school,
                      city: team.city,
                      photoConsent: true,
                      rankTitle: 'Капитан космического аппарата',
                      xp: 1200,
                      level: 5,
                      energyCrystals: 45,
                      streakDays: 4,
                      badges: ['captain', 'pilot'],
                      socialPosts: [],
                      avatarUrl:
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
                    };
                    onImpersonateUser(captainProfile, team.id);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Войти под капитаном этого корабля</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: DATABASE & FACTORY RESET */}
      {/* ========================================================================= */}
      {activeAdminTab === 'database' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Обслуживание данных и резервное копирование</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <strong className="text-white text-xs block">Резервная копия (JSON)</strong>
              <p className="text-[11px] text-slate-400">
                Экспорт всех зарегистрированных команд, решений, логов и системного состояния.
              </p>
              <button
                type="button"
                onClick={handleExportDatabaseDump}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Скачать JSON-дамп
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/30 space-y-2">
              <strong className="text-rose-400 text-xs block">
                Сброс к исходному заводскому состоянию
              </strong>
              <p className="text-[11px] text-slate-400">
                Очищает локальное хранилище браузера и перезагружает платформу с дефолтными 10
                командами.
              </p>
              <button
                type="button"
                onClick={onResetFactoryState}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Сброс до заводского состояния
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
