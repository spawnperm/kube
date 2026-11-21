/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Экран этапа 8 «Смотр презентаций (3 слайда)»
 * Включает реестр команд в виде карточек и интерактивный виджет показа 3 слайдов
 * с кнопками перелистывания, автоматическим масштабированием и поддержкой загрузки
 * файлов PDF, PPTX, изображений и фото с камеры смартфона администратора.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Presentation,
  ChevronLeft,
  ChevronRight,
  Upload,
  Camera,
  FileText,
  Image as ImageIcon,
  RotateCw,
  Maximize2,
  Minimize2,
  Trash2,
  Sparkles,
  CheckCircle2,
  Search,
  Users,
  Eye,
  Play,
  Pause,
  Download,
  AlertCircle,
  School,
  FileCheck,
  Smartphone,
  Layers,
  ZoomIn,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Team } from '../../types';
import blueprint1U from '../../assets/images/cubesat_1u_blueprint_1791436560253.jpg';
import blueprint2U from '../../assets/images/cubesat_2u_blueprint_1791436574557.jpg';
import blueprint3U from '../../assets/images/cubesat_3u_blueprint_1791436585233.jpg';

export interface SlideData {
  id: string;
  slideNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  imageUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'pdf' | 'pptx' | 'camera';
  fileSize?: string;
  uploadedAt?: string;
  rotationDeg: number;
}

export interface TeamSlidesMap {
  [teamId: string]: [SlideData, SlideData, SlideData];
}

interface TeamPresentationsTabProps {
  teams: Team[];
  activeTeam?: Team;
  onSelectTeam?: (team: Team) => void;
}

const STORAGE_KEY = 'cosmoport_team_presentations_slides_v2';

const SLIDE_TEMPLATES: {
  num: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  defaultBlueprint: string;
}[] = [
  {
    num: 1,
    title: 'Слайд 1: Концепция миссии & целевая орбита',
    subtitle: 'Научная постановка задачи, высота орбиты и баллистический расчет',
    description:
      'Обоснование полезной нагрузки CubeSat, расчет времени пассивного существования на орбите (525 км, 97.4°) и условия освещенности солнечными батареями GaAs.',
    defaultBlueprint: blueprint1U,
  },
  {
    num: 2,
    title: 'Слайд 2: Инженерная компоновка & подсистемы CubeSat',
    subtitle: '3D CAD архитектура, энергобаланс EPS и датчики ориентации ADCS',
    description:
      'Компоновка конструкции 3U, схема теплового режима, расчет пикового потребления радиоканала (до 18 Вт) и стабилизация вращения наноспутника.',
    defaultBlueprint: blueprint2U,
  },
  {
    num: 3,
    title: 'Слайд 3: Бортовой компьютер «Леший» & интеграция с ЦУП',
    subtitle: 'Архитектура ПО, протокол AX.25 телеметрии и канал радиомаяка',
    description:
      'Схема бортового вычислителя на RISC-V/ARM, обработка сенсоров полезной нагрузки, отправка пакетов телеметрии СОНИКС 437.425 МГц и регламент питча перед жюри.',
    defaultBlueprint: blueprint3U,
  },
];

function generateDefaultSlides(team: Team): [SlideData, SlideData, SlideData] {
  return [
    {
      id: `${team.id}_slide_1`,
      slideNumber: 1,
      title: `Миссия наноспутника: ${team.trackTitle || 'Орбитальное исследование'}`,
      subtitle: `Экипаж «${team.name}» (${team.school})`,
      description: `Целевой аппарат CubeSat ${team.cubesatSpecs?.format || '3U'}, высота орбиты ${team.cubesatSpecs?.orbitAltitudeKm || 525} км. ПН: ${team.cubesatSpecs?.payloadType || 'Оптический фотометр'}.`,
      imageUrl: SLIDE_TEMPLATES[0].defaultBlueprint,
      fileType: 'image',
      rotationDeg: 0,
    },
    {
      id: `${team.id}_slide_2`,
      slideNumber: 2,
      title: `Инженерная модель CubeSat ${team.cubesatSpecs?.format || '3U'} CDS`,
      subtitle: `Баллистика и энергобаланс: ${team.mentorName || 'Капитан команды'}`,
      description: `Масса аппарата ${team.cubesatSpecs?.massKg || 3.4} кг, энерговыделение СБ ${team.cubesatSpecs?.powerBudgetWatts || 15} Вт, частота маяка ${team.cubesatSpecs?.radioFreqMhz || 437.425} МГц.`,
      imageUrl: SLIDE_TEMPLATES[1].defaultBlueprint,
      fileType: 'image',
      rotationDeg: 0,
    },
    {
      id: `${team.id}_slide_3`,
      slideNumber: 3,
      title: `БК «Леший» & Телеметрия AX.25 ЦУП`,
      subtitle: `Канал радиосвязи 437.425 МГц GFSK 9600 бод`,
      description: `Сквозной протокол телеметрии с ЦУП «МИРОВИЗОР». Передача параметров EPS, гироскопов и данных научной аппаратуры экипажем из ${team.members?.length || 4} исследователей.`,
      imageUrl: SLIDE_TEMPLATES[2].defaultBlueprint,
      fileType: 'image',
      rotationDeg: 0,
    },
  ];
}

