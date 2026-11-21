import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Wand2,
  X,
  Check,
  Download,
  RefreshCw,
  Rocket,
  Atom,
  Cpu,
  Layers,
  Shield,
  Eye,
  Camera,
  Bot,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioService } from '@/src/shared/lib/audioService';

import commanderImg from '@/src/assets/images/space_explorer_commander_1790230084463.jpg';
import physicistImg from '@/src/assets/images/space_explorer_physicist_1790230095673.jpg';
import engineerImg from '@/src/assets/images/space_explorer_engineer_1790230107372.jpg';

interface AiAvatarGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: string;
  teamName: string;
  cubesatName: string;
  currentAvatarUrl?: string;
  onApplyAvatar: (avatarUrl: string) => void;
}

interface ExplorerPreset {
  id: string;
  name: string;
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  baseImg: string;
  badge: string;
  prompt: string;
  accentColor: string;
  suitType: string;
}

const EXPLORER_PRESETS: ExplorerPreset[] = [
  {
    id: 'commander',
    name: 'Командир корабля',
    title: 'Капитан звездного экипажа',
    icon: Rocket,
    baseImg: commanderImg,
    badge: 'COMMANDER',
    prompt:
      'Героический командир космического корабля в титановом скафандре с золотым светоотражающим визором на мостике',
    accentColor: '#6366f1',
    suitType: 'Тяжелый орбитальный скафандр «Орлан-К»',
  },
  {
    id: 'physicist',
    name: 'Астрофизик',
    title: 'Исследователь термосферы',
    icon: Atom,
    baseImg: physicistImg,
    badge: 'ASTROPHYSICIST',
    prompt:
      'Ученый-астрофизик с неоновыми голографическими очками и проекцией спектра полярных сияний и плотности термосферы',
    accentColor: '#38bdf8',
    suitType: 'Лабораторный гермокостюм «Спектр-3»',
  },
  {
    id: 'engineer',
    name: 'Бортинженер CubeSat',
    title: 'Инженер наноспутников',
    icon: Cpu,
    baseImg: engineerImg,
    badge: 'CUBESAT ENGR',
    prompt:
      'Аэрокосмический бортинженер с оптической телеметрической маской, нашивкой КОСМОПОРТ и солнечными панелями на горизонте',
    accentColor: '#10b981',
    suitType: 'Монтажный экзокостюм «Вектор-М»',
  },
];

const ENVIRONMENT_OPTIONS = [
  { id: 'leo', label: 'Орбита 410 км (Земля и сияние)', color: 'from-blue-600 to-indigo-900' },
  { id: 'deep_space', label: 'Глубокий космос (Туманность)', color: 'from-purple-600 to-pink-900' },
  { id: 'bridge', label: 'Бортовой мостик корабля', color: 'from-cyan-600 to-slate-900' },
  { id: 'mcc', label: 'ЦУП Земли (Телеметрия)', color: 'from-amber-600 to-slate-900' },
];

const STYLE_OPTIONS = [
  { id: 'cinematic_3d', label: 'Кинематографичный 3D' },
  { id: 'cyberpunk_glow', label: 'Неоновый Sci-Fi' },
  { id: 'digital_concept', label: 'Концепт-арт' },
  { id: 'photo_real', label: 'Фотореализм орбиты' },
];

