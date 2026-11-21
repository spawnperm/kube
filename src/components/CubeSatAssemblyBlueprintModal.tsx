/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Layers,
  Cpu,
  BatteryCharging,
  Radio,
  Compass,
  Box,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Maximize2,
  Minimize2,
  Download,
  Info,
  Scale,
  Zap,
  Eye,
  Sliders,
} from 'lucide-react';
import type { CubesatSpecs } from '../types';
import { CubeSatR3FAssemblyViewer } from './telemetry/CubeSatR3FAssemblyViewer';

import blueprint1U from '@/src/assets/images/cubesat_1u_blueprint_1791436560253.jpg';
import blueprint2U from '@/src/assets/images/cubesat_2u_blueprint_1791436574557.jpg';
import blueprint3U from '@/src/assets/images/cubesat_3u_blueprint_1791436585233.jpg';

export interface CubeSatAssemblyBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  specs?: Partial<CubesatSpecs>;
  teamName?: string;
  onApplyComponentPreset?: (componentName: string, specs: Partial<CubesatSpecs>) => void;
}

export interface SubsystemComponentInfo {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  volumeU: number;
  massGrams: number;
  powerWatts: number;
  description: string;
  blueprintCallout: string;
  recommendations: string[];
  keySpecs: Record<string, string>;
}

