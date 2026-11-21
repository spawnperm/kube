/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Orbit,
  Zap,
  Thermometer,
  Compass,
  Clock,
  Download,
  RotateCcw,
  Maximize2,
  TrendingUp,
  AlertTriangle,
  Radio,
  Sliders,
} from 'lucide-react';
import type { TelemetryPacket } from '../../types';

interface CubeSatTelemetryChartsProps {
  currentTelemetry: TelemetryPacket;
  isPaused?: boolean;
  className?: string;
}

export type TelemetryChartCategory = 'orbit' | 'eps' | 'thermal' | 'adcs';

interface HistoricalPoint {
  id: number;
  time: string;
  epoch: number;
  altitudeKm: number;
  velocityKms: number;
  batterySocPercent: number;
  batteryVoltage: number;
  solarPowerW: number;
  solarCurrentMa: number;
  solarPanelTempC: number;
  batteryTempC: number;
  obcTempC: number;
  angularVelocity: number;
  roll: number;
  pitch: number;
  yaw: number;
  radioRssiDb: number;
  mode: string;
}

export const CubeSatTelemetryCharts: React.FC<CubeSatTelemetryChartsProps> = ({
  currentTelemetry,
  isPaused = false,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<TelemetryChartCategory>('orbit');
  const [windowSize, setWindowSize] = useState<number>(30); // 30, 60, or 120 points
  const [chartStyle, setChartStyle] = useState<'area' | 'line'>('area');
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const pointCounterRef = useRef<number>(0);

  // Accumulate telemetry packets in historical buffer
  useEffect(() => {
    pointCounterRef.current += 1;
    const newPoint: HistoricalPoint = {
      id: pointCounterRef.current,
      time: currentTelemetry.timestamp || new Date().toLocaleTimeString('ru-RU'),
      epoch: currentTelemetry.epoch || Math.floor(Date.now() / 1000),
      altitudeKm: currentTelemetry.altitudeKm,
      velocityKms: currentTelemetry.velocityKms,
      batterySocPercent: currentTelemetry.batterySocPercent,
      batteryVoltage: currentTelemetry.batteryVoltage,
      solarPowerW: currentTelemetry.solarPowerW,
      solarCurrentMa: currentTelemetry.solarCurrentMa,
      solarPanelTempC: currentTelemetry.solarPanelTempC,
      batteryTempC: currentTelemetry.batteryTempC,
      obcTempC: currentTelemetry.obcTempC,
      angularVelocity:
        currentTelemetry.orientation?.angularVelocity ??
        Math.sqrt(
          (currentTelemetry.gyroRates?.[0] ?? 0) ** 2 +
            (currentTelemetry.gyroRates?.[1] ?? 0) ** 2 +
            (currentTelemetry.gyroRates?.[2] ?? 0) ** 2,
        ),
      roll: currentTelemetry.orientation?.roll ?? 0,
      pitch: currentTelemetry.orientation?.pitch ?? 0,
      yaw: currentTelemetry.orientation?.yaw ?? 0,
      radioRssiDb: currentTelemetry.radioRssiDb,
      mode: currentTelemetry.mode,
    };

    setHistory((prev) => {
      // Keep last 150 points in buffer
      const updated = [...prev, newPoint];
      if (updated.length > 150) {
        return updated.slice(updated.length - 150);
      }
      return updated;
    });
  }, [currentTelemetry]);

  // Sliced data based on selected window size
  const displayData = useMemo(() => {
    if (history.length <= windowSize) return history;
    return history.slice(history.length - windowSize);
  }, [history, windowSize]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (displayData.length === 0) {
      return {
        avgAlt: currentTelemetry.altitudeKm,
        avgVel: currentTelemetry.velocityKms,
        maxPower: currentTelemetry.solarPowerW,
        minVoltage: currentTelemetry.batteryVoltage,
      };
    }
    const alts = displayData.map((p) => p.altitudeKm);
    const vels = displayData.map((p) => p.velocityKms);
    const powers = displayData.map((p) => p.solarPowerW);
    const volts = displayData.map((p) => p.batteryVoltage);

    return {
      avgAlt: +(alts.reduce((a, b) => a + b, 0) / alts.length).toFixed(2),
      minAlt: Math.min(...alts).toFixed(1),
      maxAlt: Math.max(...alts).toFixed(1),
      avgVel: +(vels.reduce((a, b) => a + b, 0) / vels.length).toFixed(3),
      maxPower: Math.max(...powers).toFixed(1),
      minVoltage: Math.min(...volts).toFixed(2),
    };
  }, [displayData, currentTelemetry]);

  // Clear history
  const handleClearHistory = () => {
    setHistory([]);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (history.length === 0) return;
    const headers = [
      'ID',
      'Time',
      'Altitude_km',
      'Velocity_kms',
      'Battery_V',
      'Battery_SOC_pct',
      'SolarPower_W',
      'SolarTemp_C',
      'BatteryTemp_C',
      'ObcTemp_C',
      'AngularVelocity_degs',
      'Mode',
    ];
    const rows = history.map((p) =>
      [
        p.id,
        p.time,
        p.altitudeKm,
        p.velocityKms,
        p.batteryVoltage,
        p.batterySocPercent,
        p.solarPowerW,
        p.solarPanelTempC,
        p.batteryTempC,
        p.obcTempC,
        p.angularVelocity.toFixed(3),
        p.mode,
      ].join(','),
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cubesat_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/80 px-4 py-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/60 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide">
                Интерактивный 3D/2D телеметрический трекер параметров
              </span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                Recharts Live Stream
              </span>
              {!isPaused && (
                <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />1 Гц
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Потоковые динамические графики орбитальной высоты, тангенциальной скорости и бортовых
              систем
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          {/* Time window selector */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            {[30, 60, 120].map((pts) => (
              <button
                key={pts}
                type="button"
                onClick={() => setWindowSize(pts)}
                className={`rounded px-2 py-1 text-[10px] transition-colors cursor-pointer ${
                  windowSize === pts
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Показывать последние ${pts} секунд`}
              >
                {pts}с
              </button>
            ))}
          </div>

          {/* Style toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setChartStyle('area')}
              className={`rounded px-2 py-1 text-[10px] transition-colors cursor-pointer ${
                chartStyle === 'area'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Область
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('line')}
              className={`rounded px-2 py-1 text-[10px] transition-colors cursor-pointer ${
                chartStyle === 'line'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Линии
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            title="Экспортировать накопленную телеметрию в CSV"
          >
            <Download className="h-3 w-3 text-cyan-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-all cursor-pointer"
            title="Очистить буфер"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Category Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/40 px-4 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory('orbit')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
              activeCategory === 'orbit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            <span>Орбита (Высота & Скорость)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('eps')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
              activeCategory === 'eps'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Энергосистема (EPS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('thermal')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
              activeCategory === 'thermal'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Thermometer className="h-3.5 w-3.5" />
            <span>Термобаланс (TCS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('adcs')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-all cursor-pointer ${
              activeCategory === 'adcs'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Ориентация & Сигнал (ADCS/RF)</span>
          </button>
        </div>

        {/* Live metric summary pill */}
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
          {activeCategory === 'orbit' && (
            <>
              <div>
                H:{' '}
                <strong className="text-cyan-300">
                  {currentTelemetry.altitudeKm.toFixed(1)} км
                </strong>
              </div>
              <span>•</span>
              <div>
                V:{' '}
                <strong className="text-emerald-300">
                  {currentTelemetry.velocityKms.toFixed(3)} км/с
                </strong>
              </div>
            </>
          )}

          {activeCategory === 'eps' && (
            <>
              <div>
                СБ:{' '}
                <strong className="text-amber-300">
                  {currentTelemetry.solarPowerW.toFixed(1)} Вт
                </strong>
              </div>
              <span>•</span>
              <div>
                АКБ:{' '}
                <strong className="text-emerald-300">
                  {currentTelemetry.batteryVoltage.toFixed(2)} В
                </strong>
              </div>
              <span>•</span>
              <div>
                SOC:{' '}
                <strong className="text-cyan-300">{currentTelemetry.batterySocPercent}%</strong>
              </div>
            </>
          )}

          {activeCategory === 'thermal' && (
            <>
              <div>
                Панель:{' '}
                <strong className="text-amber-300">{currentTelemetry.solarPanelTempC} °C</strong>
              </div>
              <span>•</span>
              <div>
                АКБ: <strong className="text-sky-300">+{currentTelemetry.batteryTempC} °C</strong>
              </div>
              <span>•</span>
              <div>
                OBC: <strong className="text-emerald-300">+{currentTelemetry.obcTempC} °C</strong>
              </div>
            </>
          )}

          {activeCategory === 'adcs' && (
            <>
              <div>
                |ω|:{' '}
                <strong className="text-emerald-300">
                  {currentTelemetry.orientation?.angularVelocity?.toFixed(3) || '0.065'} °/с
                </strong>
              </div>
              <span>•</span>
              <div>
                RSSI:{' '}
                <strong className="text-purple-300">{currentTelemetry.radioRssiDb} dBm</strong>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Chart Rendering Container */}
      <div className="p-4 bg-slate-950/60">
        <div className="h-[280px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeCategory === 'orbit' ? (
              <ComposedChart data={displayData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="orbitAltGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="orbitVelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  domain={['dataMin - 2', 'dataMax + 2']}
                  stroke="#06b6d4"
                  tick={{ fontSize: 10, fill: '#06b6d4' }}
                  tickFormatter={(val) => `${val.toFixed(1)} км`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={['dataMin - 0.02', 'dataMax + 0.02']}
                  stroke="#10b981"
                  tick={{ fontSize: 10, fill: '#10b981' }}
                  tickFormatter={(val) => `${val.toFixed(3)} км/с`}
                />
                <Tooltip content={<CustomTelemetryTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(val) => (
                    <span className="text-slate-300 font-medium">
                      {val === 'altitudeKm'
                        ? 'Высота орбиты H (км)'
                        : 'Орбитальная скорость V (км/с)'}
                    </span>
                  )}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={524.8}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Номинал H: 524.8 км',
                    fill: '#38bdf8',
                    fontSize: 9,
                    position: 'insideBottomLeft',
                  }}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={7.61}
                  stroke="#34d399"
                  strokeDasharray="4 4"
                  label={{
                    value: '1-я космич. скорость V₀: 7.61 км/с',
                    fill: '#34d399',
                    fontSize: 9,
                    position: 'insideTopRight',
                  }}
                />
                {chartStyle === 'area' ? (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="altitudeKm"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#orbitAltGrad)"
                    isAnimationActive={false}
                  />
                ) : (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="altitudeKm"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="velocityKms"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            ) : activeCategory === 'eps' ? (
              <ComposedChart data={displayData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="epsPowerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 25]}
                  stroke="#f59e0b"
                  tick={{ fontSize: 10, fill: '#f59e0b' }}
                  tickFormatter={(val) => `${val} Вт`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[6.5, 9.5]}
                  stroke="#10b981"
                  tick={{ fontSize: 10, fill: '#10b981' }}
                  tickFormatter={(val) => `${val.toFixed(1)} В`}
                />
                <Tooltip content={<CustomTelemetryTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(val) => (
                    <span className="text-slate-300 font-medium">
                      {val === 'solarPowerW'
                        ? 'Мощность СБ (Вт)'
                        : val === 'batteryVoltage'
                          ? 'Напряжение АКБ (В)'
                          : 'Заряд АКБ (%)'}
                    </span>
                  )}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={7.4}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Критический порог АКБ: 7.4 В',
                    fill: '#ef4444',
                    fontSize: 9,
                    position: 'insideBottomRight',
                  }}
                />
                {chartStyle === 'area' ? (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="solarPowerW"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#epsPowerGrad)"
                    isAnimationActive={false}
                  />
                ) : (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="solarPowerW"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="batteryVoltage"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            ) : activeCategory === 'thermal' ? (
              <ComposedChart data={displayData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[-30, 60]}
                  stroke="#f43f5e"
                  tick={{ fontSize: 10, fill: '#f43f5e' }}
                  tickFormatter={(val) => `${val}°C`}
                />
                <Tooltip content={<CustomTelemetryTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(val) => (
                    <span className="text-slate-300 font-medium">
                      {val === 'solarPanelTempC'
                        ? 'Панели СБ GaAs (°C)'
                        : val === 'batteryTempC'
                          ? 'Блок АКБ (°C)'
                          : 'Процессор OBC (°C)'}
                    </span>
                  )}
                />
                <ReferenceLine
                  y={0}
                  stroke="#60a5fa"
                  strokeDasharray="2 2"
                  label={{ value: '0°C', fill: '#60a5fa', fontSize: 9 }}
                />
                <ReferenceLine
                  y={50}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{ value: 'Перегрев +50°C', fill: '#f43f5e', fontSize: 9 }}
                />
                <Line
                  type="monotone"
                  dataKey="solarPanelTempC"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="batteryTempC"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="obcTempC"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={displayData} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 4]}
                  stroke="#10b981"
                  tick={{ fontSize: 10, fill: '#10b981' }}
                  tickFormatter={(val) => `${val}°/с`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[-130, -70]}
                  stroke="#a855f7"
                  tick={{ fontSize: 10, fill: '#a855f7' }}
                  tickFormatter={(val) => `${val} dBm`}
                />
                <Tooltip content={<CustomTelemetryTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(val) => (
                    <span className="text-slate-300 font-medium">
                      {val === 'angularVelocity'
                        ? 'Угловая скорость |ω| (°/с)'
                        : 'Уровень сигнала RSSI (дБм)'}
                    </span>
                  )}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="angularVelocity"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="radioRssiDb"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Bottom Insight Footer */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Средняя высота:</span>
            <span className="font-bold text-cyan-300">{stats.avgAlt} км</span>
          </div>
          <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Средняя скорость:</span>
            <span className="font-bold text-emerald-300">{stats.avgVel} км/с</span>
          </div>
          <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Пиковая мощность СБ:</span>
            <span className="font-bold text-amber-300">{stats.maxPower} Вт</span>
          </div>
          <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Мин. напряжение АКБ:</span>
            <span className="font-bold text-sky-300">{stats.minVoltage} В</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Custom dark sci-fi tooltip for Recharts
 */
const CustomTelemetryTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data: HistoricalPoint = payload[0].payload;

  return (
    <div className="rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-xs font-mono text-slate-200 min-w-[210px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
        <span className="font-bold text-cyan-400">Кадр #{data.id}</span>
        <span className="text-[10px] text-slate-400">{label}</span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-400">Высота:</span>
          <span className="font-bold text-cyan-300">{data.altitudeKm} км</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Скорость:</span>
          <span className="font-bold text-emerald-300">{data.velocityKms} км/с</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">СБ генерация:</span>
          <span className="font-bold text-amber-300">{data.solarPowerW} Вт</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">АКБ напряжение:</span>
          <span className="font-bold text-white">
            {data.batteryVoltage} В ({data.batterySocPercent}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">T панели GaAs:</span>
          <span className="font-bold text-orange-300">{data.solarPanelTempC} °C</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">T процессора:</span>
          <span className="font-bold text-sky-300">+{data.obcTempC} °C</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Режим:</span>
          <span
            className={`font-bold ${
              data.mode === 'NORMAL'
                ? 'text-cyan-400'
                : data.mode === 'ECLIPSE'
                  ? 'text-amber-400'
                  : 'text-rose-400'
            }`}
          >
            {data.mode}
          </span>
        </div>
      </div>
    </div>
  );
};
