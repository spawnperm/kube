import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radio,
  Activity,
  Compass,
  Battery,
  Thermometer,
  Code,
  Copy,
  Check,
  Play,
  Pause,
  Globe,
  Wifi,
  Terminal,
  Box,
  Layers,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { TelemetryPacket } from '../../types';
import { GROUND_STATIONS, generateOrbitGroundTrack } from '../../services/telemetrySimulator';
import { CubeSat3DViewer } from '../CubeSat3DViewer';
import { CubeSatFlightTimeline } from '../CubeSatFlightTimeline';
import { CubeSat3DOrbitVisualizer } from '../telemetry/CubeSat3DOrbitVisualizer';
import { CubeSatTelemetryCharts } from '../telemetry/CubeSatTelemetryCharts';

interface TelemetryTabProps {
  telemetry: TelemetryPacket;
  simSpeed: number;
  isPaused: boolean;
  onSetSimSpeed: (speed: number) => void;
  onTogglePause: () => void;
  onForceEvent: (mode: 'NORMAL' | 'ECLIPSE' | 'DETUMBLING' | 'TRANSMITTING') => void;
}

export const TelemetryTab: React.FC<TelemetryTabProps> = ({
  telemetry,
  simSpeed,
  isPaused,
  onSetSimSpeed,
  onTogglePause,
  onForceEvent,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'hud' | 'charts' | 'timeline' | 'api'>('hud');
  const [visualMode, setVisualMode] = useState<'orbit3d' | '3d' | '2d' | 'split'>('orbit3d');
  const [copiedCode, setCopiedCode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Precomputed orbit track
  const groundTrack = useMemo(() => generateOrbitGroundTrack(72), []);

  // Draw 2D orbital map on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background deep space ocean
    ctx.fillStyle = '#060d1b';
    ctx.fillRect(0, 0, width, height);

    // Latitude & Longitude grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    // Meridians
    for (let x = 0; x <= width; x += width / 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Parallels
    for (let y = 0; y <= height; y += height / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Equator highlight
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Helper functions: lat/lon to canvas X/Y (Equirectangular)
    const toCanvasX = (lon: number) => ((lon + 180) / 360) * width;
    const toCanvasY = (lat: number) => ((90 - lat) / 180) * height;

    // Simplified continents landmass polygons
    ctx.fillStyle = '#0f172a';
    // Eurasia / Africa simplified polygon
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-10), toCanvasY(36));
    ctx.lineTo(toCanvasX(40), toCanvasY(35));
    ctx.lineTo(toCanvasX(80), toCanvasY(70));
    ctx.lineTo(toCanvasX(160), toCanvasY(65));
    ctx.lineTo(toCanvasX(140), toCanvasY(35));
    ctx.lineTo(toCanvasX(100), toCanvasY(15));
    ctx.lineTo(toCanvasX(50), toCanvasY(12));
    ctx.lineTo(toCanvasX(50), toCanvasY(-30));
    ctx.lineTo(toCanvasX(20), toCanvasY(-34));
    ctx.lineTo(toCanvasX(-15), toCanvasY(12));
    ctx.closePath();
    ctx.fill();

    // Americas simplified polygon
    ctx.beginPath();
    ctx.moveTo(toCanvasX(-125), toCanvasY(50));
    ctx.lineTo(toCanvasX(-70), toCanvasY(55));
    ctx.lineTo(toCanvasX(-75), toCanvasY(25));
    ctx.lineTo(toCanvasX(-35), toCanvasY(-5));
    ctx.lineTo(toCanvasX(-70), toCanvasY(-50));
    ctx.lineTo(toCanvasX(-80), toCanvasY(10));
    ctx.lineTo(toCanvasX(-120), toCanvasY(30));
    ctx.closePath();
    ctx.fill();

    // Orbit ground track path
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    groundTrack.forEach((pt, idx) => {
      const cx = toCanvasX(pt.lon);
      const cy = toCanvasY(pt.lat);
      if (idx === 0) ctx.moveTo(cx, cy);
      else {
        // Handle wrap-around meridian
        const prev = groundTrack[idx - 1];
        if (Math.abs(pt.lon - prev.lon) < 180) {
          ctx.lineTo(cx, cy);
        } else {
          ctx.moveTo(cx, cy);
        }
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Ground Stations
    GROUND_STATIONS.forEach((gs) => {
      const gx = toCanvasX(gs.lon);
      const gy = toCanvasY(gs.lat);

      // Station icon dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Station name label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(gs.name.split(' ')[0], gx + 6, gy + 3);
    });

    // Satellite current position (SSP)
    const satX = toCanvasX(telemetry.longitude);
    const satY = toCanvasY(telemetry.latitude);

    // Radio Footprint Circle (~1400 km radius converted to pixels)
    const footprintRadiusPx = (1400 / (40000 / 360)) * (width / 360);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(satX, satY, footprintRadiusPx, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Satellite marker
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(satX, satY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crosshair target
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(satX - 12, satY);
    ctx.lineTo(satX + 12, satY);
    ctx.moveTo(satX, satY - 12);
    ctx.lineTo(satX, satY + 12);
    ctx.stroke();

    // Satellite label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('ORION-3 [3U]', satX + 10, satY - 8);
  }, [telemetry, groundTrack]);

  const copyApiCurl = () => {
    navigator.clipboard.writeText(
      `curl -X GET "https://mirovizor.space/api/cubesat/v1/telemetry" \\\n  -H "Accept: application/json" \\\n  -H "X-Satellite-Callsign: RS42S"`,
    );
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with HUD Controls */}
      <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/90 p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Мониторинг орбитальной телеметрии</h1>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                LIVE TELEMETRY STREAM
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Позывной борта: <strong className="text-cyan-400 font-mono">RS42S (ORION-3)</strong> •
              Частота Downlink: <strong className="text-slate-200 font-mono">437.425 МГц</strong>
            </p>
          </div>
        </div>

        {/* Simulation Ticker Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              isPaused
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? 'Возобновить' : 'Пауза'}</span>
          </button>

          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            {[1, 5, 20].map((s) => (
              <button
                key={s}
                onClick={() => onSetSimSpeed(s)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  simSpeed === s
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Mode Override Buttons */}
          <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => onForceEvent('NORMAL')}
              className="px-2 py-1 rounded text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Свет
            </button>
            <button
              onClick={() => onForceEvent('ECLIPSE')}
              className="px-2 py-1 rounded text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Тень
            </button>
            <button
              onClick={() => onForceEvent('DETUMBLING')}
              className="px-2 py-1 rounded text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Detumble
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs: HUD vs Timeline vs API Documentation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('hud')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'hud'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Бортовой пульт управления (HUD)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('charts')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'charts'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Графики телеметрии (Recharts)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
            Live Stream
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'timeline'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Хронология полета & Временная шкала (Timeline)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('api')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeSubTab === 'api'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          <span>Интеграция с API телеметрии & REST / WS</span>
        </button>
      </div>

      {activeSubTab === 'hud' ? (
        <div className="space-y-6">
          {/* Visual Mode Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 pl-1">Режим визуализации:</span>
              <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setVisualMode('orbit3d')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    visualMode === 'orbit3d'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>3D Орбита Земли</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 font-mono">
                    WebGL / Three.js
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisualMode('3d')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    visualMode === '3d'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="h-3.5 w-3.5" />
                  <span>3D Аппарат CubeSat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisualMode('2d')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    visualMode === '2d'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>2D Карта трассы</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisualMode('split')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    visualMode === 'split'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>3D Орбита + Аппарат (Сплит)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>
                Спутник: <strong className="text-white">ORION-3 (3U)</strong>
              </span>
              <span>•</span>
              <span>Кадр #{telemetry.packetsDownlinked}</span>
            </div>
          </div>

          {/* 3D / 2D Visual Containers */}
          {visualMode === 'orbit3d' && (
            <CubeSat3DOrbitVisualizer telemetry={telemetry} isPaused={isPaused} />
          )}

          {visualMode === '3d' && <CubeSat3DViewer telemetry={telemetry} isPaused={isPaused} />}

          {visualMode === '2d' && (
            /* Real-time 2D Orbit Canvas Ground Track */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  <span className="font-bold text-white">
                    Орбитальный трекер & Зона радиовидимости наземных станций
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                  <span>
                    Широта: <strong className="text-cyan-300">{telemetry.latitude}°</strong>
                  </span>
                  <span>
                    Долгота: <strong className="text-cyan-300">{telemetry.longitude}°</strong>
                  </span>
                  <span>
                    Высота: <strong className="text-cyan-300">{telemetry.altitudeKm} км</strong>
                  </span>
                </div>
              </div>

              {/* Canvas */}
              <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <canvas
                  ref={canvasRef}
                  width={860}
                  height={400}
                  className="w-full h-[260px] sm:h-[340px] object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded text-[10px] text-slate-400 border border-slate-800 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" /> КубСат
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" /> Наземная
                    станция
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-cyan-400/30 border border-cyan-400 inline-block" />{' '}
                    Зона радиовидимости (1400 км)
                  </span>
                </div>
              </div>
            </div>
          )}

          {visualMode === 'split' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <CubeSat3DOrbitVisualizer telemetry={telemetry} isPaused={isPaused} />
              </div>
              <div>
                <CubeSat3DViewer telemetry={telemetry} isPaused={isPaused} />
              </div>
            </div>
          )}

          {/* Subsystems Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Power & Battery */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Battery className="h-4 w-4 text-emerald-400" />
                  <span>Шина питания (EPS)</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">
                  {telemetry.batterySocPercent}%
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Напряжение АКБ:</span>
                  <span className="text-white font-bold">{telemetry.batteryVoltage} В</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Генерация СБ:</span>
                  <span className="text-amber-300 font-bold">{telemetry.solarPowerW} Вт</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ток заряда СБ:</span>
                  <span className="text-slate-200">{telemetry.solarCurrentMa} мА</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Температура АКБ:</span>
                  <span className="text-sky-300">+{telemetry.batteryTempC} °C</span>
                </div>
              </div>
            </div>

            {/* 2. Attitude & Detumbling */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Compass className="h-4 w-4 text-cyan-400" />
                  <span>Ориентация (ADCS)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVisualMode('3d')}
                  className="font-mono text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-1 cursor-pointer underline"
                >
                  3D вид
                </button>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                {telemetry.orientation ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Крен (Roll / X):</span>
                      <span className="text-red-300 font-bold">
                        {telemetry.orientation.roll > 0
                          ? `+${telemetry.orientation.roll}`
                          : telemetry.orientation.roll}
                        °
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Тангаж (Pitch / Y):</span>
                      <span className="text-emerald-300 font-bold">
                        {telemetry.orientation.pitch > 0
                          ? `+${telemetry.orientation.pitch}`
                          : telemetry.orientation.pitch}
                        °
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Рыскание (Yaw / Z):</span>
                      <span className="text-sky-300 font-bold">{telemetry.orientation.yaw}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Угл. скорость |ω|:</span>
                      <span className="text-white font-bold">
                        {telemetry.orientation.angularVelocity} °/с
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Угл. скорость ω_X:</span>
                      <span className="text-white font-bold">{telemetry.gyroRates[0]} °/с</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Угл. скорость ω_Y:</span>
                      <span className="text-white font-bold">{telemetry.gyroRates[1]} °/с</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Угл. скорость ω_Z:</span>
                      <span className="text-white font-bold">{telemetry.gyroRates[2]} °/с</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Статус стабилизации:</span>
                      <span className="text-emerald-400">Демпфирование OK</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3. Thermal Subsystem */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Thermometer className="h-4 w-4 text-rose-400" />
                  <span>Термобаланс (TCS)</span>
                </div>
                <span className="font-mono text-slate-400 text-[10px]">ГОСТ 25645</span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Панель +X (GaAs):</span>
                  <span className="text-amber-300 font-bold">{telemetry.solarPanelTempC} °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Процессор OBC:</span>
                  <span className="text-emerald-300 font-bold">+{telemetry.obcTempC} °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Детектор SiPM:</span>
                  <span className="text-sky-300 font-bold">+16.4 °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Терморегулятор:</span>
                  <span className="text-emerald-400">ШИМ подогрев ВЫКЛ</span>
                </div>
              </div>
            </div>

            {/* 4. Radio & Downlink */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Wifi className="h-4 w-4 text-purple-400" />
                  <span>Радиоканал (COMMS)</span>
                </div>
                <span className="font-mono text-purple-300 font-bold">
                  {telemetry.radioRssiDb} dBm
                </span>
              </div>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Скорость канала:</span>
                  <span className="text-white font-bold">{telemetry.downlinkSpeedKbps} кбит/с</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Модуляция:</span>
                  <span className="text-slate-200">2-FSK / AX.25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Принято пакетов:</span>
                  <span className="text-cyan-300 font-bold">#{telemetry.packetsDownlinked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ошибки BER:</span>
                  <span className="text-emerald-400">&lt; 10⁻⁷</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive 3D/2D Orbit & Telemetry Parameter Charts (Recharts) */}
          <CubeSatTelemetryCharts currentTelemetry={telemetry} isPaused={isPaused} />

          {/* Mission Flight Events Timeline */}
          <CubeSatFlightTimeline telemetry={telemetry} onForceEvent={onForceEvent} />

          {/* Raw AX.25 Packet Terminal */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-850">
              <div className="flex items-center gap-2 text-slate-400">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span>AX.25 RAW TELEMETRY FRAME STREAM</span>
              </div>
              <span className="text-[10px] text-slate-500">CRC-16 OK • {telemetry.timestamp}</span>
            </div>
            <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-cyan-400 overflow-x-auto">
              <code>{telemetry.rawHex}</code>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'charts' ? (
        /* Dedicated Full-Screen Interactive Telemetry Charts (Recharts) */
        <div className="space-y-6">
          <CubeSatTelemetryCharts currentTelemetry={telemetry} isPaused={isPaused} />
          <CubeSatFlightTimeline telemetry={telemetry} onForceEvent={onForceEvent} />
        </div>
      ) : activeSubTab === 'timeline' ? (
        /* Dedicated Full Flight Timeline & Mission Operations View */
        <div className="space-y-6">
          <CubeSatFlightTimeline telemetry={telemetry} onForceEvent={onForceEvent} />
        </div>
      ) : (
        /* API Integration & REST / WebSocket Explorer */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-6 text-xs">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Интеграция с API телеметрии (макет)
                </h3>
                <p className="text-slate-400 mt-1">
                  Планируемый контракт для подключения скриптов Python, SDR-приемников и внешних
                  дашбордов. Реальный REST API и WebSocket пока не развёрнуты — ниже приведён
                  демонстрационный формат ответа на основе смоделированной телеметрии.
                </p>
              </div>

              <button
                onClick={copyApiCurl}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-500/20 px-3 py-1.5 font-semibold text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 transition-all"
              >
                {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCode ? 'Скопировано!' : 'Копировать cURL'}</span>
              </button>
            </div>
          </div>

          {/* Endpoints specification */}
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  GET
                </span>
                <code className="text-white font-mono">
                  https://mirovizor.space/api/cubesat/v1/telemetry
                </code>
              </div>
              <p className="mt-2 text-slate-400 text-[11px]">
                Возвращает последний актуальный телеметрический кадр КубСата: кеплеровские
                параметры, координаты подспутниковой точки, токи и напряжения шин питания.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center gap-2">
                <span className="rounded bg-purple-500/20 px-2 py-0.5 font-mono text-xs font-bold text-purple-400 border border-purple-500/30">
                  WSS
                </span>
                <code className="text-white font-mono">
                  wss://mirovizor.space/api/cubesat/v1/stream
                </code>
              </div>
              <p className="mt-2 text-slate-400 text-[11px]">
                Потоковое WebSocket-соединение с частотой 1 Гц для построения траекторий в реальном
                времени.
              </p>
            </div>
          </div>

          {/* Live JSON Payload Viewer */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200">
                Текущий ответ API (Live JSON Payload):
              </span>
              <span className="font-mono text-[10px] text-cyan-400">
                Content-Type: application/json
              </span>
            </div>
            <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-cyan-300 max-h-80 overflow-y-auto">
              {JSON.stringify(
                {
                  satellite: telemetry.satelliteName,
                  epoch: telemetry.epoch,
                  orbit: {
                    altitude_km: telemetry.altitudeKm,
                    velocity_kms: telemetry.velocityKms,
                    sub_satellite_point: {
                      latitude: telemetry.latitude,
                      longitude: telemetry.longitude,
                    },
                  },
                  power_subsystem: {
                    bus_voltage_v: telemetry.batteryVoltage,
                    battery_soc_percent: telemetry.batterySocPercent,
                    solar_power_w: telemetry.solarPowerW,
                    solar_current_ma: telemetry.solarCurrentMa,
                  },
                  temperatures_c: {
                    obc: telemetry.obcTempC,
                    battery: telemetry.batteryTempC,
                    solar_panel: telemetry.solarPanelTempC,
                  },
                  comms: {
                    frequency_mhz: 437.425,
                    mode: telemetry.mode,
                    rssi_dbm: telemetry.radioRssiDb,
                    ax25_frame_hex: telemetry.rawHex,
                  },
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
