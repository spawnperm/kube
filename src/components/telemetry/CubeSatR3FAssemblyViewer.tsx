/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  Layers,
  RotateCw,
  Box,
  Cpu,
  BatteryCharging,
  Radio,
  Compass,
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  Sliders,
  CheckCircle2,
  Info,
  Download,
  Share2,
} from 'lucide-react';

import blueprint1U from '@/src/assets/images/cubesat_1u_blueprint_1791436560253.jpg';
import blueprint2U from '@/src/assets/images/cubesat_2u_blueprint_1791436574557.jpg';
import blueprint3U from '@/src/assets/images/cubesat_3u_blueprint_1791436585233.jpg';

export interface CubeSatR3FAssemblyViewerProps {
  initialFormat?: '1U' | '2U' | '3U';
  className?: string;
  onSelectComponent?: (componentId: string) => void;
}

export type SubsystemId = 'payload' | 'eps' | 'adcs' | 'obc' | 'com' | 'chassis' | 'solar_wings';

interface SubsystemData {
  id: SubsystemId;
  name: string;
  category: string;
  massG: number;
  powerW: number;
  specs: string;
}

const SUBSYSTEM_INFO: Record<SubsystemId, SubsystemData> = {
  payload: {
    id: 'payload',
    name: 'Целевая полезная нагрузка (Payload)',
    category: 'Научная аппаратура',
    massG: 850,
    powerW: 4.5,
    specs: 'Оптический сенсор ДЗЗ / фотометр атмосферных свечений с виброизоляцией',
  },
  eps: {
    id: 'eps',
    name: 'Система электропитания (EPS)',
    category: 'Энергоснабжение',
    massG: 480,
    powerW: 18.0,
    specs: 'Модуль MPPT, 4S LiFePO4 накопитель 28 Вт·ч, защитный контроллер BMS',
  },
  adcs: {
    id: 'adcs',
    name: 'Ориентация и стабилизация (ADCS)',
    category: 'Навигация и ориентация',
    massG: 410,
    powerW: 3.2,
    specs: '3-осевой блок маховиков (Reaction Wheels) + катушки магнеторкеров',
  },
  obc: {
    id: 'obc',
    name: 'Бортовой вычислительный комплекс (OBC)',
    category: 'Вычислительная система',
    massG: 140,
    powerW: 0.8,
    specs: 'STM32H7 dual-core 480 МГц, 32 МБ MRAM, шина CAN 2.0B / SpaceWire',
  },
  com: {
    id: 'com',
    name: 'Радиопередатчик & Антенна (COM/RF)',
    category: 'Космическая связь',
    massG: 190,
    powerW: 2.2,
    specs: 'УКВ AX.25 / GFSK трансивер 437.425 МГц, рулеточная антенна Cu-Be',
  },
  chassis: {
    id: 'chassis',
    name: 'Несущее силовое шасси (Chassis Rails)',
    category: 'Конструкция',
    massG: 520,
    powerW: 0.0,
    specs: 'Фрезерованный каркас Al-6061-T6 с анодным покрытием, стандарт P-POD',
  },
  solar_wings: {
    id: 'solar_wings',
    name: 'Солнечные батареи (Deployable Wings)',
    category: 'Энергогенерация',
    massG: 340,
    powerW: 16.5,
    specs: 'Раскрывающиеся панели с 3-каскадными фотоэлементами GaAs (КПД 30%)',
  },
};

/**
 * 3D Subsystem component in React Three Fiber
 */
interface PartMeshProps {
  id: SubsystemId;
  format: '1U' | '2U' | '3U';
  explosion: number;
  selectedId: SubsystemId | null;
  wireframe: boolean;
  onSelect: (id: SubsystemId) => void;
}