export const AiAvatarGeneratorModal: React.FC<AiAvatarGeneratorModalProps> = ({
  isOpen,
  onClose,
  userName,
  userRole,
  teamName,
  cubesatName,
  currentAvatarUrl,
  onApplyAvatar,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('commander');
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic_3d');
  const [selectedEnv, setSelectedEnv] = useState<string>('leo');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Custom HUD toggles
  const [includeHud, setIncludeHud] = useState<boolean>(true);
  const [includeMissionPatch, setIncludeMissionPatch] = useState<boolean>(true);
  const [includeVisorReflect, setIncludeVisorReflect] = useState<boolean>(true);
  const [includeCosmicDust, setIncludeCosmicDust] = useState<boolean>(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string>(commanderImg);
  const [history, setHistory] = useState<string[]>([commanderImg, physicistImg, engineerImg]);
  const [generationSeed, setGenerationSeed] = useState<number>(1042);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep preview synced with initial preset if not yet generated
  useEffect(() => {
    const preset = EXPLORER_PRESETS.find((p) => p.id === selectedPreset);
    if (preset && !customPrompt) {
      setPreviewAvatarUrl(preset.baseImg);
    }
  }, [selectedPreset]);

  if (!isOpen) return null;

  const currentPresetData =
    EXPLORER_PRESETS.find((p) => p.id === selectedPreset) || EXPLORER_PRESETS[0];

  const synthesisSteps = [
    'Инициализация нейросети CosmoPort Neural Diffusion v3.2...',
    'Синтез полигональной геометрии шлема и скафандра...',
    'Рендеринг атмосферных отражений и светового ореола Земли...',
    'Наложение бортовой телеметрии и квантовых оптических эффектов...',
    'Финализация фотореалистичного портрета исследователя...',
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationStep(0);
    audioService.playClickSound();

    // Step-by-step progress simulation
    for (let i = 0; i < synthesisSteps.length; i++) {
      setGenerationStep(i);
      await new Promise((r) => setTimeout(r, 450));
    }

    // Synthesize high-definition canvas avatar
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const baseImage = new Image();
      baseImage.crossOrigin = 'anonymous';
      baseImage.src = currentPresetData.baseImg;

      await new Promise((resolve) => {
        baseImage.onload = resolve;
        baseImage.onerror = resolve;
      });

      // 1. Draw base image
      ctx.drawImage(baseImage, 0, 0, 800, 800);

      // 2. Cosmic color grading & style overlay
      if (selectedStyle === 'cyberpunk_glow') {
        const cyanGrad = ctx.createLinearGradient(0, 0, 800, 800);
        cyanGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
        cyanGrad.addColorStop(1, 'rgba(236, 72, 153, 0.25)');
        ctx.fillStyle = cyanGrad;
        ctx.globalCompositeOperation = 'color-burn';
        ctx.fillRect(0, 0, 800, 800);
        ctx.globalCompositeOperation = 'source-over';
      } else if (selectedStyle === 'photo_real') {
        const softWarm = ctx.createRadialGradient(400, 300, 50, 400, 400, 500);
        softWarm.addColorStop(0, 'rgba(255, 230, 180, 0.15)');
        softWarm.addColorStop(1, 'rgba(10, 15, 30, 0.35)');
        ctx.fillStyle = softWarm;
        ctx.fillRect(0, 0, 800, 800);
      }

      // 3. Cosmic dust / star particles if enabled
      if (includeCosmicDust) {
        ctx.fillStyle = '#ffffff';
        const newSeed = Math.floor(Math.random() * 10000);
        setGenerationSeed(newSeed);
        for (let i = 0; i < 40; i++) {
          const x = (Math.sin(newSeed + i * 3) * 0.5 + 0.5) * 800;
          const y = (Math.cos(newSeed + i * 7) * 0.5 + 0.5) * 800;
          const radius = Math.random() * 2 + 0.5;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.globalAlpha = Math.random() * 0.7 + 0.3;
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      // 4. Visor reflection sheen
      if (includeVisorReflect) {
        const sheenGrad = ctx.createLinearGradient(150, 150, 550, 450);
        sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        sheenGrad.addColorStop(0.3, 'rgba(147, 197, 253, 0.15)');
        sheenGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sheenGrad;
        ctx.beginPath();
        ctx.ellipse(390, 320, 160, 90, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. High-tech HUD Telemetry Ring if enabled
      if (includeHud) {
        ctx.strokeStyle = currentPresetData.accentColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(400, 400, 370, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Outer corner target brackets
        const bracketLen = 40;
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';

        // Top-left
        ctx.beginPath();
        ctx.moveTo(30, 30 + bracketLen);
        ctx.lineTo(30, 30);
        ctx.lineTo(30 + bracketLen, 30);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(770 - bracketLen, 30);
        ctx.lineTo(770, 30);
        ctx.lineTo(770, 30 + bracketLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(30, 770 - bracketLen);
        ctx.lineTo(30, 770);
        ctx.lineTo(30 + bracketLen, 770);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(770 - bracketLen, 770);
        ctx.lineTo(770, 770);
        ctx.lineTo(770, 770 - bracketLen);
        ctx.stroke();
      }

      // 6. Mission Badge & Name Stamp if enabled
      if (includeMissionPatch) {
        // Bottom badge panel
        ctx.fillStyle = 'rgba(10, 15, 30, 0.82)';
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(50, 700, 700, 68, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText(`«КОСМОПОРТ» // БОРТ «${teamName}»`, 75, 732);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '15px monospace';
        ctx.fillText(`ИССЛЕДОВАТЕЛЬ: ${userName.toUpperCase()} · ${cubesatName}`, 75, 755);

        // Right side badge
        ctx.fillStyle = currentPresetData.accentColor;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(currentPresetData.badge, 725, 742);
        ctx.textAlign = 'left';
      }

      const generatedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setPreviewAvatarUrl(generatedDataUrl);
      setHistory((prev) => [generatedDataUrl, ...prev.slice(0, 5)]);
    }

    setIsGenerating(false);
    audioService.playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleApply = () => {
    if (!previewAvatarUrl) return;
    onApplyAvatar(previewAvatarUrl);
    audioService.playSuccessChime();
    onClose();
  };

  const handleDownload = () => {
    if (!previewAvatarUrl) return;
    const a = document.createElement('a');
    a.href = previewAvatarUrl;
    a.download = `cosmoport_avatar_${selectedPreset}_${Date.now()}.jpg`;
    a.click();
    audioService.playSuccessChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-md">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Сгенерировать аватар с AI
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-semibold">
                  CosmoPort AI v3.2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Создайте уникальный космический образ исследователя для борта «{teamName}»
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Controls & Prompts (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Explorer Specialization Preset */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1. Специализация космического исследователя</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {EXPLORER_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(preset.id);
                          setPreviewAvatarUrl(preset.baseImg);
                          audioService.playClickSound();
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group flex flex-col justify-between min-h-[96px] ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${preset.accentColor}25` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: preset.accentColor }} />
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                            {preset.badge}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-xs text-white leading-tight">
                            {preset.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                            {preset.title}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Style & Atmosphere */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>2. Художественный стиль</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {STYLE_OPTIONS.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStyle(st.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                          selectedStyle === st.id
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>3. Окружение / Фон</span>
                  </label>
                  <select
                    value={selectedEnv}
                    onChange={(e) => setSelectedEnv(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {ENVIRONMENT_OPTIONS.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Экипаж космического корабля «{teamName}»
                  </p>
                </div>
              </div>

              {/* 3. Tech Overlays & Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>4. Инженерная кастомизация скафандра</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={includeHud}
                      onChange={(e) => setIncludeHud(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-slate-300">Телеметрический HUD</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={includeMissionPatch}
                      onChange={(e) => setIncludeMissionPatch(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-slate-300">Патч миссии «КОСМОПОРТ»</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={includeVisorReflect}
                      onChange={(e) => setIncludeVisorReflect(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-slate-300">Блик звезд на визоре</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={includeCosmicDust}
                      onChange={(e) => setIncludeCosmicDust(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-slate-300">Звездная пыль и частицы</span>
                  </label>
                </div>
              </div>

              {/* 4. Text Prompt Details */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span>5. Индивидуальный промпт для нейросети</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Опционально</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={currentPresetData.prompt}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                  {customPrompt && (
                    <button
                      type="button"
                      onClick={() => setCustomPrompt('')}
                      className="absolute right-2 top-2 text-[10px] text-slate-500 hover:text-slate-300"
                    >
                      Очистить
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Real-Time Preview & Generation Terminal (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Предпросмотр аватара</span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    1024 × 1024 px
                  </span>
                </div>

                {/* Big Preview Frame */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500/40 shadow-2xl group">
                  <img
                    src={previewAvatarUrl}
                    alt="Сгенерированный аватар космического исследователя"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      isGenerating ? 'blur-sm scale-105 opacity-60' : 'opacity-100 scale-100'
                    }`}
                  />

                  {/* Generation in progress overlay */}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in fade-in">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/30 animate-ping" />
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500 flex items-center justify-center text-indigo-300 animate-spin">
                          <Sparkles className="w-7 h-7" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-white">
                          Генерация образа исследователя...
                        </div>
                        <div className="text-xs text-indigo-300 font-mono min-h-[36px] max-w-xs leading-relaxed">
                          {synthesisSteps[generationStep]}
                        </div>
                      </div>
                      <div className="w-48 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-300"
                          style={{
                            width: `${((generationStep + 1) / synthesisSteps.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Corner indicator */}
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-indigo-300 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    <span>{currentPresetData.suitType}</span>
                  </div>
                </div>

                {/* History variants */}
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-400">Недавние варианты исследователя:</div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {history.map((histUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPreviewAvatarUrl(histUrl);
                          audioService.playClickSound();
                        }}
                        className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          previewAvatarUrl === histUrl
                            ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105'
                            : 'border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={histUrl}
                          alt={`Вариант ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Нейросеть генерирует...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Сгенерировать аватар с AI</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isGenerating}
                    className="min-h-[42px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Установить в профиль</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="min-h-[42px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать (JPG)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
