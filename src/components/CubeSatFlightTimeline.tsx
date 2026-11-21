import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  Radio,
  Sun,
  Zap,
  RotateCw,
  Satellite,
  Compass,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import type { TelemetryPacket, FlightTimelineEvent, FlightEventCategory } from '../types';

type FilterCategory = FlightEventCategory | 'all';

interface CubeSatFlightTimelineProps {
  telemetry: TelemetryPacket;
  onForceEvent?: (mode: 'NORMAL' | 'ECLIPSE' | 'DETUMBLING' | 'TRANSMITTING') => void;
  className?: string;
}

export const CubeSatFlightTimeline: React.FC<CubeSatFlightTimelineProps> = ({
  telemetry,
  onForceEvent,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FlightEventCategory | 'all'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>('evt_antenna');
  const [viewFormat, setViewFormat] = useState<'flow' | 'list'>('flow');

  // Dynamically compute flight timeline events based on the live simulated telemetry
  const timelineEvents: FlightTimelineEvent[] = useMemo(() => {
    const isDetumbling = telemetry.mode === 'DETUMBLING';
    const isEclipse = telemetry.mode === 'ECLIPSE';
    const isTransmitting = telemetry.mode === 'TRANSMITTING';
    const hasSolarPower = telemetry.solarPowerW > 0;
    const isAcquiringPayload = telemetry.payloadStatus === 'ACQUIRING_DATA';

    return [
      {
        id: 'evt_separation',
        timestamp: 'T+00:00:00',
        relativeMinutes: 0,
        title: 'Отделение от пускового контейнера (P-POD)',
        category: 'deployment',
        status: 'completed',
        description:
          'Срабатывание концевых микровыключателей на направляющих рельсах 3U. Извлечение чеки RBF (Remove Before Flight), запуск таймера безопасности ГОСТ 30 мин.',
        iconName: 'Satellite',
        criticality: 'critical',
        evidence: [
          {
            key: 'switches',
            label: 'Концевики отделения',
            value: 'РАЗОМКНУТЫ (OK)',
            status: 'nominal',
          },
          {
            key: 'timer',
            label: 'Бортовой таймер безопасности',
            value: '30:00 ТАЙМАУТ ВЫПОЛНЕН',
            status: 'nominal',
          },
          {
            key: 'orbit',
            label: 'Орбитальная высота',
            value: `${telemetry.altitudeKm} км`,
            status: 'nominal',
          },
        ],
      },
      {
        id: 'evt_obc_boot',
        timestamp: 'T+00:05:00',
        relativeMinutes: 5,
        title: 'Инициализация бортового компьютера (OBC) и шин питания',
        category: 'subsystem',
        status: 'completed',
        description:
          'Подача питания на первичные преобразователи DC-DC шин 3.3 В и 5.0 В. Загрузка RTOS FreeRTOS, самотестирование датчиков IMU и памяти FRAM.',
        iconName: 'Zap',
        criticality: 'critical',
        evidence: [
          {
            key: 'volt',
            label: 'Напряжение АКБ',
            value: `${telemetry.batteryVoltage} В`,
            status: 'nominal',
          },
          {
            key: 'temp',
            label: 'Температура процессора',
            value: `+${telemetry.obcTempC} °C`,
            status: 'nominal',
          },
          { key: 'bus', label: 'Статус шины EPS', value: 'НОМИНАЛ (94% SOC)', status: 'nominal' },
        ],
      },
      {
        id: 'evt_solar_deploy',
        timestamp: 'T+00:15:30',
        relativeMinutes: 15.5,
        title: 'Раскрытие панелей солнечных батарей (+X / -X)',
        category: 'deployment',
        status: hasSolarPower && !isEclipse ? 'completed' : isEclipse ? 'completed' : 'active',
        description:
          'Прожиг удерживающей нихромовой нити термоножом (burn-wire 2.8A, 1.5с). Пружинное раскрытие двух фотоэлектрических крыльев GaAs с фиксацией в замках.',
        iconName: 'Sun',
        criticality: 'critical',
        evidence: [
          {
            key: 'pwr',
            label: 'Генерация панелей',
            value: isEclipse ? '0.0 Вт (Тень)' : `${telemetry.solarPowerW} Вт`,
            status: isEclipse ? 'warning' : 'nominal',
          },
          {
            key: 'current',
            label: 'Фототок заряда СБ',
            value: `${telemetry.solarCurrentMa} мА`,
            status: isEclipse ? 'warning' : 'nominal',
          },
          {
            key: 'temp',
            label: 'Температура GaAs',
            value: `${telemetry.solarPanelTempC} °C`,
            status: 'nominal',
          },
        ],
      },
      {
        id: 'evt_antenna',
        timestamp: 'T+00:32:00',
        relativeMinutes: 32,
        title: 'Развертывание 4-элементного антенного комплекса UHF/VHF',
        category: 'deployment',
        status: 'completed',
        description:
          'Открытие крышки антенного модуля. Расправление 4 упругих рулеточных штырей (Turnstile monopole) под углом 45° с круговой поляризацией на частоте 437.425 МГц.',
        iconName: 'Radio',
        criticality: 'critical',
        evidence: [
          { key: 'swr', label: 'КСВ фидера', value: '1.18 (Норма < 1.5)', status: 'nominal' },
          {
            key: 'freq',
            label: 'Рабочая частота Downlink',
            value: '437.425 МГц',
            status: 'nominal',
          },
          {
            key: 'pattern',
            label: 'Диаграмма направленности',
            value: 'Круговая (Turnstile)',
            status: 'nominal',
          },
        ],
      },
      {
        id: 'evt_detumble',
        timestamp: 'T+00:35:10',
        relativeMinutes: 35.2,
        title: 'Гашение угловых скоростей алгоритмом B-dot (Detumbling)',
        category: 'subsystem',
        status: isDetumbling ? 'active' : 'completed',
        description:
          'Измерение вектора индукции магнитного поля Земли магнитометром. Генерация демпфирующего момента катушками магнитоориентации (magnetorquers) для снижения угловой скорости ниже 0.1°/с.',
        iconName: 'RotateCw',
        criticality: 'high',
        evidence: [
          {
            key: 'rateX',
            label: 'Угловая скорость ω_X',
            value: `${telemetry.gyroRates[0]} °/с`,
            status: isDetumbling ? 'warning' : 'nominal',
          },
          {
            key: 'rateY',
            label: 'Угловая скорость ω_Y',
            value: `${telemetry.gyroRates[1]} °/с`,
            status: isDetumbling ? 'warning' : 'nominal',
          },
          {
            key: 'rateZ',
            label: 'Угловая скорость ω_Z',
            value: `${telemetry.gyroRates[2]} °/с`,
            status: isDetumbling ? 'warning' : 'nominal',
          },
          {
            key: 'status',
            label: 'Режим ADCS',
            value: isDetumbling ? 'АКТИВЕН: B-DOT DAMPING' : 'УГЛОВЫЕ СКОРОСТИ ПОГАШЕНЫ',
            status: isDetumbling ? 'active' : 'nominal',
          },
        ],
      },
      {
        id: 'evt_beacon',
        timestamp: 'T+00:45:00',
        relativeMinutes: 45,
        title: 'Первый радиомаяк и начало регулярной передачи телеметрии',
        category: 'radio',
        status: isTransmitting ? 'active' : 'completed',
        description:
          'Активация передатчика 1 Вт. Формирование и сброс пакетов телеметрии формата AX.25 UI-frame с позывным RS42S и кеплеровскими элементами орбиты.',
        iconName: 'Radio',
        criticality: 'critical',
        evidence: [
          {
            key: 'packets',
            label: 'Принято пакетов телеметрии',
            value: `#${telemetry.packetsDownlinked}`,
            status: 'nominal',
          },
          {
            key: 'speed',
            label: 'Скорость передачи данных',
            value: `${telemetry.downlinkSpeedKbps} кбит/с`,
            status: 'nominal',
          },
          {
            key: 'rssi',
            label: 'Уровень сигнала RSSI',
            value: `${telemetry.radioRssiDb} dBm`,
            status: 'nominal',
          },
        ],
      },
      {
        id: 'evt_adcs_nadir',
        timestamp: 'T+01:00:00',
        relativeMinutes: 60,
        title: 'Трехосная ориентация аппарата в Надир (3-Axis Stabilized)',
        category: 'subsystem',
        status: !isDetumbling ? 'completed' : 'scheduled',
        description:
          'Включение маховиков гиродинной стабилизации. Разворот оптической полезной нагрузки строго на центр Земли (вектор Надир) с точностью удержания до 0.5°.',
        iconName: 'Compass',
        criticality: 'high',
        evidence: [
          {
            key: 'angles',
            label: 'Текущие углы Эйлера (R/P/Y)',
            value: `${telemetry.orientation?.roll ?? 0}° / ${telemetry.orientation?.pitch ?? 0}° / ${telemetry.orientation?.yaw ?? 0}°`,
            status: 'nominal',
          },
          {
            key: 'adcsMode',
            label: 'Статус контура ориентации',
            value: telemetry.orientation?.adcsStatus ?? '3-Axis Stabilized',
            status: 'nominal',
          },
        ],
      },
      {
        id: 'evt_payload_init',
        timestamp: 'T+01:15:00',
        relativeMinutes: 75,
        title: 'Калибровка полезной нагрузки: спектрометр SiPM и оптическая камера',
        category: 'payload',
        status: isAcquiringPayload ? 'active' : isEclipse ? 'scheduled' : 'completed',
        description:
          'Включение кремниевого фотоумножителя (SiPM) радиационного мониторинга и ПЗС-матрицы дистанционного зондирования Земли. Тестовый захват спектральных данных.',
        iconName: 'Eye',
        criticality: 'high',
        evidence: [
          {
            key: 'status',
            label: 'Статус ПН',
            value: telemetry.payloadStatus,
            status: isAcquiringPayload ? 'active' : 'nominal',
          },
          {
            key: 'temp',
            label: 'Детектор SiPM',
            value: '+16.4 °C (термостабилизация OK)',
            status: 'nominal',
          },
          {
            key: 'mode',
            label: 'Режим съемки',
            value: isEclipse ? 'Ожидание света (STANDBY)' : 'Сбор научных данных',
            status: 'nominal',
          },
        ],
      },
      {
        id: 'evt_eclipse_transit',
        timestamp: 'Орбитальный цикл #1',
        relativeMinutes: 92,
        title: 'Прохождение теневого участка орбиты (Eclipse Transit)',
        category: 'orbit',
        status: isEclipse ? 'active' : 'scheduled',
        description:
          'Вход в конус тени Земли на 36 минут. Нулевая солнечная генерация, переход на буферные литий-ионные аккумуляторы, охлаждение корпуса спутника до -18 °C.',
        iconName: 'Sun',
        criticality: 'normal',
        evidence: [
          {
            key: 'illum',
            label: 'Освещенность орбиты',
            value: isEclipse ? 'ТЕНЬ ЗЕМЛИ (100% ECLIPSE)' : 'СОЛНЕЧНАЯ СТОРОНА',
            status: isEclipse ? 'warning' : 'nominal',
          },
          {
            key: 'soc',
            label: 'Буфер АКБ',
            value: `${telemetry.batterySocPercent}% (${telemetry.batteryVoltage} В)`,
            status: 'nominal',
          },
          {
            key: 'pwr',
            label: 'Мощность солнечных батарей',
            value: isEclipse ? '0.0 Вт' : `${telemetry.solarPowerW} Вт`,
            status: isEclipse ? 'warning' : 'nominal',
          },
        ],
      },
      {
        id: 'evt_ground_pass',
        timestamp: 'Орбитальный цикл #2',
        relativeMinutes: 104,
        title: 'Сеанс радиосвязи с наземной станцией GS-01 Пермь / GS-03 Восточный',
        category: 'radio',
        status: isTransmitting ? 'active' : 'scheduled',
        description:
          'Пролет зоны радиовидимости (радиус 1400 км, углы места > 10°). Переключение передатчика в высокоскоростной режим 9.6 кбит/с и передача накопленных научных данных.',
        iconName: 'Radio',
        criticality: 'normal',
        evidence: [
          {
            key: 'contact',
            label: 'Радиоконтакт',
            value: isTransmitting ? 'ПРЯМАЯ ВИДИМОСТЬ GS-01' : 'ОЖИДАНИЕ ЗОНЫ ВИДИМОСТИ',
            status: isTransmitting ? 'active' : 'nominal',
          },
          {
            key: 'rate',
            label: 'Скорость радиоканала',
            value: `${telemetry.downlinkSpeedKbps} кбит/с`,
            status: isTransmitting ? 'active' : 'nominal',
          },
          {
            key: 'latlon',
            label: 'Подспутниковая точка',
            value: `${telemetry.latitude}° N, ${telemetry.longitude}° E`,
            status: 'nominal',
          },
        ],
      },
    ];
  }, [telemetry]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return timelineEvents;
    return timelineEvents.filter((evt) => evt.category === selectedCategory);
  }, [timelineEvents, selectedCategory]);

  const selectedEvent = useMemo(() => {
    return timelineEvents.find((e) => e.id === selectedEventId) || timelineEvents[0];
  }, [timelineEvents, selectedEventId]);

  // Status counters
  const completedCount = timelineEvents.filter((e) => e.status === 'completed').length;
  const activeCount = timelineEvents.filter((e) => e.status === 'active').length;
  const totalCount = timelineEvents.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Helper icon renderer
  const renderIcon = (name: string, className = 'h-4 w-4') => {
    switch (name) {
      case 'Sun':
        return <Sun className={className} />;
      case 'Radio':
        return <Radio className={className} />;
      case 'RotateCw':
        return <RotateCw className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'Eye':
        return <Eye className={className} />;
      default:
        return <Satellite className={className} />;
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/85 p-5 shadow-xl space-y-5 ${className}`}
    >
      {/* Top Header with Progress and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Clock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Хронология полета & Временная шкала миссии (Flight Timeline)
              </h2>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 border border-emerald-500/30">
                LIVE MET: {telemetry.timestamp}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              События развертывания антенн, панелей СБ, детамблинга и сеансов связи по циклограмме
            </p>
          </div>
        </div>

        {/* View Mode & Quick Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format toggle: Timeline flow vs Detailed list */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewFormat('flow')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewFormat === 'flow'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Интерактивная шкала
            </button>
            <button
              type="button"
              onClick={() => setViewFormat('list')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                viewFormat === 'list'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Подробный лог
            </button>
          </div>

          {/* Quick simulation mode trigger shortcuts */}
          {onForceEvent && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-slate-500 text-[10px] px-1 font-mono hidden sm:inline">
                Смоделировать:
              </span>
              <button
                type="button"
                onClick={() => onForceEvent('DETUMBLING')}
                title="Смоделировать детамблинг B-dot"
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  telemetry.mode === 'DETUMBLING'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Детамблинг
              </button>
              <button
                type="button"
                onClick={() => onForceEvent('ECLIPSE')}
                title="Смоделировать вход в тень"
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  telemetry.mode === 'ECLIPSE'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Тень
              </button>
              <button
                type="button"
                onClick={() => onForceEvent('TRANSMITTING')}
                title="Смоделировать сброс данных на станцию"
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  telemetry.mode === 'TRANSMITTING'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Сброс связи
              </button>
              <button
                type="button"
                onClick={() => onForceEvent('NORMAL')}
                title="Вернуть номинальный режим"
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  telemetry.mode === 'NORMAL'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Номинал
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Progress summary bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Выполнено этапов:</span>
            <strong className="text-white font-bold">
              {completedCount} из {totalCount} ({progressPercent}%)
            </strong>
          </div>

          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse font-mono font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 inline-block" />
              {activeCount} активно сейчас
            </span>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'all' as FilterCategory, label: 'Все события' },
            { id: 'deployment' as FilterCategory, label: 'Развертывание' },
            { id: 'subsystem' as FilterCategory, label: 'Системы' },
            { id: 'radio' as FilterCategory, label: 'Радиоканал' },
            { id: 'orbit' as FilterCategory, label: 'Орбита' },
            { id: 'payload' as FilterCategory, label: 'ПН' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW FORMAT 1: INTERACTIVE HORIZONTAL TIMELINE FLOW */}
      {viewFormat === 'flow' && (
        <div className="space-y-4">
          {/* Horizontal Scrollable Timeline Rail */}
          <div className="relative overflow-x-auto pb-4 pt-2">
            <div className="min-w-[780px] relative">
              {/* Connecting Background Line */}
              <div className="absolute top-7 left-6 right-6 h-1 bg-slate-800 rounded-full" />
              {/* Progress fill line */}
              <div
                className="absolute top-7 left-6 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, progressPercent))}%` }}
              />

              {/* Milestone Nodes */}
              <div className="relative flex justify-between gap-3">
                {filteredEvents.map((evt) => {
                  const isSelected = selectedEventId === evt.id;
                  const isCompleted = evt.status === 'completed';
                  const isActive = evt.status === 'active';

                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`flex flex-col items-center group cursor-pointer focus:outline-hidden transition-all max-w-[85px] text-center ${
                        isSelected ? 'scale-105' : 'hover:scale-102'
                      }`}
                    >
                      {/* Node Icon Circle */}
                      <div
                        className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-lg border relative ${
                          isActive
                            ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 ring-2 ring-cyan-500/50 animate-pulse'
                            : isCompleted
                              ? 'bg-slate-900 text-emerald-400 border-emerald-500/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800'
                        } ${isSelected ? 'ring-2 ring-white border-white' : ''}`}
                      >
                        {renderIcon(evt.iconName, 'h-5 w-5')}

                        {/* Status micro badge indicator */}
                        <span className="absolute -top-1 -right-1">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 bg-slate-950 rounded-full" />
                          ) : isActive ? (
                            <span className="flex h-3.5 w-3.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500" />
                            </span>
                          ) : null}
                        </span>
                      </div>

                      {/* Timestamp text */}
                      <span className="mt-2 text-[10px] font-mono font-bold text-slate-400 truncate w-full">
                        {evt.timestamp}
                      </span>

                      {/* Title truncated */}
                      <span
                        className={`mt-0.5 text-[10px] font-medium leading-tight line-clamp-2 transition-colors ${
                          isSelected
                            ? 'text-cyan-300 font-bold'
                            : isActive
                              ? 'text-white font-semibold'
                              : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {evt.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Event Details Card */}
          {selectedEvent && (
            <div className="rounded-xl border border-cyan-500/30 bg-slate-950/90 p-4 shadow-xl text-xs space-y-3 transition-all animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                    {renderIcon(selectedEvent.iconName, 'h-4 w-4')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{selectedEvent.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          selectedEvent.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : selectedEvent.status === 'active'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {selectedEvent.status === 'completed'
                          ? 'ВЫПОЛНЕНО'
                          : selectedEvent.status === 'active'
                            ? 'АКТИВНО СЕЙЧАС'
                            : 'ЗАПЛАНИРОВАНО'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Отметка циклограммы: {selectedEvent.timestamp} (T+
                      {selectedEvent.relativeMinutes} мин)
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-mono self-start sm:self-center">
                  Категория:{' '}
                  <strong className="text-slate-200 uppercase">{selectedEvent.category}</strong>
                </span>
              </div>

              {/* Description */}
              <p className="text-slate-300 leading-relaxed text-xs">{selectedEvent.description}</p>

              {/* Telemetry Evidence Grid */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                  Подтверждающие параметры телеметрии борта:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedEvent.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-slate-900 border border-slate-800 p-2.5 flex flex-col justify-between"
                    >
                      <span className="text-[10px] text-slate-400">{ev.label}</span>
                      <span
                        className={`text-xs font-mono font-bold mt-1 ${
                          ev.status === 'warning'
                            ? 'text-amber-300'
                            : ev.status === 'active'
                              ? 'text-cyan-300'
                              : 'text-emerald-300'
                        }`}
                      >
                        {ev.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW FORMAT 2: DETAILED CHRONOLOGICAL LOG FEED */}
      {viewFormat === 'list' && (
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const isCompleted = evt.status === 'completed';
            const isActive = evt.status === 'active';

            return (
              <div
                key={evt.id}
                className={`rounded-xl border p-4 transition-all space-y-3 ${
                  isActive
                    ? 'border-cyan-500/40 bg-slate-950 shadow-lg ring-1 ring-cyan-500/30'
                    : isCompleted
                      ? 'border-slate-800 bg-slate-950/60'
                      : 'border-slate-850 bg-slate-950/30 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center border ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {renderIcon(evt.iconName, 'h-3.5 w-3.5')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{evt.title}</h4>
                      <span className="text-[10px] font-mono text-cyan-400">{evt.timestamp}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border self-start sm:self-center ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isCompleted ? 'Выполнено' : isActive ? 'Активно' : 'Запланировано'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">{evt.description}</p>

                {/* Evidence row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                  {evt.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/90 rounded-md p-1.5 border border-slate-800 flex justify-between"
                    >
                      <span className="text-slate-400">{ev.label}:</span>
                      <span className="text-slate-200 font-bold">{ev.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