export const CubeSatAssemblyBlueprintModal: React.FC<CubeSatAssemblyBlueprintModalProps> = ({
  isOpen,
  onClose,
  specs = {
    format: '3U',
    payloadType: 'Оптический фотометр атмосферных свечений',
    orbitAltitudeKm: 525,
    inclinationDeg: 97.4,
    powerBudgetWatts: 18.5,
    radioFreqMhz: 437.425,
    massKg: 3.4,
  },
  teamName = 'Орион-3',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'1U' | '2U' | '3U'>(
    (specs.format as '1U' | '2U' | '3U') || '3U',
  );
  const [activeTab, setActiveTab] = useState<'r3f_3d' | 'cad_blueprint' | 'specs'>('r3f_3d');
  const [selectedComponentId, setSelectedComponentId] = useState<string>('payload');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);

  if (!isOpen) return null;

  const is1U = selectedFormat === '1U';
  const is2U = selectedFormat === '2U';
  const is3U = selectedFormat === '3U';

  const maxMassKg = is1U ? 1.33 : is2U ? 2.66 : 4.0;
  const currentMassKg = is1U ? 1.15 : is2U ? 2.3 : 3.4;
  const massMarginPercent = Math.round(((maxMassKg - currentMassKg) / maxMassKg) * 100);

  // Active blueprint image for selected format
  const activeBlueprintUrl = is1U ? blueprint1U : is2U ? blueprint2U : blueprint3U;

  const subsystems: SubsystemComponentInfo[] = [
    {
      id: 'payload',
      name: `Отсек полезной нагрузки (Payload Bay)`,
      category: 'Научная целевая аппаратура',
      icon: Box,
      volumeU: is1U ? 0.35 : is2U ? 0.9 : 1.5,
      massGrams: is1U ? 350 : is2U ? 750 : 1150,
      powerWatts: is1U ? 2.5 : is2U ? 3.8 : 4.8,
      blueprintCallout: 'Верхняя секция +Z, виброизолированная оптическая турель',
      description: `Целевой модуль: ${specs.payloadType || 'Научный эксперимент'}. Располагается в надир-ориентированном отсеке с защитным кварцевым окном и теплоизоляцией ЭВТИ.`,
      recommendations: [
        'Используйте коллиматорную бленду для защиты от прямой засветки Солнцем',
        'Тепловыделение ПН требует прямого теплоотвода на боковые панели каркаса',
        'Интерфейс с бортовым компьютером: SPI (до 10 Мбит/с) или высокоскоростной UART',
      ],
      keySpecs: {
        'Тип целевой нагрузки': specs.payloadType || 'Фотометр / Камера ДЗЗ',
        'Выделенный объем': is1U
          ? '0.35U (100×100×35 мм)'
          : is2U
            ? '0.9U (100×100×90 мм)'
            : '1.5U (100×100×150 мм)',
        Энергопотребление: is1U ? '2.5 Вт' : is2U ? '3.8 Вт' : '4.8 Вт',
        'Ориентация в полете': 'Надир (вектор к центру Земли)',
      },
    },
    {
      id: 'eps',
      name: 'Система электропитания (EPS & Батареи)',
      category: 'Энергоснабжение',
      icon: BatteryCharging,
      volumeU: is1U ? 0.3 : 0.45,
      massGrams: is1U ? 280 : is2U ? 420 : 580,
      powerWatts: is1U ? 5.5 : is2U ? 12.0 : 18.5,
      blueprintCallout: 'Стек PC/104, средний ярус, блок аккумуляторов LiFePO4',
      description:
        'Модуль распределения питания с MPPT-контроллерами для солнечных панелей GaAs. Включает блок аккумуляторов LiFePO4 с контроллером балансировки ячеек.',
      recommendations: [
        'Литий-железо-фосфат обеспечивает работу при температурах от -20°C до +60°C',
        'Обеспечьте запас энергобюджета не менее 25% на случай деградации ФЭП',
        'Раздельные стабилизированные шины питания: 3.3 В (логика), 5.0 В (радио), 12.0 В (маховики)',
      ],
      keySpecs: {
        'Генерация СБ': is1U ? '5.5 Вт' : is2U ? '12.0 Вт' : '18.5 Вт',
        'Емкость накопителя': is1U ? '14.4 Вт·ч (2S2P)' : '28.8 Вт·ч (4S2P LiFePO4)',
        'КПД MPPT-преобразователя': '94.5%',
        'Длительность тени (эклипс)': '~35.2 мин на виток',
      },
    },
    {
      id: 'adcs',
      name: 'Система ориентации и стабилизации (ADCS)',
      category: 'Навигация и управление движением',
      icon: Compass,
      volumeU: is1U ? 0.2 : 0.35,
      massGrams: is1U ? 190 : is2U ? 320 : 490,
      powerWatts: is1U ? 1.4 : 2.5,
      blueprintCallout: 'Нижний силовой ярус: блок маховиков + магнеторкеры',
      description:
        'Комплекс трехосной ориентации: миниатюрные бесколлекторные маховики (Reaction Wheels) для наведения и электромагнитные катушки (магнеторкеры) для сброса кинетического момента.',
      recommendations: [
        'Алгоритм B-Dot активируется через 15 минут после отделения от пускового контейнера',
        'Солнечные датчики на гранях обеспечивают точность наведения на Солнце до ±1.5°',
        'Магнитные катушки сбрасывают угловой момент за счет геомагнитного поля',
      ],
      keySpecs: {
        'Кинетический момент': is1U ? '1.5 мН·м·с' : '5.0 мН·м·с',
        'Максимальный крутящий момент': '2.2 мН·м',
        'Дипольный момент катушек': '0.25 А·м²',
        'Точность стабилизации': '±0.8° в надирном режиме',
      },
    },
    {
      id: 'obc',
      name: 'Бортовой комплекс управления (OBC)',
      category: 'Вычислительная система',
      icon: Cpu,
      volumeU: 0.2,
      massGrams: 140,
      powerWatts: 0.8,
      blueprintCallout: 'Центральная плата PC/104 со спаренным MCU STM32H7',
      description:
        'Бортовой компьютер на базе радиационно-стойкого микроконтроллера STM32H7 (480 МГц) с 32 МБ MRAM памяти и ОС реального времени FreeRTOS.',
      recommendations: [
        'Используйте сторожевой таймер (Watchdog) и аппаратный контроль целостности CRC в памяти',
        'Шина CAN 2.0B обеспечивает помехозащищенную связь между всеми подсистемами спутника',
        'Регистрируйте аварийные события в кольцевой энергонезависимой MRAM-памяти',
      ],
      keySpecs: {
        'Процессорное ядро': 'ARM Cortex-M7 @ 480 МГц с FPU',
        'Оперативная память (MRAM)': '32 МБ (не подвержена SEL/SEU)',
        'Интерфейсные шины': '2x CAN, 3x SPI, 4x UART, I2C',
        'Потребление в штатном режиме': '0.85 Вт',
      },
    },
    {
      id: 'com',
      name: 'Приемопередатчик и антенна (COM & Transceiver)',
      category: 'Космическая радиосвязь',
      icon: Radio,
      volumeU: 0.2,
      massGrams: 180,
      powerWatts: 2.2,
      blueprintCallout: 'Торцевая плата -Z: ленточная антенна с нихромовым термоножом',
      description: `УКВ-трансивер радиомаяка и телеметрии AX.25 / GFSK на частоте ${specs.radioFreqMhz || 437.425} МГц. Включает развертываемую ленточную антенну из бериллиевой бронзы.`,
      recommendations: [
        'Задержка раскрытия антенн: ровно 30 минут после схода с концевиков P-POD',
        'Рассчитайте доплеровский сдвиг частоты (±9.8 кГц) в алгоритме демодулятора наземной станции',
        'Мощность передатчика: 0.2 Вт (маяк) / 1.0 Вт (пакетный сброс телеметрии)',
      ],
      keySpecs: {
        'Частота радиоканала': `${specs.radioFreqMhz || 437.425} МГц`,
        'Модуляция & Протокол': 'GFSK / AX.25, 9600–19200 бод',
        'Выходная мощность (RF)': '1.0 Вт (+30 dBm)',
        'Тип антенны': 'Квадрифилярная рулеточная Cu-Be',
      },
    },
    {
      id: 'structure',
      name: 'Несущий каркас и шасси (Chassis & Rails)',
      category: 'Конструкция и механика',
      icon: Layers,
      volumeU: is1U ? 1.0 : is2U ? 2.0 : 3.0,
      massGrams: is1U ? 280 : is2U ? 480 : 740,
      powerWatts: 0.0,
      blueprintCallout: 'Фрезерованный каркас из Al-6061 с твердым анодированием',
      description:
        'Силовой моноблочный каркас с направляющими рельсами для пускового контейнера P-POD. Изготовлен из сплава Al-6061-T6 с анодным покрытием.',
      recommendations: [
        'Все крепежные винты должны быть законтрены анаэробным фиксатором резьбы Loctite 222',
        'Шероховатость направляющих рельсов не более Ra 0.8 для предотвращения заклинивания в ТПК',
        'Смещение центра масс аппарата не более 20 мм от геометрического центра',
      ],
      keySpecs: {
        'Габариты шасси': is1U
          ? '100.0 × 100.0 × 113.5 мм'
          : is2U
            ? '100.0 × 100.0 × 227.0 мм'
            : '100.0 × 100.0 × 340.5 мм',
        'Материал каркаса': 'Al-6061-T6 с твердым анодированием',
        'Допуски рельсов': '±0.1 мм (CubeSat Design Spec)',
        'Собственная масса шасси': `${is1U ? 280 : is2U ? 480 : 740} г`,
      },
    },
  ];

  const activeComponent = subsystems.find((s) => s.id === selectedComponentId) || subsystems[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blueprint-modal-title"
    >
      <div
        className={`flex flex-col rounded-2xl border border-cyan-500/40 bg-slate-900/95 shadow-2xl transition-all overflow-hidden ${
          isFullscreen ? 'w-full h-full max-w-none rounded-none' : 'w-full max-w-6xl max-h-[94vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-900/40 bg-slate-950/80 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="blueprint-modal-title"
                className="text-base sm:text-lg font-bold text-white flex items-center gap-2"
              >
                3D-Схема и сборочный чертеж КубСата {selectedFormat}
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-cyan-300 border border-cyan-500/40">
                  R3F + ИИ Чертеж
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Спецификация команды «{teamName}» • 3D взрыв-схема, нейросетевой чертеж и инженерная
                компоновка
              </p>
            </div>
          </div>

          {/* Format Selector Pills (1U / 2U / 3U) */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            {(['1U', '2U', '3U'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedFormat === fmt
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullscreen ? 'Свернуть' : 'Во весь экран'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Mode Sub-tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/50 px-4 sm:px-6 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('r3f_3d')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTab === 'r3f_3d'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D Взрыв-схема (React Three Fiber)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cad_blueprint')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTab === 'cad_blueprint'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>2D CAD Чертеж ИИ ({selectedFormat})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer ${
                activeTab === 'specs'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Спецификация модулей</span>
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>
              Масса: <strong className="text-cyan-300">{currentMassKg} кг</strong> / {maxMassKg} кг
            </span>
            <span>•</span>
            <span className="text-emerald-400">Запас массы: +{massMarginPercent}%</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'r3f_3d' ? (
            /* 1. React Three Fiber Interactive 3D Model with Exploded View & OrbitControls */
            <div className="space-y-4">
              <CubeSatR3FAssemblyViewer
                initialFormat={selectedFormat}
                onSelectComponent={(compId) => setSelectedComponentId(compId)}
              />
            </div>
          ) : activeTab === 'cad_blueprint' ? (
            /* 2. AI-Generated 2D CAD Blueprint Graphic View */
            <div className="space-y-4">
              <div className="relative group rounded-xl border border-cyan-500/30 bg-slate-950 overflow-hidden shadow-2xl">
                <img
                  src={activeBlueprintUrl}
                  alt={`Сборочный чертеж КубСата ${selectedFormat}`}
                  referrerPolicy="no-referrer"
                  className={`w-full object-contain max-h-[580px] transition-all duration-300 ${
                    zoomImage ? 'scale-125' : 'scale-100'
                  }`}
                />

                <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
                  <span className="rounded bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono font-bold text-cyan-300 border border-cyan-500/40">
                    CUBESAT {selectedFormat} CAD EXPLODED BLUEPRINT
                  </span>
                  <span className="rounded bg-slate-950/80 backdrop-blur-md px-2 py-1 text-[11px] font-mono text-emerald-400 border border-emerald-500/40">
                    Сгенерировано Image Generation
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomImage(!zoomImage)}
                    className="rounded-lg bg-slate-950/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-slate-200 border border-slate-700 hover:border-cyan-400 transition-colors cursor-pointer"
                  >
                    {zoomImage ? 'Уменьшить' : 'Увеличить 125%'}
                  </button>
                  <a
                    href={activeBlueprintUrl}
                    download={`CubeSat_${selectedFormat}_Assembly_Blueprint.jpg`}
                    className="flex items-center gap-1 rounded-lg bg-cyan-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white hover:bg-cyan-500 transition-colors shadow cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    Скачать чертеж {selectedFormat}
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* 3. Detailed Component Breakdown View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Subsystem Buttons */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  Выберите блок КубСата {selectedFormat} для изучения:
                </span>
                <div className="space-y-2">
                  {subsystems.map((sub) => {
                    const Icon = sub.icon;
                    const isSelected = sub.id === selectedComponentId;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedComponentId(sub.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-sm ring-1 ring-cyan-400/30'
                            : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-5 w-5 shrink-0 ${
                              isSelected ? 'text-cyan-400' : 'text-slate-500'
                            }`}
                          />
                          <div>
                            <div className="text-xs font-bold text-white">{sub.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">
                              {sub.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono text-xs text-cyan-300">
                          <div>{sub.volumeU}U</div>
                          <div className="text-[10px] text-slate-500">{sub.massGrams} г</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Detailed Card */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-xl border border-cyan-800/50 bg-slate-950/80 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                      {activeComponent.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Объем: {activeComponent.volumeU}U • {activeComponent.massGrams} г
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {activeComponent.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeComponent.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300/90 flex items-center gap-2">
                    <Info className="h-4 w-4 shrink-0 text-cyan-400" />
                    <span>Расположение: {activeComponent.blueprintCallout}</span>
                  </div>
                </div>

                {/* Key Technical Specifications Table */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    Технические параметры узла:
                  </h4>
                  <div className="space-y-1.5 text-xs font-mono">
                    {Object.entries(activeComponent.keySpecs).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-1 border-b border-slate-900 last:border-0"
                      >
                        <span className="text-slate-400">{key}:</span>
                        <span className="text-slate-200 font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engineering Design Tips / AI Hints */}
                <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Инженерные рекомендации при сборке:
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {activeComponent.recommendations.map((rec) => (
                      <li key={rec} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-4 sm:px-6 py-3 text-xs">
          <span className="text-slate-500 font-mono">
            CubeSat Standard {selectedFormat} • Габариты:{' '}
            {is1U ? '100×100×100' : is2U ? '100×100×200' : '100×100×340'} мм • P-POD Compatible
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-1.5 font-semibold text-white transition-colors cursor-pointer"
          >
            Закрыть схему
          </button>
        </div>
      </div>
    </div>
  );
};
