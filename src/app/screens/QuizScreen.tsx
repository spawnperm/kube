import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Bot,
  Brain,
  HelpCircle,
  Volume2,
  VolumeX,
  Timer,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Zap,
  Flame,
  FileText,
  ChevronRight,
  Lightbulb,
  GraduationCap,
  Shield,
  Layers,
  Atom,
  RefreshCw,
  ExternalLink,
  X,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioService } from '@/src/shared/lib/audioService';
import { storageService, AppState } from '@/src/shared/lib/storageService';
import { WIKI_ARTICLES } from '@/src/shared/data/mockData';
import { Team, UserProfile, WikiArticle } from '@/src/shared/types/index';

export interface QuizQuestionItem {
  id: string;
  category: string;
  topicTitle: string;
  articleSlug: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  formulaReference?: string;
  mascotHint: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

interface QuizScreenProps {
  currentUser: UserProfile;
  activeTeam?: Team;
  initialArticleSlug?: string;
  onNavigateToScreen: (
    screen: 'starmap' | 'ship' | 'inspectors' | 'mcc' | 'admin' | 'wiki' | 'mascot',
  ) => void;
  onAddXp?: (amount: number) => void;
  onAddCrystals?: (amount: number) => void;
  onUpdateTeamFuel?: (fuelAmount: number) => void;
}

const DEFAULT_QUESTIONS: QuizQuestionItem[] = [
  {
    id: 'kb-q-1',
    category: 'ballistics',
    topicTitle: 'Законы всемирного тяготения и космические скорости',
    articleSlug: 'gravity-and-cosmic-velocities',
    question:
      'Какова первая космическая скорость для круговой орбиты у поверхности Земли (радиус R = 6371 км)?',
    options: ['7.91 км/с', '11.20 км/с', '9.81 км/с', '16.70 км/с'],
    correctIndex: 0,
    explanation:
      'Первая космическая скорость v₁ = √(GM/R) = √(gR) ≈ 7.91 км/с. При этой скорости центробежная сила уравновешивает гравитационное притяжение Земли.',
    formulaReference: 'v_1 = \\sqrt{g R_E} \\approx 7.91\\text{ км/с}',
    mascotHint:
      'Вспомни: центростремительное ускорение v²/R обеспечивается полем тяготения Земли g ≈ 9.81 м/с².',
    difficulty: 'basic',
  },
  {
    id: 'kb-q-2',
    category: 'ballistics',
    topicTitle: 'Законы всемирного тяготения и космические скорости',
    articleSlug: 'gravity-and-cosmic-velocities',
    question:
      'Как соотносятся вторая (параболическая) и первая (круговая) космические скорости для сферического тела?',
    options: ['v₂ = √2 · v₁', 'v₂ = 2 · v₁', 'v₂ = v₁ / √2', 'v₂ = √3 · v₁'],
    correctIndex: 0,
    explanation:
      'Вторая космическая скорость v₂ = √(2GM/R) = √2 · v₁ ≈ 11.2 км/с. Это минимальная кинетическая энергия, позволяющая преодолеть гравитационный потенциал.',
    formulaReference: 'v_2 = \\sqrt{2} \\cdot v_1 \\approx 1.414 \\cdot v_1',
    mascotHint:
      'По закону сохранения энергии: Ek + Ep = 0 => mv₂²/2 = GMm/R. Помножь формулу на 2!',
    difficulty: 'intermediate',
  },
  {
    id: 'kb-q-3',
    category: 'propulsion',
    topicTitle: 'Реактивное движение и формула Циолковского',
    articleSlug: 'tsiolkovsky-rocket-equation',
    question:
      'Как выглядит аналитическое уравнение Циолковского для идеальной характеристической скорости ракеты?',
    options: [
      'Δv = Isp · g₀ · ln(m₀ / mk)',
      'Δv = m₀ · g₀ / mk',
      'Δv = Isp · (m₀ - mk)',
      'Δv = ½ · m₀ · v²',
    ],
    correctIndex: 0,
    explanation:
      'Формула Циолковского: Δv = u · ln(m₀/mk) = Isp · g₀ · ln(m₀/mk), где отношение m₀/mk называют числом Циолковского.',
    formulaReference: '\\Delta v = I_{sp} \\cdot g_0 \\cdot \\ln\\left(\\frac{m_0}{m_k}\\right)',
    mascotHint:
      'При интегрировании уравнения Мещерского m dv = -u dm из интеграла 1/m возникает натуральный логарифм!',
    difficulty: 'basic',
  },
  {
    id: 'kb-q-4',
    category: 'thermodynamics',
    topicTitle: 'Термодинамика вакуума и тепловой баланс спутников',
    articleSlug: 'thermal-balance',
    question:
      'По какому закону нагретая грань спутника сбрасывает тепловую мощность в космический вакуум?',
    options: [
      'Закон Стефана-Больцмана: P = ε · σ · S · T⁴',
      'Закон Кулона: F = k·q₁q₂/r²',
      'Закон Архимеда',
      'Закон Ома',
    ],
    correctIndex: 0,
    explanation:
      'В вакууме отсутствует газовая конвекция, тепло сбрасывается исключительно электромагнитным излучением по закону Стефана-Больцмана P = ε · σ · S · T⁴.',
    formulaReference: 'P_{rad} = \\epsilon \\cdot \\sigma \\cdot S \\cdot T^4',
    mascotHint:
      'В космическом пространстве тепло уходит пропорционально абсолютной температуре в 4-й степени!',
    difficulty: 'intermediate',
  },
  {
    id: 'kb-q-5',
    category: 'engineering',
    topicTitle: 'Архитектура и стандарты микроспутников CubeSat',
    articleSlug: 'cubesat-architecture',
    question:
      'Каковы канонические габариты наноспутника формата 3U по международному стандарту CalPoly?',
    options: [
      '100 × 100 × 340 мм, масса до 4–5 кг',
      '50 × 50 × 150 мм, масса до 1 кг',
      '200 × 200 × 600 мм, масса до 20 кг',
      '100 × 100 × 100 мм, масса до 1.33 кг',
    ],
    correctIndex: 0,
    explanation:
      'Базовый 1U имеет габариты 100×100×113.5 мм (масса до 1.33–2 кг). Модуль 3U состоит из 3 объединенных кубиков: 100×100×340 мм и масса до 4–5 кг.',
    formulaReference: '3\\text{U} = 100 \\times 100 \\times 340\\text{ мм}',
    mascotHint:
      'Вспомни: 1U — это кубик 10×10 см, а 3U — брусок из трех таких блоков для пускового контейнера P-POD.',
    difficulty: 'basic',
  },
];

export const QuizScreen: React.FC<QuizScreenProps> = ({
  currentUser,
  activeTeam,
  initialArticleSlug,
  onNavigateToScreen,
  onAddXp,
  onAddCrystals,
  onUpdateTeamFuel,
}) => {
  // Config & Selection state
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string>(
    initialArticleSlug || 'all',
  );
  const [selectedRoleAgent, setSelectedRoleAgent] = useState<
    'professor' | 'engineer' | 'biochem' | 'registrar'
  >('professor');
  const [quizMode, setQuizMode] = useState<'study' | 'blitz'>('study');
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'all' | 'basic' | 'intermediate' | 'advanced'
  >('all');

  // Gameplay state
  const [questions, setQuestions] = useState<QuizQuestionItem[]>(DEFAULT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [answersLog, setAnswersLog] = useState<
    { isCorrect: boolean; selected: number; question: QuizQuestionItem }[]
  >([]);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Blitz Timer (45s per question)
  const [timerSeconds, setTimerSeconds] = useState(45);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Formulas Cheat Sheet Modal
  const [isFormulaSheetOpen, setIsFormulaSheetOpen] = useState(false);

  // Active question
  const currentQuestion = questions[currentIndex] || DEFAULT_QUESTIONS[0];

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      audioService.stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer logic for Blitz mode
  useEffect(() => {
    if (quizMode !== 'blitz' || isAnswerSubmitted || isFinished || isLoadingAi) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimerSeconds(45);
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, quizMode, isAnswerSubmitted, isFinished, isLoadingAi]);

  const handleTimeExpired = () => {
    if (isAnswerSubmitted) return;
    setSelectedOption(-1);
    setIsAnswerSubmitted(true);
    audioService.playTimerWarning();
    setAnswersLog((prev) => [
      ...prev,
      { isCorrect: false, selected: -1, question: currentQuestion },
    ]);
  };

  // Generate / Load questions from Server (Gemini AI or LLM-Wiki Knowledge Bank)
  const handleLoadQuestions = async (slug = selectedArticleSlug, role = selectedRoleAgent) => {
    setIsLoadingAi(true);
    audioService.playClickSound();
    try {
      const targetArticle = WIKI_ARTICLES.find((a) => a.slug === slug);
      const topicName = targetArticle
        ? targetArticle.title
        : 'Космическая физика и баллистика CubeSat';

      const res = await fetch('/api/assistant/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicName,
          articleSlug: slug !== 'all' ? slug : undefined,
          roleAgent: role,
          grade: '10-11 класс',
          count: 5,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          resetQuizState();
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch quiz from server, falling back to local pool:', e);
    } finally {
      setIsLoadingAi(false);
    }

    // Fallback filter from local bank
    let filtered = [...DEFAULT_QUESTIONS];
    if (slug !== 'all') {
      const matched = filtered.filter((q) => q.articleSlug === slug);
      if (matched.length > 0) filtered = matched;
    }
    setQuestions(filtered);
    resetQuizState();
  };

  const resetQuizState = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setAnswersLog([]);
    setScore(0);
    setIsFinished(false);
    setShowHint(false);
    setTimerSeconds(45);
    audioService.stopSpeaking();
    setIsSpeaking(false);
  };

  // Submit Answer
  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
    setIsAnswerSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = idx === currentQuestion.correctIndex;

    if (isCorrect) {
      setScore((s) => s + 1);
      audioService.playSuccessChime();
    } else {
      audioService.playTimerWarning();
    }

    setAnswersLog((prev) => [...prev, { isCorrect, selected: idx, question: currentQuestion }]);
  };

  // Advance to next question or finish
  const handleNextQuestion = () => {
    audioService.stopSpeaking();
    setIsSpeaking(false);
    setShowHint(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      finishQuiz();
    }
  };

  // Finish quiz & calculate awards
  const finishQuiz = () => {
    setIsFinished(true);
    const finalScore = score + (selectedOption === currentQuestion.correctIndex ? 0 : 0); // score already updated
    const totalCount = questions.length;
    const accuracy = Math.round((finalScore / totalCount) * 100);

    const gainedXp = finalScore * 25 + (accuracy >= 80 ? 50 : 20);
    const gainedCrystals = finalScore * 5 + (accuracy === 100 ? 15 : 5);

    if (onAddXp) onAddXp(gainedXp);
    if (onAddCrystals) onAddCrystals(gainedCrystals);

    // Boost team spacecraft fuel
    if (onUpdateTeamFuel) {
      const calculatedFuel = Math.max(30, accuracy);
      onUpdateTeamFuel(calculatedFuel);
    }

    // Update localStorage user XP/crystals
    try {
      const current = storageService.getInitialState();
      current.user.xp = (current.user.xp || 0) + gainedXp;
      current.user.energyCrystals = (current.user.energyCrystals || 0) + gainedCrystals;
      if (accuracy >= 80 && !current.user.badges.includes('kepler_master')) {
        current.user.badges.push('kepler_master');
      }
      storageService.saveState(current);
    } catch (e) {
      console.warn('Failed to update user rewards:', e);
    }

    // Launch confetti celebration on high score!
    if (accuracy >= 60) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#38bdf8', '#f59e0b'],
      });
      audioService.playTimerStopGong();
    }
  };

  // Mascot voice narration
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      audioService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToRead = isAnswerSubmitted
        ? `Разбор от Кубика: ${currentQuestion.explanation}`
        : `${currentQuestion.question}. Варианты: ${currentQuestion.options.join(', ')}`;
      audioService.speak(textToRead, selectedRoleAgent);
    }
  };

  // Mascot role details
  const getRoleBadge = (role: typeof selectedRoleAgent) => {
    switch (role) {
      case 'professor':
        return {
          name: 'Профессор Физики Кубик',
          icon: GraduationCap,
          color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
        };
      case 'engineer':
        return {
          name: 'Конструктор CubeSat Кубик',
          icon: Layers,
          color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        };
      case 'biochem':
        return {
          name: 'Штурман БиоХим Кубик',
          icon: Atom,
          color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        };
      case 'registrar':
        return {
          name: 'Регистратор ЦУП Кубик',
          icon: Shield,
          color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
        };
    }
  };

  const roleMeta = getRoleBadge(selectedRoleAgent);
  const RoleIcon = roleMeta.icon;

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI-ТРЕНАЖЕР ЭКИПАЖА
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono">База знаний LLM-Wiki</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <Zap className="w-3 h-3" /> +25 XP за ответ
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Орбитальный экзамен с Кубиком</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-normal">
              3U Mission
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Проверка физической строгости расчетов, баллистики, формулы Циолковского и стандартов
            CubeSat перед защитой 3-х слайдов перед экспертами жюри.
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={() => setIsFormulaSheetOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Открыть шпаргалку с физическими формулами"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Шпаргалка формул</span>
          </button>
          <button
            onClick={() => onNavigateToScreen('wiki')}
            className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Статьи LLM-Wiki</span>
          </button>
        </div>
      </div>

      {/* Control Panel: Topic Filter & Mascot Role */}
      {!isFinished && (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mascot Persona Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['professor', 'engineer', 'biochem', 'registrar'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setSelectedRoleAgent(role);
                    audioService.playClickSound();
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedRoleAgent === role
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={role}
                >
                  {role === 'professor' && '🎓 Физика'}
                  {role === 'engineer' && '🛠️ CubeSat'}
                  {role === 'biochem' && '🧪 БиоХим'}
                  {role === 'registrar' && '📋 Регламент'}
                </button>
              ))}
            </div>

            {/* Mode: Study vs Blitz */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setQuizMode('study')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  quizMode === 'study'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Практикум</span>
              </button>
              <button
                onClick={() => setQuizMode('blitz')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  quizMode === 'blitz'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Блиц 45с</span>
              </button>
            </div>
          </div>

          {/* Article / Topic Selector & AI Regenerate */}
          <div className="flex items-center gap-2">
            <select
              value={selectedArticleSlug}
              onChange={(e) => {
                setSelectedArticleSlug(e.target.value);
                handleLoadQuestions(e.target.value, selectedRoleAgent);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
            >
              <option value="all">Все темы LLM-Wiki</option>
              {WIKI_ARTICLES.map((art) => (
                <option key={art.slug} value={art.slug}>
                  {art.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleLoadQuestions()}
              disabled={isLoadingAi}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              title="Сгенерировать вопросы через AI Кубика"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAi ? 'animate-spin' : ''}`} />
              <span>{isLoadingAi ? 'Генерация…' : 'Новый раунд'}</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN QUIZ CARD (Active Game) */}
      {!isFinished ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative">
          {/* Header row: Progress bar + Mascot Voice + Timer */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                Вопрос {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {currentQuestion.topicTitle}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Blitz Timer countdown */}
              {quizMode === 'blitz' && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-bold border transition-colors ${
                    timerSeconds <= 10
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                      : 'bg-slate-800 text-amber-300 border-slate-700'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{timerSeconds}с</span>
                </div>
              )}

              {/* Speech Voice Button */}
              <button
                onClick={handleToggleSpeak}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 ring-2 ring-rose-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={isSpeaking ? 'Остановить голос' : 'Озвучить вопрос голосом Кубика'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                )}
                <span className="hidden sm:inline">{isSpeaking ? 'Стоп' : 'Голос'}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-2 mb-6 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + (isAnswerSubmitted ? 1 : 0)) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Mascot Guidance Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-start gap-3 mb-6 transition-all ${roleMeta.color}`}
          >
            <div className="w-9 h-9 rounded-xl bg-slate-950/80 border border-slate-700 flex items-center justify-center shrink-0 shadow-md">
              <RoleIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-tight text-white">{roleMeta.name}</span>
                <span className="text-[10px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-md">
                  Сложность:{' '}
                  {currentQuestion.difficulty === 'basic'
                    ? 'Базовая'
                    : currentQuestion.difficulty === 'intermediate'
                      ? 'Профильная'
                      : 'Олимпиадная'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 italic">
                {!isAnswerSubmitted
                  ? '«Внимательно прочитайте физическое условие и выберите правильный ответ из 4-х вариантов»'
                  : selectedOption === currentQuestion.correctIndex
                    ? '«Отлично сработано! Орбитальная физика подтверждена, баки заправлены!»'
                    : '«Внимание экипажу: в расчетах зафиксировано отклонение. Ознакомьтесь с разбором формулы ниже.»'}
              </p>
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <h2 className="text-base sm:text-xl font-bold text-white leading-relaxed">
              {currentQuestion.question}
            </h2>
            {currentQuestion.formulaReference && (
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/20 text-indigo-300 font-mono text-xs">
                <span className="text-slate-500 font-sans">Опорная формула:</span>
                <code className="text-indigo-200 font-bold">
                  {currentQuestion.formulaReference}
                </code>
              </div>
            )}
          </div>

          {/* Options Grid (A, B, C, D) */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQuestion.correctIndex;

              let btnClass =
                'bg-slate-950/60 hover:bg-slate-800/80 text-slate-200 border-slate-800';

              if (isAnswerSubmitted) {
                if (isCorrectAnswer) {
                  btnClass =
                    'bg-emerald-950/70 border-emerald-500/80 text-emerald-100 ring-2 ring-emerald-500/40';
                } else if (isSelected && !isCorrectAnswer) {
                  btnClass =
                    'bg-rose-950/70 border-rose-500/80 text-rose-100 ring-2 ring-rose-500/40';
                } else {
                  btnClass = 'bg-slate-950/30 border-slate-800/40 text-slate-500 opacity-60';
                }
              } else if (isSelected) {
                btnClass = 'bg-indigo-950/70 border-indigo-500 text-white';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all text-xs sm:text-sm font-medium ${btnClass} ${
                    !isAnswerSubmitted ? 'active:scale-[0.99] cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isAnswerSubmitted && isCorrectAnswer
                        ? 'bg-emerald-600 text-white'
                        : isAnswerSubmitted && isSelected && !isCorrectAnswer
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="flex-1 pt-0.5 leading-normal">{option}</span>
                  {isAnswerSubmitted && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Row: Hint & Next Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            {/* Mascot Hint Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowHint((prev) => !prev);
                  audioService.playClickSound();
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showHint
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>{showHint ? 'Скрыть подсказку' : '💡 Подсказка Кубика'}</span>
              </button>

              {currentQuestion.articleSlug && (
                <button
                  onClick={() => onNavigateToScreen('wiki')}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition-all"
                  title="Открыть связанную статью в LLM-Wiki"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Читать статью в Wiki</span>
                </button>
              )}
            </div>

            {/* Next / Finish Button */}
            {isAnswerSubmitted ? (
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <span>
                  {currentIndex + 1 < questions.length ? 'Следующий вопрос' : 'Завершить экзамен'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs text-slate-500 text-center sm:text-right">
                Выберите ответ для подтверждения
              </span>
            )}
          </div>

          {/* Hint Dropdown Box */}
          {showHint && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs leading-relaxed animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                <Lightbulb className="w-4 h-4" />
                <span>Подсказка от Кубика:</span>
              </div>
              <p>{currentQuestion.mascotHint}</p>
            </div>
          )}

          {/* Explanation Box (Revealed after answer) */}
          {isAnswerSubmitted && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Физико-математический разбор решения:
                </span>
                <span className="font-mono text-slate-400">
                  LLM-Wiki: {currentQuestion.topicTitle}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {currentQuestion.explanation}
              </p>
              {currentQuestion.formulaReference && (
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Формула для 2-го слайда проекта:</span>
                  <code className="text-indigo-400 font-mono font-bold bg-slate-900 px-2.5 py-1 rounded-md">
                    {currentQuestion.formulaReference}
                  </code>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* RESULTS SCREEN (Completed Game) */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-fadeIn relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto text-3xl shadow-xl shadow-indigo-600/20">
            {score >= Math.ceil(questions.length * 0.8)
              ? '🏆'
              : score >= Math.ceil(questions.length * 0.5)
                ? '🛰️'
                : '🚀'}
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              ЭКЗАМЕН ЗАВЕРШЕН
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {score === questions.length
                ? 'Идеальный расчет! 100%'
                : score >= Math.ceil(questions.length * 0.8)
                  ? 'Отличная физическая подготовка!'
                  : score >= Math.ceil(questions.length * 0.5)
                    ? 'Зачет сдан! Баки заправлены'
                    : 'Требуется доработка теории'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Вы ответили правильно на <strong className="text-white font-bold">{score}</strong> из{' '}
              <strong className="text-white font-bold">{questions.length}</strong> вопросов по
              космической физике.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Точность</span>
              <span className="text-xl font-black text-indigo-400 font-mono">
                {Math.round((score / questions.length) * 100)}%
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Начислено XP</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                +{score * 25 + (score === questions.length ? 50 : 20)} XP
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Энергокристаллы</span>
              <span className="text-xl font-black text-amber-400 font-mono flex items-center justify-center gap-1">
                <Zap className="w-4 h-4" />+{score * 5 + 5}
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Топливо CubeSat</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {Math.max(40, Math.round((score / questions.length) * 100))}%
              </span>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="max-w-2xl mx-auto text-left space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Сводка ответов раунда:
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {answersLog.map((log, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                    log.isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                  }`}
                >
                  {log.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{log.question.question}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Правильный ответ:{' '}
                      <strong className="text-slate-200">
                        {log.question.options[log.question.correctIndex]}
                      </strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={resetQuizState}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Пройти еще раз</span>
            </button>
            <button
              onClick={() => handleLoadQuestions()}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Новые вопросы от AI</span>
            </button>
            <button
              onClick={() => onNavigateToScreen('ship')}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <span>В пульт корабля</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FORMULA CHEAT SHEET MODAL */}
      {isFormulaSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Шпаргалка формул космической физики
                </h3>
              </div>
              <button
                onClick={() => setIsFormulaSheetOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs sm:text-sm">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-indigo-300">
                  1. Первая космическая скорость (круговая)
                </div>
                <code className="block font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
                  v₁ = √(GM / r) = √(g · R_E) ≈ 7.91 км/с (на высоте 400 км ≈ 7.67 км/с)
                </code>
                <p className="text-slate-400 text-xs">
                  Обеспечивает центростремительное ускорение v²/r = GM/r² на круговой орбите.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-indigo-300">
                  2. Вторая космическая скорость (параболическая)
                </div>
                <code className="block font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
                  v₂ = √(2GM / R) = √2 · v₁ ≈ 11.2 км/с
                </code>
                <p className="text-slate-400 text-xs">
                  Минимальная скорость преодоления притяжения Земли без возврата.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-indigo-300">3. Формула К.Э. Циолковского</div>
                <code className="block font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
                  Δv = Isp · g₀ · ln(m₀ / mk)
                </code>
                <p className="text-slate-400 text-xs">
                  Характеристическая скорость ракеты или кубсата при сгорании запаса топлива.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-indigo-300">
                  4. Закон Стефана-Больцмана (радиационный теплообмен)
                </div>
                <code className="block font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
                  P_rad = ε · σ · S · T⁴, где σ ≈ 5.67 × 10⁻⁸ Вт/(м²·К⁴)
                </code>
                <p className="text-slate-400 text-xs">
                  Тепловое инфракрасное излучение поверхности спутника в космический холод (3K).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="font-bold text-indigo-300">
                  5. Реакция Сабатье (регенерация кислорода)
                </div>
                <code className="block font-mono text-cyan-300 bg-slate-900 px-3 py-1.5 rounded-xl text-xs sm:text-sm">
                  CO₂ + 4H₂ → CH₄ + 2H₂O (никелевый катализатор, 350°C)
                </code>
                <p className="text-slate-400 text-xs">
                  Восстановление углекислого газа до метана и чистой воды с последующим
                  электролизом.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsFormulaSheetOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Понятно, вернуться к тесту
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