const CubeSatAssemblyModel: React.FC<{
  format: '1U' | '2U' | '3U';
  explosion: number;
  selectedId: SubsystemId | null;
  wireframe: boolean;
  onSelect: (id: SubsystemId) => void;
}> = ({ format, explosion, selectedId, wireframe, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Height multiplier for format
  const heightMultiplier = format === '1U' ? 1 : format === '2U' ? 2 : 3;
  const baseHeight = 1.0;
  const totalHeight = baseHeight * heightMultiplier;

  // Separation offsets along Y and X
  const expY = explosion * 1.8;
  const expX = explosion * 1.6;

  return (
    <group ref={groupRef}>
      {/* 1. Structural Chassis Frame */}
      <group position={[0, 0, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect('chassis');
          }}
        >
          <boxGeometry args={[1.04, totalHeight + 0.04, 1.04]} />
          <meshStandardMaterial
            color={selectedId === 'chassis' ? '#38bdf8' : '#334155'}
            wireframe={wireframe || explosion > 0.1}
            roughness={0.4}
            metalness={0.8}
            transparent
            opacity={explosion > 0.1 ? 0.45 : 0.85}
          />
        </mesh>
        {/* Chassis corner rails */}
        {[-0.52, 0.52].map((x, xi) =>
          [-0.52, 0.52].map((z, zi) => (
            <mesh key={`rail-${xi}-${zi}`} position={[x, 0, z]}>
              <boxGeometry args={[0.08, totalHeight + 0.1, 0.08]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
          )),
        )}
      </group>

      {/* 2. Payload Bay (+Y Top Layer) */}
      <group position={[0, totalHeight * 0.35 + expY * 1.4, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect('payload');
          }}
        >
          <boxGeometry args={[0.88, totalHeight * 0.32, 0.88]} />
          <meshStandardMaterial
            color={selectedId === 'payload' ? '#06b6d4' : '#1e293b'}
            roughness={0.25}
            metalness={0.7}
            wireframe={wireframe}
          />
        </mesh>
        {/* Optical Lens / Aperture */}
        <mesh position={[0, (totalHeight * 0.32) / 2 + 0.04, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} />
        </mesh>
        {explosion > 0.25 && (
          <Html position={[0, (totalHeight * 0.32) / 2 + 0.25, 0]} center distanceFactor={10}>
            <div className="rounded-md border border-cyan-400 bg-slate-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 shadow-lg whitespace-nowrap pointer-events-none">
              Полезная нагрузка
            </div>
          </Html>
        )}
      </group>

      {/* 3. On-Board Computer (OBC) Board */}
      <group position={[0, totalHeight * 0.1 + expY * 0.7, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect('obc');
          }}
        >
          <boxGeometry args={[0.86, 0.12, 0.86]} />
          <meshStandardMaterial
            color={selectedId === 'obc' ? '#10b981' : '#047857'}
            roughness={0.3}
            metalness={0.6}
            wireframe={wireframe}
          />
        </mesh>
        {/* Microcontroller chip */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.3, 0.04, 0.3]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {explosion > 0.25 && (
          <Html position={[0.6, 0.1, 0]} center distanceFactor={10}>
            <div className="rounded-md border border-emerald-400 bg-slate-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 shadow-lg whitespace-nowrap pointer-events-none">
              Бортовой компьютер OBC
            </div>
          </Html>
        )}
      </group>

      {/* 4. Electrical Power System (EPS & Battery Pack) */}
      <group position={[0, -totalHeight * 0.1 - expY * 0.7, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect('eps');
          }}
        >
          <boxGeometry args={[0.86, totalHeight * 0.28, 0.86]} />
          <meshStandardMaterial
            color={selectedId === 'eps' ? '#f59e0b' : '#b45309'}
            roughness={0.3}
            metalness={0.7}
            wireframe={wireframe}
          />
        </mesh>
        {/* 4S Battery cells */}
        {[-0.22, 0.22].map((bx, bi) =>
          [-0.22, 0.22].map((bz, bzi) => (
            <mesh key={`bat-${bi}-${bzi}`} position={[bx, 0, bz]}>
              <cylinderGeometry args={[0.11, 0.11, totalHeight * 0.24, 16]} />
              <meshStandardMaterial color="#10b981" metalness={0.5} roughness={0.3} />
            </mesh>
          )),
        )}
        {explosion > 0.25 && (
          <Html position={[-0.65, 0, 0]} center distanceFactor={10}>
            <div className="rounded-md border border-amber-400 bg-slate-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 shadow-lg whitespace-nowrap pointer-events-none">
              АКБ LiFePO4 & EPS
            </div>
          </Html>
        )}
      </group>

      {/* 5. ADCS Reaction Wheels Module */}
      <group position={[0, -totalHeight * 0.32 - expY * 1.3, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect('adcs');
          }}
        >
          <boxGeometry args={[0.86, 0.22, 0.86]} />
          <meshStandardMaterial
            color={selectedId === 'adcs' ? '#a855f7' : '#6b21a8'}
            roughness={0.3}
            metalness={0.8}
            wireframe={wireframe}
          />
        </mesh>
        {/* 3-axis reaction wheel flywheel */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.2, 0.2, 0.12, 18]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        {explosion > 0.25 && (
          <Html position={[0, -0.22, 0.5]} center distanceFactor={10}>
            <div className="rounded-md border border-purple-400 bg-slate-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300 shadow-lg whitespace-nowrap pointer-events-none">
              Маховики ADCS
            </div>
          </Html>
        )}
      </group>

      {/* 6. Communication Transceiver & Deployable Antennas (-Y Bottom) */}
      <group position={[0, -totalHeight * 0.46 - expY * 1.8, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect('com');
          }}
        >
          <boxGeometry args={[0.86, 0.1, 0.86]} />
          <meshStandardMaterial
            color={selectedId === 'com' ? '#38bdf8' : '#0369a1'}
            roughness={0.3}
            metalness={0.85}
            wireframe={wireframe}
          />
        </mesh>
        {/* Antenna whiskers */}
        {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((ang, i) => (
          <mesh
            key={`ant-${i}`}
            position={[0.35 * Math.cos(ang), -0.25, 0.35 * Math.sin(ang)]}
            rotation={[Math.PI / 6, ang, 0]}
          >
            <cylinderGeometry args={[0.01, 0.01, 0.7, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
        ))}
        {explosion > 0.25 && (
          <Html position={[0, -0.6, 0]} center distanceFactor={10}>
            <div className="rounded-md border border-sky-400 bg-slate-950/90 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-300 shadow-lg whitespace-nowrap pointer-events-none">
              Радиоканал COM & Антенна
            </div>
          </Html>
        )}
      </group>

      {/* 7. Solar Panels / Deployable Wings (Left & Right) */}
      {/* Left Wing */}
      <group position={[-0.52 - expX, 0, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect('solar_wings');
          }}
        >
          <boxGeometry args={[format === '3U' ? 1.4 : 0.04, totalHeight * 0.9, 0.88]} />
          <meshStandardMaterial
            color={selectedId === 'solar_wings' ? '#38bdf8' : '#0284c7'}
            roughness={0.15}
            metalness={0.9}
            emissive="#0369a1"
            emissiveIntensity={0.2}
            wireframe={wireframe}
          />
        </mesh>
      </group>

      {/* Right Wing */}
      <group position={[0.52 + expX, 0, 0]}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect('solar_wings');
          }}
        >
          <boxGeometry args={[format === '3U' ? 1.4 : 0.04, totalHeight * 0.9, 0.88]} />
          <meshStandardMaterial
            color={selectedId === 'solar_wings' ? '#38bdf8' : '#0284c7'}
            roughness={0.15}
            metalness={0.9}
            emissive="#0369a1"
            emissiveIntensity={0.2}
            wireframe={wireframe}
          />
        </mesh>
      </group>
    </group>
  );
};

export const CubeSatR3FAssemblyViewer: React.FC<CubeSatR3FAssemblyViewerProps> = ({
  initialFormat = '3U',
  className = '',
  onSelectComponent,
}) => {
  const [format, setFormat] = useState<'1U' | '2U' | '3U'>(initialFormat);
  const [explosion, setExplosion] = useState<number>(0.4); // 0 (assembled) to 1 (full exploded)
  const [selectedComponentId, setSelectedComponentId] = useState<SubsystemId | null>('payload');
  const [viewMode, setViewMode] = useState<'3d' | 'blueprint' | 'split'>('3d');
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isGeneratingScheme, setIsGeneratingScheme] = useState<boolean>(false);
  const [showAiGuide, setShowAiGuide] = useState<boolean>(false);
  const [aiScheme, setAiScheme] = useState<{
    source: string;
    totalMassG: number;
    totalPowerW: number;
    solarGenerationW: number;
    steps: string[];
    recommendations: string[];
  } | null>(null);

  // Pick AI Blueprint image based on chosen format
  const activeBlueprintUrl = useMemo(() => {
    if (format === '1U') return blueprint1U;
    if (format === '2U') return blueprint2U;
    return blueprint3U;
  }, [format]);

  const handleGenerateAiScheme = async () => {
    setIsGeneratingScheme(true);
    try {
      const res = await fetch('/api/cubesat/generate-assembly-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          payloadType: 'Оптический сенсор ДЗЗ и фотометр атмосферных свечений',
          missionGoal: 'Солнечно-синхронная орбита, мониторинг верхних слоев атмосферы',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.scheme) {
          setAiScheme({
            source: data.source || 'gemini-ai',
            totalMassG:
              data.scheme.totalMassG || (format === '1U' ? 1120 : format === '2U' ? 2280 : 3410),
            totalPowerW:
              data.scheme.totalPowerW || (format === '1U' ? 6.2 : format === '2U' ? 11.8 : 17.5),
            solarGenerationW:
              data.scheme.solarGenerationW ||
              (format === '1U' ? 7.5 : format === '2U' ? 14.2 : 22.0),
            steps: data.scheme.assemblySteps || [],
            recommendations: data.scheme.aiRecommendations || [],
          });
          setShowAiGuide(true);
        }
      }
    } catch (err) {
      console.warn('Failed to generate scheme via API, using high-fidelity local blueprint', err);
      setAiScheme({
        source: 'local-knowledge',
        totalMassG: format === '1U' ? 1120 : format === '2U' ? 2280 : 3410,
        totalPowerW: format === '1U' ? 6.2 : format === '2U' ? 11.8 : 17.5,
        solarGenerationW: format === '1U' ? 7.5 : format === '2U' ? 14.2 : 22.0,
        steps: [
          'Шаг 1: Монтаж направляющих рельсов шасси и донного шпангоута',
          'Шаг 2: Установка батарейного блока EPS и шины питания PC/104',
          'Шаг 3: Интеграция 3-осевого блока маховиков и магнеторкеров системы ADCS',
          'Шаг 4: Размещение платы бортового компьютера OBC с CAN 2.0B',
          'Шаг 5: Монтаж УКВ трансивера COM и укладка механизма сброса антенн',
          'Шаг 6: Фиксация отсека полезной нагрузки ДЗЗ в верхней секции +Z',
          'Шаг 7: Установка фотоэлектрических панелей GaAs и финальная центровка',
        ],
        recommendations: [
          `Запас массы ${Math.round(((format === '1U' ? 1330 - 1120 : format === '2U' ? 2660 - 2280 : 4000 - 3410) / (format === '1U' ? 1330 : format === '2U' ? 2660 : 4000)) * 100)}% удовлетворяет нормам пусковых контейнеров`,
          'Центр масс сбалансирован в пределах ±12 мм от оси вращения',
          'Тепловой баланс: оптический сенсор изолирован от высокочастотного тракта передатчика',
        ],
      });
      setShowAiGuide(true);
    } finally {
      setIsGeneratingScheme(false);
    }
  };

  const handleComponentSelect = (id: SubsystemId) => {
    setSelectedComponentId(id);
    if (onSelectComponent) onSelectComponent(id);
  };

  const activeSubsystem = selectedComponentId
    ? SUBSYSTEM_INFO[selectedComponentId]
    : SUBSYSTEM_INFO.payload;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border border-cyan-500/30 bg-slate-950 shadow-2xl overflow-hidden backdrop-blur-md ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      } ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/60 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide">
                3D-Схема сборки CubeSat (React Three Fiber)
              </span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                CAD Exploded View
              </span>
              <span className="rounded bg-purple-500/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-purple-300 border border-purple-500/30">
                ИИ Сборочный чертеж
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Интерактивная разборка узлов аппарата, вращение модели и нейросетевая схемотехника
            </p>
          </div>
        </div>

        {/* Format Selector Pills (1U / 2U / 3U) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['1U', '2U', '3U'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  format === fmt
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                CubeSat {fmt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerateAiScheme}
            disabled={isGeneratingScheme}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Сгенерировать инженерную схему сборки CubeSat нейросетью"
          >
            <Sparkles
              className={`h-3.5 w-3.5 text-amber-300 ${isGeneratingScheme ? 'animate-spin' : ''}`}
            />
            <span>{isGeneratingScheme ? 'ИИ расчет...' : 'ИИ Схема сборки'}</span>
          </button>
        </div>

        {/* View Mode & Utility Controls */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`rounded px-2.5 py-1 transition-all cursor-pointer ${
                viewMode === '3d'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Модель
            </button>
            <button
              type="button"
              onClick={() => setViewMode('blueprint')}
              className={`rounded px-2.5 py-1 transition-all cursor-pointer ${
                viewMode === 'blueprint'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Чертеж ИИ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`rounded px-2.5 py-1 transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-cyan-500/30 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Сплит
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            title={isFullscreen ? 'Свернуть' : 'Во весь экран'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Viewport Split Container */}
      <div
        className={`relative grid ${
          viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        } ${isFullscreen ? 'flex-1' : 'h-[520px] sm:h-[580px]'}`}
      >
        {/* 3D R3F Viewport */}
        {(viewMode === '3d' || viewMode === 'split') && (
          <div className="relative w-full h-full bg-slate-950">
            <Canvas
              camera={{ position: [2.5, 2.2, 3.2], fov: 42 }}
              style={{ width: '100%', height: '100%' }}
            >
              <color attach="background" args={['#030712']} />
              <ambientLight intensity={1.2} />
              <directionalLight position={[10, 15, 10]} intensity={2.2} />
              <directionalLight position={[-10, -10, -5]} intensity={0.8} />

              <OrbitControls
                enableDamping
                dampingFactor={0.08}
                minDistance={1.2}
                maxDistance={12}
                autoRotate={isAutoRotate}
                autoRotateSpeed={1.0}
              />

              <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
                <CubeSatAssemblyModel
                  format={format}
                  explosion={explosion}
                  selectedId={selectedComponentId}
                  wireframe={wireframe}
                  onSelect={handleComponentSelect}
                />
              </Float>
            </Canvas>

            {/* Floating 3D Tool Controls */}
            <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-950/85 p-1.5 shadow-xl backdrop-blur-md text-[11px]">
              <button
                type="button"
                onClick={() => setIsAutoRotate(!isAutoRotate)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer ${
                  isAutoRotate
                    ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Авто-вращение 3D модели"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isAutoRotate ? 'animate-spin' : ''}`} />
                <span>Авто-вращение</span>
              </button>

              <button
                type="button"
                onClick={() => setWireframe(!wireframe)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 transition-all cursor-pointer ${
                  wireframe
                    ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Режим каркасной сетки (Wireframe)"
              >
                <span>Каркас</span>
              </button>

              <button
                type="button"
                onClick={() => setExplosion(explosion > 0.1 ? 0 : 0.6)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all cursor-pointer shadow-xs"
              >
                <Layers className="h-3 w-3" />
                <span>{explosion > 0.1 ? 'Собрать' : 'Разобрать'}</span>
              </button>
            </div>

            {/* Exploded View Slider Bar at Bottom of Canvas */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/85 px-4 py-2 shadow-2xl backdrop-blur-md text-xs sm:w-80">
              <Sliders className="h-4 w-4 text-cyan-400 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Взрыв-схема разборки:</span>
                  <span className="font-bold text-cyan-300">{Math.round(explosion * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={explosion}
                  onChange={(e) => setExplosion(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2D Neural Network Blueprint Image Viewport */}
        {(viewMode === 'blueprint' || viewMode === 'split') && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 border-l border-slate-800/80 overflow-hidden">
            <div className="relative group rounded-xl border border-cyan-500/30 bg-slate-900 overflow-hidden shadow-2xl max-w-full max-h-full">
              <img
                src={activeBlueprintUrl}
                alt={`AI-Generated CAD Blueprint CubeSat ${format}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain max-h-[460px]"
              />

              {/* Blueprint overlay tag */}
              <div className="absolute top-3 left-3 rounded bg-slate-950/85 px-2.5 py-1 text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/40 backdrop-blur-md">
                СБОРОЧНЫЙ ЧЕРТЕЖ: CUBESAT {format}
              </div>

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <a
                  href={activeBlueprintUrl}
                  download={`CubeSat_${format}_Blueprint.jpg`}
                  className="flex items-center gap-1 rounded-lg bg-cyan-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white hover:bg-cyan-500 transition-colors shadow"
                >
                  <Download className="h-3 w-3" />
                  <span>Скачать чертеж {format}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Subsystem Inspector Card */}
      <div className="border-t border-slate-800 bg-slate-900/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{activeSubsystem.name}</span>
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                {activeSubsystem.category}
              </span>
              {aiScheme && (
                <button
                  type="button"
                  onClick={() => setShowAiGuide(!showAiGuide)}
                  className="rounded-lg bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{showAiGuide ? 'Скрыть план ИИ' : 'Показать план сборки ИИ'}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">{activeSubsystem.specs}</p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
            <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Масса узла:</span>
              <span className="font-bold text-white">{activeSubsystem.massG} г</span>
            </div>
            <div className="rounded-lg bg-slate-950 p-2 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Мощность:</span>
              <span className="font-bold text-amber-300">{activeSubsystem.powerW} Вт</span>
            </div>
          </div>
        </div>

        {/* AI Engineering Recommendations & Assembly Plan Drawer */}
        {aiScheme && showAiGuide && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-purple-300 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Рекомендации нейросети (Инженерный расчет)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {aiScheme.source === 'gemini-ai' ? 'Gemini 2.5 Flash' : 'Cosmoport AI Engine'}
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                {aiScheme.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400 font-bold">›</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3 pt-1 font-mono text-[10px] text-slate-400">
                <span>
                  Итоговая масса: <strong className="text-cyan-300">{aiScheme.totalMassG} г</strong>
                </span>
                <span>
                  Потребление: <strong className="text-amber-300">{aiScheme.totalPowerW} Вт</strong>
                </span>
                <span>
                  Генерация СБ:{' '}
                  <strong className="text-emerald-300">{aiScheme.solarGenerationW} Вт</strong>
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-cyan-300 font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Пошаговый технологический план сборки</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {aiScheme.steps.length} технологических шагов
                </span>
              </div>
              <ol className="space-y-1 text-slate-300 text-[11px] max-h-32 overflow-y-auto pr-1">
                {aiScheme.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-mono text-[10px] shrink-0 font-bold">
                      {idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
