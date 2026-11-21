import React, { useState } from 'react';
import {
  Rocket,
  Flame,
  Sparkles,
  Bot,
  FileText,
  Users,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Download,
  Upload,
  Plus,
  Send,
  Video,
  Image as ImageIcon,
  Paperclip,
  Share2,
  Play,
  RotateCcw,
  Zap,
  ShieldCheck,
  Shield,
  HelpCircle,
  Mic,
  Maximize2,
  BookOpen,
  Target,
  Dna,
  FlaskConical,
  Globe,
  Compass,
  Calculator,
  Code,
  ChevronDown,
  ChevronUp,
  Atom,
  UserCheck,
} from 'lucide-react';
import {
  Team,
  UserProfile,
  CaseTask,
  OfficeFileAttachment,
  MediaAttachment,
  GroupPost,
  VoiceMessageData,
} from '@/src/shared/types/index';
import { CASE_TASKS, SAMPLE_MISSION_PASSPORT } from '@/src/shared/data/mockData';
import { audioService } from '@/src/shared/lib/audioService';
import { CubeSat3DViewer } from '@/src/contexts/project/components/CubeSat3DViewer';
import { StarterQuizModal } from '@/src/contexts/crew/components/StarterQuizModal';
import { canEditTeamCard } from '@/src/contexts/crew/services/rolePermissionService';
import { PresentationModeModal } from '@/src/contexts/project/components/PresentationModeModal';
import { CubicMascot } from '@/src/contexts/ai/components/CubicMascot';
import {
  VoiceMessageRecorder,
  VoiceMessagePlayer,
} from '@/src/contexts/engagement/components/VoiceMessageModule';
import { CaseTaskDirectoryModal } from '@/src/contexts/project/components/CaseTaskDirectoryModal';

interface ShipControlScreenProps {
  team: Team;
  currentUser: UserProfile;
  officeFiles: OfficeFileAttachment[];
  mediaAttachments: MediaAttachment[];
  onUpdateTeam: (team: Team) => void;
  onAddOfficeFile: (file: OfficeFileAttachment) => void;
  onAddMediaAttachment: (media: MediaAttachment) => void;
  onAddGroupPost: (postText: string, voiceMessage?: VoiceMessageData) => void;
  onSelectTask?: (task: CaseTask) => void;
  onNavigateTab?: (tab: string, subView?: string) => void;
}

