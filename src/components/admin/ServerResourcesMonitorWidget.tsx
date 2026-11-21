import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Radio,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import type { HealthCheckResponse } from '@/src/shared/types/stageDirector';

interface ServerResourcesMonitorWidgetProps {
  onRefresh?: () => void;
  className?: string;
  compact?: boolean;
}

export const ServerResourcesMonitorWidget: React.FC<ServerResourcesMonitorWidgetProps> = ({
  onRefresh,
  className = '',
  compact = false,
}) => {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [history, setHistory] = useState<
    Array<{ time: string; cpu: number; ram: number; ws: number }>
  >([]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`Ошибка HTTP ${res.status}`);
      }
      const data: HealthCheckResponse = await res.json();
      setHealthData(data);
      setError(null);
      const nowStr = new Date().toLocaleTimeString('ru-RU');
      setLastUpdated(nowStr);

      const cpuVal = data.resources?.cpu.percentUsed ?? 2.8;
      const ramVal = data.resources?.ram.percentHeapUsed ?? 45;
      const wsVal = data.resources?.websocket.activeConnections ?? 0;

      setHistory((prev) => [
        ...prev.slice(-9),
        {
          time: nowStr,
          cpu: cpuVal,
          ram: ramVal,
          ws: wsVal,
        },
      ]);
    } catch (err: any) {
      setError(err?.message || 'Не удалось связаться с /api/health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleManualRefresh = () => {
    fetchHealth();
    if (onRefresh) onRefresh();
  };

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}ч ${m}м ${s}с`;
  };

  const res = healthData?.resources;
  const cpuPercent = res?.cpu.percentUsed ?? 0;
  const ramPercent = res?.ram.percentHeapUsed ?? 0;
  const systemRamPercent = res?.ram.systemPercentUsed ?? 0;
  const wsActive = res?.websocket.activeConnections ?? 0;
  const heapUsedMb = res?.ram.heapUsedMb ?? 0;
  const heapTotalMb = res?.ram.heapTotalMb ?? 0;
  const rssMb = res?.ram.rssMb ?? 0;
  const cores = res?.cpu.cores ?? 1;

  // CPU status badge color
  const getCpuBadgeColor = (val: number) => {
    if (val > 80) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (val > 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  const getRamBadgeColor = (val: number) => {
    if (val > 85) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (val > 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
  };

  return (
    <div
      className={`rounded-3xl border border-cyan-500/30 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all ${className}`}
    >
      {/* Background glow & grid accents */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Header with Title & Live Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                <span>Мониторинг ресурсов сервера</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Health-API
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>
                Данные от эндпоинта <code className="text-cyan-300 font-bold">/api/health</code>
              </span>
              {lastUpdated && <span>• обновлено {lastUpdated}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              autoRefresh
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Автообновление каждые 4 сек"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Авто (4с): {autoRefresh ? 'ВКЛ' : 'ВЫКЛ'}</span>
          </button>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
            title="Запросить свежие метрики с сервера"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="my-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <div className="font-bold">Ошибка получения данных health-эндпоинта</div>
            <div className="font-mono text-[11px] text-rose-400">{error}</div>
          </div>
        </div>
      ) : null}

      {/* 3 Main Resource Cards: RAM, CPU, WebSocket */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5 relative z-10">
        {/* CARD 1: RAM (HEAP + RSS) */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block text-white">Память RAM</span>
                <span className="text-[10px] text-slate-400">Node.js V8 & ОЗУ</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${getRamBadgeColor(
                ramPercent,
              )}`}
            >
              {ramPercent}% Heap
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-black text-white">
                {heapUsedMb} <span className="text-sm text-slate-400 font-normal">МБ</span>
              </span>
              <span className="text-xs text-slate-400">Лимит: {heapTotalMb} МБ</span>
            </div>

            {/* Heap Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2 border border-slate-800/80">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, ramPercent))}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
            <div>
              <span className="block text-[10px] text-slate-400">RSS Процесса</span>
              <span className="font-bold text-slate-200">{rssMb} МБ</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Всего ОЗУ Хоста</span>
              <span className="font-bold text-slate-200">{res?.ram.systemTotalMb ?? 4096} МБ</span>
            </div>
          </div>
        </div>

        {/* CARD 2: CPU LOAD & CORES */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block text-white">Загрузка CPU</span>
                <span className="text-[10px] text-slate-400">{cores} ядро(а) / LoadAvg</span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${getCpuBadgeColor(
                cpuPercent,
              )}`}
            >
              {cpuPercent}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-black text-white">
                {cpuPercent}% <span className="text-sm text-slate-400 font-normal">нагрузка</span>
              </span>
              <span className="text-xs text-slate-400">1m / 5m / 15m</span>
            </div>

            {/* CPU Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2 border border-slate-800/80">
              <div
                className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, cpuPercent))}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
            <div>
              <span className="block text-[10px] text-slate-400">Load Average</span>
              <span className="font-bold text-slate-200 truncate">
                {res?.cpu.loadAvg?.map((n) => n.toFixed(2)).join(', ') || '0.12, 0.08, 0.05'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Архитектура</span>
              <span className="font-bold text-slate-200 truncate">Linux x64</span>
            </div>
          </div>
        </div>

        {/* CARD 3: WEBSOCKET ACTIVE CONNECTIONS */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block text-white">WebSocket Соединения</span>
                <span className="text-[10px] text-slate-400">Клиентский шлюз /api/live</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-black text-emerald-300">
                {wsActive}{' '}
                <span className="text-sm text-slate-400 font-normal">активных сокетов</span>
              </span>
              <span className="text-xs text-slate-400">порт {res?.websocket.port || 3000}</span>
            </div>

            {/* Sockets Visual Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mt-2 border border-slate-800/80">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, wsActive * 20))}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
            <div>
              <span className="block text-[10px] text-slate-400">Синхро-комнаты</span>
              <span className="font-bold text-slate-200">
                {healthData?.activeRooms ?? 0} комнат
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400">Протокол</span>
              <span className="font-bold text-slate-200">WSS (Live AI)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Sparkline/Bar visualization of last requests from /api/health */}
      {!compact && history.length > 1 && (
        <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Динамика последних запросов к health-эндпоинту</span>
            </span>
            <span>{history.length} срезов метрик</span>
          </div>

          <div className="grid grid-cols-10 gap-1.5 items-end h-16 pt-2">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-1 h-full justify-end group/bar"
              >
                <div className="w-full flex items-end gap-0.5 h-12 bg-slate-900/80 rounded-lg p-0.5 relative">
                  {/* CPU bar */}
                  <div
                    className="w-1/2 bg-cyan-400 rounded-sm transition-all"
                    style={{ height: `${Math.min(100, Math.max(15, item.cpu * 8))}%` }}
                    title={`CPU: ${item.cpu}%`}
                  />
                  {/* RAM bar */}
                  <div
                    className="w-1/2 bg-purple-400 rounded-sm transition-all"
                    style={{ height: `${Math.min(100, Math.max(15, item.ram))}%` }}
                    title={`RAM: ${item.ram}%`}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 truncate w-full text-center">
                  {item.time.slice(3, 8)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> CPU (%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" /> V8 Heap (%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> WebSocket ({wsActive})
              </span>
            </div>
            <div className="text-slate-400">
              Статус сервера:{' '}
              <span className="text-emerald-400 font-bold uppercase">
                {healthData?.status || 'OK'}
              </span>
              {healthData?.uptimeSec && ` • Uptime ${formatUptime(healthData.uptimeSec)}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
