import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  RotateCcw,
  BookOpen,
  Cpu,
  GraduationCap,
  ClipboardList,
  FlaskConical,
  Radio,
} from 'lucide-react';
import { RoleAgent, Team, KubikDeadlineAlert } from '@/src/shared/types/index';
import { audioService } from '@/src/shared/lib/audioService';
import { kubikAlertService } from '@/src/contexts/championship/services/kubikAlertService';
import { GeminiLiveVoiceModal } from './GeminiLiveVoiceModal';

interface Message {
  id: string;
  sender: 'user' | 'cubic';
  text: string;
  roleAgent: RoleAgent;
  timestamp: string;
}

interface CubicMascotProps {
  team: Team;
  onAskAboutTask?: (taskTitle: string) => void;
  isOnline: boolean;
}

export const CubicMascot: React.FC<CubicMascotProps> = ({ team, isOnline }) => {
  const [selectedRole, setSelectedRole] = useState<RoleAgent>('professor');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'cubic',
      text: `Приветствую экипаж космического корабля «${team.name}»! Я — ваш бортовой компьютер Леший. Помогаю управлять системами нашего корабля, рассчитывать формулы физики, компоновать чертежи КубСата («${team.cubesatName}») и готовить материалы для отчета перед Командным Пунктом Земли. Нажмите на микрофон для голосового вопроса или выберите тему!`,
      roleAgent: 'professor',
      timestamp: 'Сейчас',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<KubikDeadlineAlert[]>(() => kubikAlertService.getAlerts());
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState<boolean>(false);

  const handleSaveLiveTranscriptsToChat = (
    transcripts: Array<{ sender: 'user' | 'cubic'; text: string }>,
  ) => {
    const newItems: Message[] = transcripts.map((t, idx) => ({
      id: `live-saved-${Date.now()}-${idx}`,
      sender: t.sender,
      text: t.text,
      roleAgent: selectedRole,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
    setMessages((prev) => [...prev, ...newItems]);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = kubikAlertService.subscribe(() => {
      setAlerts(kubikAlertService.getAlerts());
    });
    return () => unsub();
  }, []);

  const latestAlert = alerts[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimTranscript]);

  const roleAgentsList = [
    {
      id: 'professor' as RoleAgent,
      title: 'Профессор физики',
      icon: GraduationCap,
      color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10',
      desc: 'Баллистика, Кеплер, формула Циолковского, термодинамика',
    },
    {
      id: 'engineer' as RoleAgent,
      title: 'Конструктор CubeSat',
      icon: Cpu,
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      desc: 'Подсистемы 1U/3U, энергетика GaAs, ориентация ADCS',
    },
    {
      id: 'biochem' as RoleAgent,
      title: 'Штурман БиоХим',
      icon: FlaskConical,
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      desc: 'Химия топлив, реакция Сабатье, биология в невесомости',
    },
    {
      id: 'registrar' as RoleAgent,
      title: 'Регистратор',
      icon: ClipboardList,
      color: 'text-sky-400 border-sky-500/40 bg-sky-500/10',
      desc: 'Регламент 3-х слайдов, лист ожидания, дедлайны',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    setInterimTranscript('');

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      roleAgent: selectedRole,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          roleAgent: selectedRole,
          teamContext: {
            taskTitle: team.slides[0]?.title || 'Исследование кубсата',
            projectName: team.cubesatName,
            step: team.currentStage,
          },
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply || 'Извините, не удалось получить ответ от орбитального сервера.';

      const botMsg: Message = {
        id: `c-${Date.now()}`,
        sender: 'cubic',
        text: replyText,
        roleAgent: selectedRole,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Automatically speak out the reply if audio is enabled
      if (!audioService.getIsMuted()) {
        setSpeakingMessageId(botMsg.id);
        audioService.speak(replyText, selectedRole, () => {
          setSpeakingMessageId(null);
        });
      }
    } catch (err) {
      const fallbackMsg: Message = {
        id: `c-${Date.now()}`,
        sender: 'cubic',
        text: 'Связь с базовой станцией временно ограничена (оффлайн-режим). Основные формулы доступны в локальной базе LLM-Wiki!',
        roleAgent: selectedRole,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      audioService.stopListening();
      setIsListening(false);
      return;
    }

    const started = audioService.startListening({
      onStart: () => {
        setIsListening(true);
        audioService.stopSpeaking();
      },
      onResult: (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal) {
          setIsListening(false);
          handleSendMessage(transcript);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setInterimTranscript('');
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!started) {
      alert('Голосовой ввод недоступен в этом браузере или отключен микрофон.');
    }
  };

  const handleSpeakMessage = (msg: Message) => {
    if (speakingMessageId === msg.id) {
      audioService.stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msg.id);
      audioService.speak(msg.text, msg.roleAgent, () => {
        setSpeakingMessageId(null);
      });
    }
  };

  const quickPrompts = [
    '⏳ Сколько времени осталось до дедлайна этапа?',
    '📋 Что нужно подготовить для защиты 3-х слайдов?',
    'Как оформить описание внешнего вида и внутреннего устройства КубСата 3U?',
    'Какие формулы из физики, химии и баллистики нужны для слайда №2?',
    'Как заправить баки корабля топливом в стартовом квизе?',
  ];

  return (
    <div className="space-y-4 pb-20 pt-2 flex flex-col h-[calc(100vh-125px)] max-w-4xl mx-auto">
      {/* Active Stage Deadline Banner from CRM Scheduler */}
      {latestAlert && !latestAlert.isRead && (
        <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-rose-950/60 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold shrink-0 text-base">
              ⏰
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                <span>{latestAlert.title}</span>
                {latestAlert.deadlineTime && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    Дедлайн: {latestAlert.deadlineTime}
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-[11px] truncate mt-0.5">{latestAlert.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => {
                handleSendMessage(
                  `Леший, подскажи подробнее о дедлайне этапа «${latestAlert.stageTitle}» и что необходимо сдать нашему экипажу.`,
                );
                kubikAlertService.markAlertAsRead(latestAlert.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
            >
              Спросить Лешего
            </button>
            <button
              onClick={() => kubikAlertService.markAlertAsRead(latestAlert.id)}
              className="text-slate-400 hover:text-white px-2 py-1 text-xs"
              title="Скрыть"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header & Sub-agent Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                Бортовой компьютер «Леший»
                <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded font-normal">
                  Борт «{team.name}»
                </span>
                <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded font-normal">
                  Голос + AI
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Помощник экипажа в расчетах физики, чертежах КубСата и подготовке к защите перед ЦУП
                Земли
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLiveVoiceModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-purple-600/25 flex items-center gap-1.5 shrink-0 transition-all active:scale-95 animate-pulse"
            title="Открыть живой голосовой диалог Gemini Live API"
          >
            <Radio className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Эфир:</span>
            <span>Gemini Live</span>
          </button>
        </div>

        {/* 4 Agent Roles Segmented Control */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {roleAgentsList.map((agent) => {
            const Icon = agent.icon;
            const isCurrent = selectedRole === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedRole(agent.id);
                  audioService.playSuccessChime();
                }}
                className={`p-2 rounded-xl border text-left transition-all min-h-[44px] ${
                  isCurrent
                    ? `${agent.color} ring-1 ring-white/20 shadow-sm`
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-semibold truncate text-white">{agent.title}</span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                  {agent.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gemini Live Voice Mode Quick Banner */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 shrink-0">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Голосовой диалог Gemini Live 3.8</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase tracking-wider">
                Двусторонняя аудиосвязь
              </span>
            </div>
            <p className="text-slate-300 text-[11px] truncate mt-0.5">
              Живой диалог в реальном времени: аудиопоток 24 кГц, автопаузы и возможность свободно
              перебивать Лешего.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsLiveVoiceModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 shrink-0 self-end sm:self-auto transition-all active:scale-95"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Начать диалог</span>
        </button>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 pr-2 min-h-0">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSpeakingThis = speakingMessageId === msg.id;

          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 px-1">
                <span>{isUser ? 'Вы' : `Леший (${msg.roleAgent})`}</span>
                <span aria-hidden="true">·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed border ${
                  isUser
                    ? 'bg-indigo-600 text-white border-indigo-500 rounded-br-sm'
                    : 'bg-slate-900 text-slate-100 border-slate-800 rounded-bl-sm shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Voice Play Button for Bot messages */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSpeakMessage(msg)}
                      className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                      title={isSpeakingThis ? 'Остановить озвучку' : 'Озвучить ответ голосом'}
                    >
                      {isSpeakingThis ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          <span className="text-rose-400">Стоп голос</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Прослушать голосом</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">RU-voice</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Speech Recognition Transcript Indicator */}
        {isListening && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-pulse">
            <Mic className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1 truncate">
              {interimTranscript ? (
                <span>«{interimTranscript}»</span>
              ) : (
                <span>Слушаю вас... Говорите в микрофон вашего телефона</span>
              )}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-xs text-slate-400">
            <Bot className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>Леший рассчитывает физические параметры...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 whitespace-nowrap text-[11px] transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Zone with Large Microphone Button (Thumb-Zone Ergonomics) */}
      <div className="shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center gap-2">
        {/* Gemini Live Voice Mode shortcut button */}
        <button
          type="button"
          onClick={() => setIsLiveVoiceModalOpen(true)}
          title="Открыть живой голосовой диалог Gemini Live 3.8"
          className="min-h-[46px] px-3 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 text-indigo-200 hover:text-white hover:border-indigo-400 flex items-center gap-1.5 text-xs font-semibold transition-all shrink-0 active:scale-95"
        >
          <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="hidden sm:inline">Gemini Live</span>
        </button>

        {/* Voice Input Mic Button */}
        <button
          onClick={handleToggleVoiceInput}
          title={isListening ? 'Остановить запись' : 'Начать голосовой ввод (распознавание текста)'}
          className={`min-h-[46px] min-w-[46px] rounded-xl flex items-center justify-center transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40 ring-2 ring-rose-400'
              : 'bg-slate-800 text-indigo-400 hover:bg-slate-700 hover:text-white'
          }`}
          aria-label="Голосовой ввод"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Спросите Лешего или скажите в микрофон..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        {/* Send Button */}
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className={`min-h-[46px] min-w-[46px] rounded-xl flex items-center justify-center transition-colors ${
            !inputText.trim() || isLoading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
          }`}
          aria-label="Отправить сообщение"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Gemini Live Voice Modal */}
      <GeminiLiveVoiceModal
        isOpen={isLiveVoiceModalOpen}
        onClose={() => setIsLiveVoiceModalOpen(false)}
        team={team}
        initialRole={selectedRole}
        onSaveToChat={handleSaveLiveTranscriptsToChat}
      />
    </div>
  );
};