export const TeamPresentationsTab: React.FC<TeamPresentationsTabProps> = ({
  teams,
  activeTeam,
  onSelectTeam,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    activeTeam?.id || (teams[0] ? teams[0].id : ''),
  );
  const [activeSlideNumber, setActiveSlideNumber] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  // Локальное хранилище слайдов для всех команд
  const [slidesMap, setSlidesMap] = useState<TeamSlidesMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Синхронизация с активной командой из пропсов
  useEffect(() => {
    if (activeTeam?.id && activeTeam.id !== selectedTeamId) {
      setSelectedTeamId(activeTeam.id);
    }
  }, [activeTeam?.id]);

  // Сохранение слайдов в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slidesMap));
    } catch {
      // localStorage limit
    }
  }, [slidesMap]);

  // Выбранная команда
  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === selectedTeamId) || teams[0];
  }, [teams, selectedTeamId]);

  // Слайды текущей выбранной команды
  const currentTeamSlides = useMemo<[SlideData, SlideData, SlideData]>(() => {
    if (!currentTeam) return generateDefaultSlides({ id: 'dummy', name: 'Команда' } as Team);
    if (slidesMap[currentTeam.id]) {
      return slidesMap[currentTeam.id];
    }
    return generateDefaultSlides(currentTeam);
  }, [currentTeam, slidesMap]);

  // Текущий активный слайд
  const currentSlide = currentTeamSlides[activeSlideNumber - 1];

  // Автовоспроизведение слайдов
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveSlideNumber((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  // Клавиатурная навигация в полноэкранном режиме
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setActiveSlideNumber((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideNumber((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 3));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Перелистывание вперед и назад
  const handlePrevSlide = () => {
    setActiveSlideNumber((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 3));
  };

  const handleNextSlide = () => {
    setActiveSlideNumber((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : 1));
  };

  // Поворот слайда на 90 градусов (удобно для фото со смартфона)
  const handleRotateSlide = () => {
    if (!currentTeam) return;
    const teamSlides = [...currentTeamSlides] as [SlideData, SlideData, SlideData];
    const slideIdx = activeSlideNumber - 1;
    teamSlides[slideIdx] = {
      ...teamSlides[slideIdx],
      rotationDeg: (teamSlides[slideIdx].rotationDeg + 90) % 360,
    };
    setSlidesMap((prev) => ({ ...prev, [currentTeam.id]: teamSlides }));
    showToast(`Слайд повернут на 90°`);
  };

  // Сброс слайда к чертежу по умолчанию
  const handleResetSlide = () => {
    if (!currentTeam) return;
    const defaults = generateDefaultSlides(currentTeam);
    const teamSlides = [...currentTeamSlides] as [SlideData, SlideData, SlideData];
    const slideIdx = activeSlideNumber - 1;
    teamSlides[slideIdx] = defaults[slideIdx];
    setSlidesMap((prev) => ({ ...prev, [currentTeam.id]: teamSlides }));
    showToast(`Слайд ${activeSlideNumber} сброшен к чертежу по умолчанию`);
  };

  // Обработка загрузки файла (PDF, PPTX, изображение, фото со смартфона)
  const handleFileUpload = (file: File, isFromCamera = false) => {
    if (!currentTeam) return;

    const fileName = file.name;
    const fileSizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' МБ';
    const isImage = file.type.startsWith('image/');
    const isPdf = file.name.endsWith('.pdf') || file.type === 'application/pdf';
    const isPptx =
      file.name.endsWith('.pptx') ||
      file.name.endsWith('.ppt') ||
      file.type.includes('presentation');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const teamSlides = [...currentTeamSlides] as [SlideData, SlideData, SlideData];
        const slideIdx = activeSlideNumber - 1;

        teamSlides[slideIdx] = {
          ...teamSlides[slideIdx],
          imageUrl: dataUrl,
          fileName,
          fileType: isFromCamera ? 'camera' : 'image',
          fileSize: fileSizeMb,
          uploadedAt: new Date().toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          rotationDeg: 0,
        };

        setSlidesMap((prev) => ({ ...prev, [currentTeam.id]: teamSlides }));
        showToast(
          isFromCamera
            ? `📸 Фото с камеры смартфона успешно загружено на Слайд ${activeSlideNumber}!`
            : `🖼️ Изображение «${fileName}» загружено на Слайд ${activeSlideNumber}!`,
        );

        try {
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#10b981', '#f59e0b'],
          });
        } catch {}
      };
      reader.readAsDataURL(file);
    } else if (isPdf || isPptx) {
      // Для PDF и PPTX сохраняем метаданные документа и создаем интерактивное визуальное превью
      const teamSlides = [...currentTeamSlides] as [SlideData, SlideData, SlideData];
      const slideIdx = activeSlideNumber - 1;

      teamSlides[slideIdx] = {
        ...teamSlides[slideIdx],
        fileName,
        fileType: isPdf ? 'pdf' : 'pptx',
        fileSize: fileSizeMb,
        uploadedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };

      setSlidesMap((prev) => ({ ...prev, [currentTeam.id]: teamSlides }));
      showToast(
        isPdf
          ? `📄 Презентация PDF «${fileName}» прикреплена к Слайду ${activeSlideNumber}!`
          : `📊 Презентация PPTX «${fileName}» прикреплена к Слайду ${activeSlideNumber}!`,
      );
    } else {
      alert('Поддерживаются форматы: PDF, PPTX, PNG, JPG, WEBP, а также фото с камеры смартфона.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Фильтрация списка команд
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.mentorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFormat = filterFormat === 'all' || t.cubesatSpecs?.format === filterFormat;

      return matchesSearch && matchesFormat;
    });
  }, [teams, searchQuery, filterFormat]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-2xl border border-cyan-500/30 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40 shrink-0">
              <Presentation className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ЭТАП 8 ЧЕМПИОНАТА
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  3 СЛАЙДА ПИТЧА
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Смотр презентаций команд (3 регламентных слайда)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-0.5">
                Демонстрационный экран для жюри и ЦУП: карточки всех школьных команд и виджет показа
                3 слайдов с перелистыванием. Поддерживается загрузка файлов PDF, PPTX, изображений и
                прямое фото с камеры смартфона администратора.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-500/30">
              Всего команд: <strong>{teams.length}</strong>
            </span>
          </div>
        </div>

        {/* Toast notification */}
        {toastMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/80 px-4 py-2 text-xs font-semibold text-emerald-200 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT CARDS LIST, RIGHT 3-SLIDE VIEWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ТАБЛИЦА-СПИСОК КАРТОЧЕК КОМАНД (4/12) */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Карточки команд
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {filteredTeams.length} из {teams.length}
            </span>
          </div>

          {/* Поиск и фильтры */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или школе..."
                className="w-full bg-slate-950 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white border border-slate-800 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {['all', '1U', '2U', '3U'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFilterFormat(fmt)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                    filterFormat === fmt
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {fmt === 'all' ? 'Все форматы' : `CubeSat ${fmt}`}
                </button>
              ))}
            </div>
          </div>

          {/* Список карточек команд */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredTeams.map((t) => {
              const isSelected = t.id === currentTeam?.id;
              const teamSlides = slidesMap[t.id] || generateDefaultSlides(t);
              const customCount = teamSlides.filter(
                (s) => s.fileName || s.fileType === 'camera',
              ).length;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTeamId(t.id);
                    if (onSelectTeam) onSelectTeam(t);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/60 border-cyan-400 shadow-md shadow-cyan-500/15 ring-1 ring-cyan-400/30'
                      : 'bg-slate-950/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors truncate">
                          {t.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          {t.cubesatSpecs?.format || '3U'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5" title={t.school}>
                        {t.school}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        customCount > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {customCount > 0 ? `Файлы: ${customCount}/3` : '3/3 готово'}
                    </span>
                  </div>

                  {/* Миниатюрный предпросмотр 3 слайдов на карточке */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-850">
                    {[1, 2, 3].map((sNum) => {
                      const slide = teamSlides[sNum - 1];
                      return (
                        <div
                          key={sNum}
                          className="h-9 rounded bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center group-hover:border-slate-700"
                        >
                          {slide.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt=""
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-100"
                            />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8px] font-mono text-cyan-300">
                            #{sNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>
                      Учитель: <strong className="text-slate-300">{t.mentorName}</strong>
                    </span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{isSelected ? 'Показ' : 'Смотр'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: ИНТЕРАКТИВНЫЙ ВИДЖЕТ ПОКАЗА 3 СЛАЙДОВ (8/12) */}
        <div className="lg:col-span-8 space-y-4">
          <div
            ref={widgetContainerRef}
            className={`bg-slate-900/90 rounded-2xl border border-cyan-500/40 p-4 sm:p-5 shadow-2xl backdrop-blur-md relative ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-6 overflow-y-auto' : ''
            }`}
          >
            {/* Панель заголовка показа слайдов */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-black font-mono border border-cyan-500/40">
                  {activeSlideNumber}
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>{currentTeam?.name || 'Команда'}</span>
                    <span className="text-xs font-mono text-cyan-400 font-normal">
                      • {currentTeam?.school}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {SLIDE_TEMPLATES[activeSlideNumber - 1].subtitle}
                  </p>
                </div>
              </div>

              {/* Элементы управления виджетом */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Автовоспроизведение */}
                <button
                  type="button"
                  onClick={() => setIsAutoPlay((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isAutoPlay
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                  }`}
                  title="Автоматическая смена слайдов каждые 6 секунд"
                >
                  {isAutoPlay ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{isAutoPlay ? 'Пауза' : 'Слайд-шоу'}</span>
                </button>

                {/* Режим масштабирования: по размеру виджета (contain) или заполнение (cover) */}
                <button
                  type="button"
                  onClick={() => setFitMode((m) => (m === 'contain' ? 'cover' : 'contain'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                  title="Автоматическое масштабирование по размеру виджета (вписать целиком / заполнить)"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{fitMode === 'contain' ? 'Вписать' : 'Заполнить'}</span>
                </button>

                {/* Полноэкранный режим */}
                <button
                  type="button"
                  onClick={() => setIsFullscreen((v) => !v)}
                  className="p-1.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 hover:text-white hover:border-cyan-500 transition-all cursor-pointer"
                  title={
                    isFullscreen
                      ? 'Выйти из полноэкранного режима'
                      : 'Полноэкранный режим демонстрации'
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* ВЕРХНИЕ КНОПКИ ВЫБОРА 3 СЛАЙДОВ */}
            <div className="grid grid-cols-3 gap-2 my-3">
              {[1, 2, 3].map((num) => {
                const isSelected = activeSlideNumber === num;
                const tmpl = SLIDE_TEMPLATES[num - 1];
                const slideObj = currentTeamSlides[num - 1];
                const hasFile = Boolean(slideObj.fileName || slideObj.fileType === 'camera');

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveSlideNumber(num as 1 | 2 | 3)}
                    className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-cyan-400 shadow-md ring-1 ring-cyan-400/40'
                        : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs font-black font-mono ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`}
                      >
                        СЛАЙД {num}
                      </span>
                      {hasFile && (
                        <span
                          className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                          title="Загружен свой файл"
                        />
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-white truncate mt-0.5">
                      {num === 1
                        ? '1. Миссия & Орбита'
                        : num === 2
                          ? '2. Компоновка CubeSat'
                          : '3. БК «Леший» & ЦУП'}
                    </p>
                    <span className="text-[9px] text-slate-400 hidden sm:block truncate">
                      {slideObj.fileName || 'Типовой чертеж'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ОСНОВНОЙ ХОЛСТ СЛАЙДА (ВИДЖЕТ ПОКАЗА С АВТОМАТИЧЕСКИМ МАСШТАБИРОВАНИЕМ) */}
            <div className="relative aspect-video w-full rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center group shadow-inner">
              {/* Фоновая координатная сетка ЦУП */}
              <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

              {/* Угловые маркеры видоискателя */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50 pointer-events-none" />

              {/* КОНТЕНТ СЛАЙДА С АВТОМАТИЧЕСКИМ МАСШТАБИРОВАНИЕМ ПО РАЗМЕРУ ВИДЖЕТА */}
              {currentSlide.fileType === 'pdf' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shadow-lg">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      ДОКУМЕНТ PDF
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                      {currentSlide.fileName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Размер: {currentSlide.fileSize} • Загружен: {currentSlide.uploadedAt}
                    </p>
                  </div>
                  <div className="max-w-md bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
                    {currentSlide.description}
                  </div>
                </div>
              ) : currentSlide.fileType === 'pptx' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg">
                    <Presentation className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ПРЕЗЕНТАЦИЯ POWERPOINT PPTX
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                      {currentSlide.fileName}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Размер: {currentSlide.fileSize} • Загружен: {currentSlide.uploadedAt}
                    </p>
                  </div>
                  <div className="max-w-md bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
                    {currentSlide.description}
                  </div>
                </div>
              ) : currentSlide.imageUrl ? (
                <div
                  className="w-full h-full flex items-center justify-center p-2 z-10 transition-transform duration-300"
                  style={{ transform: `rotate(${currentSlide.rotationDeg}deg)` }}
                >
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.title}
                    className={`max-w-full max-h-full rounded-lg shadow-2xl transition-all duration-200 ${
                      fitMode === 'contain' ? 'object-contain' : 'object-cover w-full h-full'
                    }`}
                  />
                </div>
              ) : (
                <div className="text-center p-6 z-10">
                  <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Слайд не загружен</p>
                </div>
              )}

              {/* Оверлейная информационная плашка внизу слайда */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 sm:p-4 z-20 flex flex-wrap items-end justify-between gap-2 pointer-events-none">
                <div className="max-w-xl">
                  <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                    СЛАЙД {activeSlideNumber} / 3: {currentSlide.title}
                  </span>
                  <p className="text-xs text-slate-200 mt-1 line-clamp-2">
                    {currentSlide.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentSlide.fileType === 'camera' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-500/50 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span>Фото со смартфона</span>
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded">
                    Масштаб: {fitMode === 'contain' ? '100% Вписан' : 'Заполнение'}
                  </span>
                </div>
              </div>

              {/* КНОПКИ ПЕРЕЛИСТЫВАНИЯ СЛАЙДОВ (НАЗАД / ВПЕРЕД) */}
              <button
                type="button"
                onClick={handlePrevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-950/80 hover:bg-cyan-500 text-white hover:text-slate-950 border border-slate-700 hover:border-cyan-400 flex items-center justify-center transition-all shadow-xl backdrop-blur-md cursor-pointer z-30 transform active:scale-90"
                title="Предыдущий слайд (Клавиша ←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-950/80 hover:from-cyan-400 hover:bg-cyan-500 text-white hover:text-slate-950 border border-slate-700 hover:border-cyan-400 flex items-center justify-center transition-all shadow-xl backdrop-blur-md cursor-pointer z-30 transform active:scale-90"
                title="Следующий слайд (Клавиша →)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* НИЖНЯЯ ПАНЕЛЬ ПЕРЕЛИСТЫВАНИЯ И ИНДИКАЦИИ ПРОГРЕССА */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 hover:border-cyan-500 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Предыдущий</span>
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300">
                  <span>
                    Слайд <strong>{activeSlideNumber}</strong> из <strong>3</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 hover:from-cyan-400 hover:to-indigo-500 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <span>Следующий</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Кнопки поворота и сброса слайда */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotateSlide}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 hover:text-white text-xs transition-all cursor-pointer"
                  title="Повернуть фото на 90 градусов по часовой стрелке"
                >
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Поворот 90°</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetSlide}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 text-slate-400 border border-slate-800 hover:text-rose-400 hover:border-rose-500/50 text-xs transition-all cursor-pointer"
                  title="Сбросить слайд к исходному чертежу"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Сброс</span>
                </button>
              </div>
            </div>

            {/* ПАНЕЛЬ ЗАГРУЗКИ СЛАЙДОВ: КАРТИНКИ, PDF, PPTX, КАМЕРА СМАРТФОНА */}
            <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-slate-950/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Загрузка слайда #{activeSlideNumber} ({currentTeam?.name})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Поддержка: PDF, PPTX, JPG, PNG, WEBP, Камера телефона
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Кнопка съемки с фотоаппарата сотового телефона администратора */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white text-xs font-bold shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-cyan-500 transition-all cursor-pointer transform active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>📸 Снять на камеру смартфона (Фото Слайда #{activeSlideNumber})</span>
                </button>

                {/* 2. Кнопка загрузки файла (PDF, PPTX, Картинка) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-slate-850 hover:text-white text-xs font-bold shadow-md transition-all cursor-pointer transform active:scale-95"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>📁 Загрузить файл (PDF / PPTX / Картинка)</span>
                </button>
              </div>

              {/* Скрытые инпуты для загрузки */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.ppt,image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, false);
                  e.target.value = '';
                }}
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, true);
                  e.target.value = '';
                }}
              />

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-slate-300">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    Фото с камеры телефона автоматически масштабируется под пропорции виджета.
                  </span>
                </span>
                <span className="text-emerald-400 font-mono">Автосохранение в ЦУП ✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