export const ShipControlScreen: React.FC<ShipControlScreenProps> = ({
  team,
  currentUser,
  officeFiles,
  mediaAttachments,
  onUpdateTeam,
  onAddOfficeFile,
  onAddMediaAttachment,
  onAddGroupPost,
  onSelectTask,
  onNavigateTab,
}) => {
  // Check if current user is authorized to edit the team (administrator, organizer, or team captain)
  const isCommander = canEditTeamCard(currentUser);
  const isCrew = currentUser.role === 'participant';

  // Active sub-tab on the ship screen
  const [activeSubTab, setActiveSubTab] = useState<'bridge' | 'slides' | 'chat' | 'space'>(
    'bridge',
  );
  const [activeSlideTab, setActiveSlideTab] = useState<1 | 2 | 3>(1);

  // Modals state
  const [isStarterQuizOpen, setIsStarterQuizOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // Edit Ship Name state (only for Commander)
  const [isEditingShipName, setIsEditingShipName] = useState(false);
  const [shipNameInput, setShipNameInput] = useState(team.shipName || team.name);

  // New Office File Modal state
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileExtension, setNewFileExtension] =
    useState<OfficeFileAttachment['extension']>('docx');
  const [newFileCategory, setNewFileCategory] =
    useState<OfficeFileAttachment['category']>('calculations');

  // New Media state
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState<'photo' | 'video'>('photo');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCaption, setNewMediaCaption] = useState('');

  // Group Post text composer state
  const [newPostText, setNewPostText] = useState('');

  // Task Directory & Roles state
  const [isTaskDirectoryOpen, setIsTaskDirectoryOpen] = useState(false);
  const [isTaskDetailsExpanded, setIsTaskDetailsExpanded] = useState(false);
  const [activePassportRoleTab, setActivePassportRoleTab] = useState<string>('physicist');
  const [selectedRoleForReport, setSelectedRoleForReport] = useState<string>('biologist');

  // Current selected case task
  const currentTask =
    CASE_TASKS.find((t) => t.id === team.selectedTaskId) ||
    CASE_TASKS.find((t) => t.id === 'task-1') ||
    CASE_TASKS[0];

  const handleSelectTaskFromDirectory = (taskId: string, taskTitle: string) => {
    const task = CASE_TASKS.find((t) => t.id === taskId);
    if (task && onSelectTask) {
      onSelectTask(task);
    } else {
      onUpdateTeam({
        ...team,
        selectedTaskId: taskId,
        selectedTaskTitle: taskTitle,
      });
    }
    setIsTaskDirectoryOpen(false);
    audioService.playSuccessChime();
  };

  const handlePublishRoleReport = (roleKey: string) => {
    const roleDetail = currentTask.roleAssignments?.[roleKey];
    if (!roleDetail) return;
    const postText =
      `📡 [ПРАКТИЧЕСКИЙ ОТЧЕТ — ${roleDetail.roleTitle.toUpperCase()}]\n` +
      `Кейс: ${currentTask.cardNumber} «${currentTask.title}»\n` +
      `Автор: ${currentUser.name}\n` +
      `Ролевая задача: ${roleDetail.taskTitle}\n\n` +
      `🔬 Теоретический результат:\n${roleDetail.scientificDeliverable}\n\n` +
      `🌐 Вклад в сообщество корабля:\n${roleDetail.socialCommunityPostRequirement}`;
    onAddGroupPost(postText);
    audioService.playSuccessChime();
  };

  // Slides data
  const currentSlide = team.slides[activeSlideTab - 1];

  const handleSaveShipName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCommander || !shipNameInput.trim()) return;

    onUpdateTeam({
      ...team,
      name: shipNameInput.trim(),
      shipName: shipNameInput.trim(),
    });
    setIsEditingShipName(false);
    audioService.playSuccessChime();
  };

  const handleSaveSlideContent = (
    field: 'title' | 'subtitle' | 'content' | 'calculations',
    val: string,
  ) => {
    if (!isCommander) return; // Read-only for crew

    const updatedSlides = [...team.slides] as [
      (typeof team.slides)[0],
      (typeof team.slides)[1],
      (typeof team.slides)[2],
    ];
    updatedSlides[activeSlideTab - 1] = {
      ...updatedSlides[activeSlideTab - 1],
      [field]: val,
      updatedAt: new Date().toLocaleDateString(),
    };

    onUpdateTeam({
      ...team,
      slides: updatedSlides,
    });
  };

  const handleCreateOfficeFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fullFileName = newFileName.includes('.')
      ? newFileName
      : `${newFileName}.${newFileExtension}`;

    const newFile: OfficeFileAttachment = {
      id: `file-${Date.now()}`,
      name: fullFileName,
      sizeKb: Math.floor(Math.random() * 800) + 120,
      extension: newFileExtension,
      uploadedAt: 'Только что',
      uploaderName: currentUser.name,
      uploaderRole: currentUser.role,
      teamId: team.id,
      category: newFileCategory,
    };

    onAddOfficeFile(newFile);
    setIsAddFileModalOpen(false);
    setNewFileName('');
    audioService.playSuccessChime();
  };

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaTitle.trim()) return;

    const newMedia: MediaAttachment = {
      id: `media-${Date.now()}`,
      title: newMediaTitle,
      type: newMediaType,
      url:
        newMediaUrl.trim() ||
        (newMediaType === 'video'
          ? 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800&q=80'),
      uploadedAt: 'Только что',
      uploaderName: currentUser.name,
      teamId: team.id,
      caption: newMediaCaption,
    };

    onAddMediaAttachment(newMedia);
    setIsAddMediaModalOpen(false);
    setNewMediaTitle('');
    setNewMediaUrl('');
    setNewMediaCaption('');
    audioService.playSuccessChime();
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    onAddGroupPost(newPostText.trim());
    setNewPostText('');
    audioService.playSuccessChime();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* SHIP HEADER CARD */}
      <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Ship Identity */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] uppercase font-bold">
                {team.cubesatFormat || '3U'} СТАНДАРТ CUBESAT
              </span>
              <span className="text-xs font-mono text-slate-400">
                {team.shipCallsign || 'Борт-01 «Орион-81»'}
              </span>
              {team.school && (
                <span className="text-xs text-slate-400 truncate max-w-xs">• {team.school}</span>
              )}
            </div>

            {/* Editable Ship Name (only for commander) */}
            {isEditingShipName ? (
              <form onSubmit={handleSaveShipName} className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={shipNameInput}
                  onChange={(e) => setShipNameInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shrink-0 hover:bg-indigo-500"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingShipName(false)}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs shrink-0 hover:text-white"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  «{team.shipName || team.name}»
                </h1>
                {isCommander && (
                  <button
                    onClick={() => {
                      setShipNameInput(team.shipName || team.name);
                      setIsEditingShipName(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Изменить название корабля (доступно командиру)"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Mission Objective info */}
            <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2 max-w-2xl">
              🎯 <strong>Цель миссии:</strong> {team.selectedTaskTitle || currentTask.title}
            </p>
          </div>

          {/* Fuel Level & Presentation Mode Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Plasma Fuel Tank Indicator */}
            <div className="w-full sm:w-48 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Топливные баки:
                </span>
                <span className="text-cyan-300 font-bold font-mono">{team.fuelPercent || 85}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${team.fuelPercent || 85}%` }}
                />
              </div>
              <button
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('quiz');
                  } else {
                    setIsStarterQuizOpen(true);
                  }
                }}
                className="w-full text-center text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors pt-0.5 block cursor-pointer"
              >
                Заправить баки: Орбитальный экзамен с Кубиком →
              </button>
            </div>
          </div>
        </div>

        {/* 3. NAVIGATION TABS ON THE SHIP */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'bridge', label: '🚀 Бортовой мостик (Обзор & 3D)', icon: Rocket },
            { id: 'slides', label: '📊 3 Слайда защиты миссии', icon: FileText },
            { id: 'chat', label: '🤖 Бортовой чат и AI-Кубик', icon: Bot },
            { id: 'space', label: '📁 Файлы, Фото и Видео экипажа', icon: Paperclip },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
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

      {/* 4. SUB-TAB VIEW RENDERERS */}

      {/* TAB 1: BRIDGE (OVERVIEW & 3D CUBESAT) */}
      {activeSubTab === 'bridge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: 3D CubeSat Interactive Viewer */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-cyan-400" />
                    <span>3D-модель спутника «{team.cubesatName}»</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Интерактивная компоновка: развертывание солнечных батарей и проверка подсистем
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                  {team.cubesatFormat || '3U'}
                </span>
              </div>

              {/* 3D Canvas component */}
              <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-indigo-500/20 shadow-inner bg-slate-950">
                <CubeSat3DViewer passport={team.missionPassport || SAMPLE_MISSION_PASSPORT} />
              </div>
            </div>

            {/* Mission Task Details Card */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-3.5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 font-mono text-cyan-300 font-bold text-[11px]">
                        {currentTask.cardNumber}
                      </span>
                      <span className="text-xs font-bold text-white">
                        Паспорт космического кейса
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {currentTask.categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTaskDirectoryOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Справочник 500 кейсов</span>
                  </button>
                  {isCommander && (
                    <button
                      type="button"
                      onClick={() => setIsTaskDirectoryOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Сменить кейс
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Grand Mission Goal */}
              <div className="space-y-2">
                <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {currentTask.title}
                </h4>

                {currentTask.grandMissionGoal && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-950 to-slate-900 border border-indigo-500/30 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-400" />
                      Большая общая цель экипажа корабля:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {currentTask.grandMissionGoal}
                    </p>
                  </div>
                )}
              </div>

              {/* CubeSat Hardware Specifications */}
              {currentTask.cubesatSpecs && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                    Формат: <strong>{currentTask.cubesatSpecs.format}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300">
                    Орбита: {currentTask.cubesatSpecs.orbitType} (
                    {currentTask.cubesatSpecs.altitudeKm} км, i=
                    {currentTask.cubesatSpecs.inclinationDeg}°)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300">
                    Нагрузка: {currentTask.cubesatSpecs.primaryPayload}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300">
                    Мощность: {currentTask.cubesatSpecs.powerConsumptionWatts} Вт
                  </span>
                </div>
              )}

              {/* Toggle to expand Theory & Roles */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsTaskDetailsExpanded(!isTaskDetailsExpanded)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-indigo-300 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Atom className="w-4 h-4 text-cyan-400" />
                    <span>
                      {isTaskDetailsExpanded
                        ? 'Скрыть теоретическую часть и роли'
                        : 'Развернуть формулы, теорию и ролевую модель (9 специалистов)'}
                    </span>
                  </span>
                  {isTaskDetailsExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Expanded details */}
              {isTaskDetailsExpanded && (
                <div className="space-y-4 pt-2 border-t border-slate-800/80 animate-fadeIn">
                  {/* Theoretical Part */}
                  {currentTask.theoreticalPart && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                        <Atom className="w-3.5 h-3.5" />
                        Теоретическая часть и физические явления:
                      </span>
                      <p className="text-slate-300 leading-relaxed">
                        {currentTask.theoreticalPart.phenomenaDescription}
                      </p>
                      {currentTask.theoreticalPart.formulas &&
                        currentTask.theoreticalPart.formulas.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-mono text-slate-500">
                              Ключевые формулы модели:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {currentTask.theoreticalPart.formulas.map((f, i) => (
                                <div
                                  key={i}
                                  className="p-2 rounded-lg bg-slate-900 border border-slate-800"
                                >
                                  <div className="text-[10px] text-indigo-300 font-semibold">
                                    {f.title}
                                  </div>
                                  <code className="text-cyan-300 font-mono text-xs block py-0.5">
                                    {f.latex}
                                  </code>
                                  <div className="text-[10px] text-slate-400">{f.description}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Role Assignments Breakdown */}
                  {currentTask.roleAssignments && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                          <UserCheck className="w-3.5 h-3.5" />
                          Ролевая модель экипажа:
                        </span>
                        <span className="text-[11px] text-slate-400">Выберите роль:</span>
                      </div>

                      {/* Role Tabs */}
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-xs">
                        {Object.entries(currentTask.roleAssignments).map(([rKey, rVal]) => (
                          <button
                            key={rKey}
                            type="button"
                            onClick={() => setActivePassportRoleTab(rKey)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                              activePassportRoleTab === rKey
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {rVal.roleTitle}
                          </button>
                        ))}
                      </div>

                      {/* Active Role Content */}
                      {currentTask.roleAssignments[activePassportRoleTab] &&
                        (() => {
                          const r = currentTask.roleAssignments[activePassportRoleTab];
                          return (
                            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                <span className="font-bold text-white text-xs">{r.taskTitle}</span>
                                <button
                                  type="button"
                                  onClick={() => handlePublishRoleReport(activePassportRoleTab)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Внести отчёт роли в сообщество</span>
                                </button>
                              </div>
                              <p className="text-slate-300 leading-relaxed">{r.taskDescription}</p>
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-cyan-300">
                                <strong>Результат:</strong> {r.scientificDeliverable}
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Crew Chairs & Roles */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Штатное расписание экипажа</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {team.members.length} космонавтов
                </span>
              </div>

              {/* Navigator Kubik Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-950 border border-cyan-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-400 flex items-center justify-center text-lg">
                  🤖
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">AI Штурман Кубик</span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-semibold">
                      Gemini 3.8 Flash
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Голосовой и текстовый расчет физики и формул
                  </span>
                </div>
              </div>

              {/* Student Crew Members */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Исследовательский состав (школьники):
                </span>
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{member.name}</span>
                        <span className="text-[10px] text-indigo-400 font-mono">
                          {member.assignedRole || member.role}
                        </span>
                      </div>
                    </div>

                    <span className="text-emerald-400 text-[11px] flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Активен
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3 SLIDES OF DEFENSE */}
      {activeSubTab === 'slides' && (
        <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>3 Слайда защиты миссии перед жюри</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isCommander
                  ? 'Вы в режиме редактирования слайдов (Командир корабля). Заполняйте формулы и выводы.'
                  : 'Режим экипажа (только просмотр слайдов). Редактирование закреплено за Командиром.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPresentationOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Полноэкранный режим</span>
              </button>
            </div>
          </div>

          {/* Slide selector pills */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => setActiveSlideTab(num as any)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  activeSlideTab === num
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                Слайд {num}:{' '}
                {num === 1
                  ? 'Задача и экипаж'
                  : num === 2
                    ? 'Физико-математическая модель'
                    : 'Компоновка и выводы'}
              </button>
            ))}
          </div>

          {/* Slide Content Viewer / Editor */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-400 font-mono font-bold">
                СЛАЙД {activeSlideTab} ИЗ 3
              </span>
              <span className="text-slate-400 text-[11px]">
                Обновлено: {currentSlide?.updatedAt || 'Сегодня'}
              </span>
            </div>

            {/* Slide Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Заголовок слайда:</label>
              {isCommander ? (
                <input
                  type="text"
                  value={currentSlide?.title || ''}
                  onChange={(e) => handleSaveSlideContent('title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-white font-bold text-sm">
                  {currentSlide?.title || 'Без названия'}
                </div>
              )}
            </div>

            {/* Slide Content */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Содержание и тезисы доклада (3 минуты):
              </label>
              {isCommander ? (
                <textarea
                  rows={4}
                  value={currentSlide?.content || ''}
                  onChange={(e) => handleSaveSlideContent('content', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {currentSlide?.content || 'Текст слайда ещё не заполнен командиром.'}
                </div>
              )}
            </div>

            {/* Specific Calculations block on Slide 2 */}
            {activeSlideTab === 2 && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Физико-математические формулы и расчеты:</span>
                  <span className="text-cyan-400 font-mono text-[10px]">LaTeX / Формулы</span>
                </label>
                {isCommander ? (
                  <textarea
                    rows={3}
                    value={currentSlide?.calculations || ''}
                    onChange={(e) => handleSaveSlideContent('calculations', e.target.value)}
                    placeholder="Введите расчетные формулы баллистики, аэродинамического торможения..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-cyan-300 text-xs focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-cyan-300 text-xs">
                    {currentSlide?.calculations || 'Расчеты еще не внесены.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ONBOARD CHAT & AI MASCOT KUBIK */}
      {activeSubTab === 'chat' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Бортовой AI-штурман «Кубик» и командный чат
                </h3>
                <p className="text-xs text-slate-400">
                  Доступен командиру и всем членам экипажа: голосовые и текстовые консультации по
                  физике, химии и регламенту
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
              ● Онлайн
            </span>
          </div>

          <CubicMascot team={team} isOnline={true} />
        </div>
      )}

      {/* TAB 4: CREW SPACE (OFFICE FILES, PHOTOS & VIDEOS) */}
      {activeSubTab === 'space' && (
        <div className="space-y-6">
          {/* Section A: Team Group Wall / Feed */}
          <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Командная лента новостей и заметок корабля</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Все члены экипажа могут публиковать заметки, мысли и отчёты о ходе работы
                </p>
              </div>
            </div>

            {/* Practical Role Deliverables Card according to currentTask */}
            {currentTask.roleAssignments && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-950 to-slate-900 border border-indigo-500/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                      <Target className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Практическая часть: внесение отчёта специалиста через социальный профиль
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Каждый член экипажа публикует данные своей дисциплины в бортовое сообщество
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                    Кейс: {currentTask.cardNumber}
                  </span>
                </div>

                {/* Role selector tabs for submitting reports */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Выберите роль для публикации отчёта:</span>
                    <span className="text-cyan-400 font-mono">9 специализаций экипажа</span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                    {Object.entries(currentTask.roleAssignments).map(([rKey, rVal]) => {
                      const isSel = selectedRoleForReport === rKey;
                      return (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => setSelectedRoleForReport(rKey)}
                          className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap text-xs transition-all cursor-pointer ${
                            isSel
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {rVal.roleTitle}
                        </button>
                      );
                    })}
                  </div>

                  {currentTask.roleAssignments[selectedRoleForReport] &&
                    (() => {
                      const r = currentTask.roleAssignments[selectedRoleForReport];
                      return (
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-white text-xs">{r.taskTitle}</span>
                            <button
                              type="button"
                              onClick={() => handlePublishRoleReport(selectedRoleForReport)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Внести отчёт «{r.roleTitle}» в бортовой журнал</span>
                            </button>
                          </div>

                          <p className="text-slate-300 leading-relaxed text-[11px]">
                            <strong>Требование к публикации:</strong>{' '}
                            {r.socialCommunityPostRequirement}
                          </p>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-cyan-300 font-mono">
                            🔬 {r.scientificDeliverable}
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            )}

            {/* Quick Post Creator */}
            <form onSubmit={handlePublishPost} className="space-y-2.5">
              <textarea
                rows={2}
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder={`Напишите заметку в бортовой журнал корабля «${team.shipName || team.name}»…`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Автор: <strong className="text-white">{currentUser.name}</strong> (
                  {currentUser.role === 'mentor' ? 'Капитан' : 'Член экипажа'})
                </span>
                <button
                  type="submit"
                  disabled={!newPostText.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Опубликовать</span>
                </button>
              </div>
            </form>

            {/* Wall posts list */}
            <div className="space-y-3 pt-2">
              {team.groupPosts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{post.authorName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{post.createdAt}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{post.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Office Documents Attachment (.docx, .xlsx, .pdf, .pptx) */}
          <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Офисные файлы и документы команды</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Прикрепление файлов в форматах DOCX, XLSX, PDF, PPTX (расчеты, спецификации,
                  чертежи)
                </p>
              </div>

              <button
                onClick={() => setIsAddFileModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Прикрепить файл</span>
              </button>
            </div>

            {/* Office Files List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {officeFiles.map((file) => {
                const getExtBadge = () => {
                  switch (file.extension) {
                    case 'docx':
                      return 'bg-blue-600 text-white';
                    case 'xlsx':
                      return 'bg-emerald-600 text-white';
                    case 'pptx':
                      return 'bg-amber-600 text-white';
                    case 'pdf':
                      return 'bg-rose-600 text-white';
                    default:
                      return 'bg-slate-700 text-white';
                  }
                };

                return (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase shrink-0 ${getExtBadge()}`}
                      >
                        {file.extension}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{file.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{file.sizeKb} КБ</span>
                          <span>•</span>
                          <span>{file.uploaderName}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => audioService.playSuccessChime()}
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                      title="Скачать документ"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section C: Photos and Videos from Championship Event */}
          <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>Фото и видеоматериалы с площадки чемпионата</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Медиахроника сборки, калибровки в лаборатории и защит проекта
                </p>
              </div>

              <button
                onClick={() => setIsAddMediaModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Загрузить фото/видео</span>
              </button>
            </div>

            {/* Media Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mediaAttachments.map((media) => (
                <div
                  key={media.id}
                  className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-md flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                    <img src={media.url} alt={media.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                      {media.type === 'video' ? (
                        <>
                          <Video className="w-3 h-3 text-rose-400" /> Видеозапись
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3 text-cyan-400" /> Фотография
                        </>
                      )}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-1">
                    <h4 className="text-xs font-bold text-white leading-snug">{media.title}</h4>
                    {media.caption && (
                      <p className="text-[11px] text-slate-400 leading-relaxed">{media.caption}</p>
                    )}
                    <div className="pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                      <span>Автор: {media.uploaderName}</span>
                      <span>{media.uploadedAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: ADD OFFICE FILE */}
      {isAddFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                <span>Прикрепить офисный документ</span>
              </h3>
              <button
                onClick={() => setIsAddFileModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOfficeFile} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Название файла:</label>
                <input
                  type="text"
                  placeholder="Например: Расчет_баллистики_термосферы"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Формат файла:</label>
                  <select
                    value={newFileExtension}
                    onChange={(e) => setNewFileExtension(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="pdf">PDF документ (.pdf)</option>
                    <option value="pptx">PowerPoint (.pptx)</option>
                    <option value="txt">Текст (.txt)</option>
                    <option value="csv">Таблица CSV (.csv)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Категория:</label>
                  <select
                    value={newFileCategory}
                    onChange={(e) => setNewFileCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="calculations">Расчеты и формулы</option>
                    <option value="presentation">Слайды и презентация</option>
                    <option value="specs">Спецификация 3U</option>
                    <option value="report">Итоговый отчет</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-slate-400">
                <Upload className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                <span>
                  Файл будет прикреплен к пространству корабля «{team.shipName || team.name}»
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFileModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Прикрепить документ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ADD MEDIA */}
      {isAddMediaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Загрузить фото или видео с мероприятия</span>
              </h3>
              <button
                onClick={() => setIsAddMediaModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedia} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Заголовок материала:</label>
                <input
                  type="text"
                  placeholder="Например: Испытания датчика в лаборатории 3D"
                  value={newMediaTitle}
                  onChange={(e) => setNewMediaTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Тип контента:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMediaType('photo')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors ${
                      newMediaType === 'photo'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    📷 Фотоснимок
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMediaType('video')}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors ${
                      newMediaType === 'video'
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🎥 Видеозапись
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Подпись / Описание момента:</label>
                <textarea
                  rows={2}
                  placeholder="Кто на фото, что происходило на этапе..."
                  value={newMediaCaption}
                  onChange={(e) => setNewMediaCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMediaModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Добавить в альбом
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. STARTER QUIZ MODAL (FUEL REFILL) */}
      <StarterQuizModal
        isOpen={isStarterQuizOpen}
        onClose={() => setIsStarterQuizOpen(false)}
        shipName={team.shipName || team.name}
        currentFuel={team.fuelPercent || 85}
        onQuizComplete={(fuelAmount: number) => {
          onUpdateTeam({
            ...team,
            fuelPercent: fuelAmount,
            starterQuizPassed: fuelAmount >= 80,
          });
          setIsStarterQuizOpen(false);
          audioService.playSuccessChime();
        }}
      />

      {/* 8. PRESENTATION MODE MODAL */}
      <PresentationModeModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        team={team}
      />

      {/* 9. CASE TASK DIRECTORY MODAL (500 TASKS) */}
      <CaseTaskDirectoryModal
        isOpen={isTaskDirectoryOpen}
        onClose={() => setIsTaskDirectoryOpen(false)}
        targetTeam={{
          id: team.id,
          orderNumber: 1,
          school: team.school,
          city: team.city,
          mentorName: team.mentorName,
          mentorEmail: team.mentorEmail,
          captainTitle: 'Капитан корабля',
          shipCallsign: team.cubesatName || 'Борт',
          shipName: team.shipName || team.name,
          cubesatName: team.cubesatName,
          cubesatFormat: team.cubesatFormat,
          students: team.members.map((m) => ({
            raw: m.name,
            name: m.name,
            gradeText: '9 класс',
            gradeNumber: 9,
            assignedRole: (m.role as any) || 'physicist',
            roleTitle: m.roleTitle || 'Исследователь',
            discipline: 'Физика',
          })),
          status: 'registered_active',
          waitlistPosition: 1,
          navigatorMascot: {
            name: 'Кубик',
            role: 'navigator' as const,
            roleTitle: 'Штурман (AI)',
            description: 'Бортовой AI-оркестратор и навигация экипажа.',
          },
          selectedTaskId: team.selectedTaskId,
          selectedTaskTitle: team.selectedTaskTitle,
        }}
        tasks={CASE_TASKS}
        currentUser={currentUser}
        onSelectTask={handleSelectTaskFromDirectory}
        onPublishCommunityPost={(text) => onAddGroupPost(text)}
      />
    </div>
  );
};
