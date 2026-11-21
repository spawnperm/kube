import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Volume2,
  VolumeX,
  GraduationCap,
  Cpu,
  FlaskConical,
  ClipboardList,
  Radio,
  FileText,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  geminiLiveService,
  LiveSessionStatus,
  LiveTranscriptItem,
  GEMINI_LIVE_VOICES,
} from '@/src/shared/lib/geminiLiveService';
import { RoleAgent, Team } from '@/src/shared/types/index';

interface GeminiLiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  initialRole?: RoleAgent;
  onSaveToChat?: (transcripts: Array<{ sender: 'user' | 'cubic'; text: string }>) => void;
}

export const GeminiLiveVoiceModal: React.FC<GeminiLiveVoiceModalProps> = ({
  isOpen,
  onClose,
  team,
  initialRole = 'professor',
  onSaveToChat,
}) => {
  const [status, setStatus] = useState<LiveSessionStatus>('idle');
  const [selectedRole, setSelectedRole] = useState<RoleAgent>(initialRole);
  const [selectedVoice, setSelectedVoice] = useState<string>('Charon');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showVoicePicker, setShowVoicePicker] = useState<boolean>(false);

  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const roleAgentsList = [
    {
      id: 'professor' as RoleAgent,
      title: 'Профессор физики',
      icon: GraduationCap,
      color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/15',
      defaultVoice: 'Charon',
      desc: 'Баллистика, Кеплер, формула Циолковского',
    },
    {
      id: 'engineer' as RoleAgent,
      title: 'Конструктор CubeSat',
      icon: Cpu,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/15',
      defaultVoice: 'Puck',
      desc: 'Подсистемы 1U/3U, энергетика GaAs, ADCS',
    },
    {
      id: 'biochem' as RoleAgent,
      title: 'Штурман БиоХим',
      icon: FlaskConical,
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/15',
      defaultVoice: 'Kore',
      desc: 'Реакция Сабатье, биология, ракетное топливо',
    },
    {
      id: 'registrar' as RoleAgent,
      title: 'Регистратор',
      icon: ClipboardList,
      color: 'text-sky-400 border-sky-500/40 bg-sky-500/15',
      defaultVoice: 'Zephyr',
      desc: '3 слайда, регламент, дедлайны',
    },
  ];

  // Sync initial role and set default voice
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      const matchedRole = roleAgentsList.find((r) => r.id === initialRole);
      if (matchedRole) {
        setSelectedVoice(matchedRole.defaultVoice);
      }
    }
  }, [isOpen, initialRole]);

  // Connect when modal opens, disconnect when modal closes
  useEffect(() => {
    if (!isOpen) {
      geminiLiveService.disconnect();
      return;
    }

    const unsubStatus = geminiLiveService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected' || newStatus === 'listening') {
        setErrorMessage(null);
      }
    });

    const unsubAudio = geminiLiveService.onAudioLevel((inLvl, outLvl) => {
      setInputLevel(inLvl);
      setOutputLevel(outLvl);
    });

    const unsubTranscript = geminiLiveService.onTranscript((item) => {
      setTranscripts((prev) => {
        // If interim, replace the last item if it was also interim from same sender
        const last = prev[prev.length - 1];
        if (last && last.sender === item.sender && last.isInterim) {
          const updated = [...prev];
          updated[updated.length - 1] = item;
          return updated;
        }
        return [...prev, item];
      });
    });

    const unsubError = geminiLiveService.onError((err) => {
      setErrorMessage(err);
    });

    // Initiate connection
    geminiLiveService.connect({
      roleAgent: selectedRole,
      voiceName: selectedVoice,
      teamContext: {
        taskTitle: team.slides[0]?.title || 'Исследование кубсата',
        projectName: team.cubesatName,
        stage: team.currentStage,
      },
    });

    return () => {
      unsubStatus();
      unsubAudio();
      unsubTranscript();
      unsubError();
      geminiLiveService.disconnect();
    };
  }, [isOpen]);

  // Scroll transcript down
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts, status]);

  const handleRoleChange = (newRole: RoleAgent) => {
    setSelectedRole(newRole);
    const matched = roleAgentsList.find((r) => r.id === newRole);
    const voice = matched?.defaultVoice || selectedVoice;
    setSelectedVoice(voice);

    geminiLiveService.switchRole(newRole, voice, {
      taskTitle: team.slides[0]?.title,
      projectName: team.cubesatName,
      stage: team.currentStage,
    });
  };

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    setShowVoicePicker(false);
    geminiLiveService.switchRole(selectedRole, voiceId, {
      taskTitle: team.slides[0]?.title,
      projectName: team.cubesatName,
      stage: team.currentStage,
    });
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    geminiLiveService.setMicMuted(nextMuted);
  };

  const handleSaveToChat = () => {
    if (transcripts.length === 0) return;
    if (onSaveToChat) {
      onSaveToChat(
        transcripts.map((t) => ({
          sender: t.sender,
          text: t.text,
        })),
      );
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const quickVoicePrompts = [
    'Объясни формулу Циолковского простыми словами',
    'Сколько ватт вырабатывают солнечные панели на кубсате 3U?',
    'Что обязательно должно быть на втором слайде презентации?',
    'Как устроена регенерация кислорода по реакции Сабатье?',
  ];

  if (!isOpen) return null;

  const currentRoleInfo = roleAgentsList.find((r) => r.id === selectedRole) || roleAgentsList[0];
  const activeLevel = status === 'speaking' ? outputLevel : inputLevel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900/95 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Orbit Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border-b border-indigo-500/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-bold">
                <Radio className="w-5 h-5 animate-pulse text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white truncate">
                  Орбитальный голосовой диалог
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/40 uppercase tracking-wider">
                  Gemini Live 3.8
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Экипаж «{team.name}» • КубСат «{team.cubesatName}»
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Voice selector dropdown button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVoicePicker(!showVoicePicker)}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
                title="Выбрать тембр голоса"
              >
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-medium hidden sm:inline">Голос:</span>
                <span className="text-indigo-300 font-semibold">{selectedVoice}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showVoicePicker && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-md">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Голоса Gemini Live
                  </div>
                  {GEMINI_LIVE_VOICES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleVoiceChange(v.id)}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                        selectedVoice === v.id
                          ? 'bg-indigo-600/30 text-indigo-200 font-semibold border border-indigo-500/40'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div>{v.name}</div>
                        <div className="text-[10px] text-slate-400">{v.desc}</div>
                      </div>
                      {selectedVoice === v.id && (
                        <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
              title="Завершить сеанс"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Roles Tabs */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap hidden sm:inline">
            Собеседник:
          </span>
          {roleAgentsList.map((agent) => {
            const Icon = agent.icon;
            const isSelected = selectedRole === agent.id;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => handleRoleChange(agent.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all border ${
                  isSelected
                    ? `${agent.color} font-bold shadow-sm shadow-indigo-500/10`
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{agent.title}</span>
              </button>
            );
          })}
        </div>

        {/* Central Audio Cosmic Visualizer Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-900/80 border-b border-slate-800/80 relative overflow-hidden shrink-0">
          {/* Cosmic Orb & Wave Animation */}
          <div className="relative w-44 h-44 flex items-center justify-center my-2">
            {/* Outer pulsating energy ring */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                status === 'speaking'
                  ? 'bg-purple-500/20 border-2 border-purple-500/40 animate-ping'
                  : status === 'listening' && activeLevel > 0.05
                    ? 'bg-indigo-500/20 border-2 border-indigo-500/40 animate-ping'
                    : 'border border-indigo-500/20 opacity-30'
              }`}
              style={{
                transform: `scale(${1 + activeLevel * 0.4})`,
              }}
            />

            {/* Middle wave ring */}
            <div
              className="absolute inset-4 rounded-full border border-indigo-400/40 transition-transform duration-100 flex items-center justify-center"
              style={{
                transform: `scale(${1 + activeLevel * 0.25})`,
                boxShadow:
                  status === 'speaking'
                    ? '0 0 30px rgba(168, 85, 247, 0.4)'
                    : '0 0 25px rgba(99, 102, 241, 0.3)',
              }}
            />

            {/* Inner Core */}
            <div
              className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-2xl ${
                status === 'speaking'
                  ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white'
                  : status === 'listening'
                    ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {status === 'speaking' ? (
                <>
                  <Volume2 className="w-8 h-8 animate-pulse text-white" />
                  <span className="text-[10px] font-bold tracking-wider mt-1 uppercase">
                    Леший говорит
                  </span>
                </>
              ) : status === 'listening' ? (
                <>
                  <Mic
                    className={`w-8 h-8 text-white ${
                      activeLevel > 0.05 ? 'scale-110 animate-pulse' : ''
                    }`}
                  />
                  <span className="text-[10px] font-bold tracking-wider mt-1 uppercase">
                    {isMuted ? 'Микрофон выкл' : 'Слушаю вас...'}
                  </span>
                </>
              ) : status === 'connecting' ? (
                <>
                  <Radio className="w-8 h-8 animate-spin text-indigo-300" />
                  <span className="text-[10px] font-bold mt-1 text-indigo-200">Связь...</span>
                </>
              ) : (
                <>
                  <MicOff className="w-8 h-8 text-slate-500" />
                  <span className="text-[10px] font-bold mt-1 text-slate-400">Пауза</span>
                </>
              )}
            </div>
          </div>

          {/* Real-time sound wave bars */}
          <div className="flex items-center justify-center gap-1.5 h-6 mt-1 w-48">
            {[...Array(16)].map((_, i) => {
              const heightMultiplier = Math.sin((i / 15) * Math.PI);
              const barHeight = Math.max(
                4,
                Math.round(activeLevel * 24 * heightMultiplier + (status !== 'idle' ? 4 : 2)),
              );
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    status === 'speaking'
                      ? 'bg-gradient-to-t from-purple-500 to-pink-400'
                      : status === 'listening'
                        ? 'bg-gradient-to-t from-indigo-500 to-cyan-400'
                        : 'bg-slate-700'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>

          {/* Interruption & Live Hint */}
          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700/60 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Живой диалог: говорите свободно, Лешего можно{' '}
                <strong className="text-white">перебивать</strong> в любой момент!
              </span>
            </span>
          </div>

          {errorMessage && (
            <div className="mt-3 px-3 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium max-w-md text-center">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Live Subtitles & Transcript Feed */}
        <div
          className="flex-1 min-h-[160px] max-h-[220px] p-4 overflow-y-auto bg-slate-950/90 text-xs font-mono space-y-2.5"
          ref={transcriptScrollRef}
        >
          <div className="text-[11px] font-sans font-semibold text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Стенограмма эфира (распознавание Gemini Live)
            </span>
            {transcripts.length > 0 && (
              <button
                type="button"
                onClick={handleSaveToChat}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Сохранено в чат!</span>
                  </>
                ) : (
                  <span>Сохранить в чат</span>
                )}
              </button>
            )}
          </div>

          {transcripts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-6">
              <Radio className="w-6 h-6 mb-2 opacity-40 text-indigo-400" />
              <p>Канал связи открыт. Задайте вопрос голосом в микрофон...</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-md">
                {quickVoicePrompts.slice(0, 2).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => geminiLiveService.sendTextMessage(prompt)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-indigo-300 hover:border-indigo-500/40 transition-colors"
                  >
                    «{prompt}»
                  </button>
                ))}
              </div>
            </div>
          ) : (
            transcripts.map((item) => {
              const isUser = item.sender === 'user';
              return (
                <div
                  key={item.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600/30 border border-indigo-500/40 text-indigo-100'
                        : 'bg-slate-900/90 border border-purple-500/30 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-400">
                      <span className="font-bold text-white">
                        {isUser ? 'Экипаж' : `Леший (${currentRoleInfo.title})`}
                      </span>
                      <span>{item.timestamp}</span>
                      {item.isInterim && (
                        <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">
                          распознавание...
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-[13px]">{item.text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-900 border-t border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Статус:</span>
            <strong className="text-white capitalize">
              {status === 'speaking'
                ? 'Отвечает голосом'
                : status === 'listening'
                  ? 'Слушает микрофон'
                  : status === 'connecting'
                    ? 'Подключение...'
                    : status}
            </strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                isMuted
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isMuted ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Микрофон выключен</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>Микрофон включен</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Завершить эфир</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
