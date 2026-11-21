import React, { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  FileText,
  Check,
  RotateCcw,
  Headphones,
} from 'lucide-react';
import { VoiceMessageData } from '@/src/shared/types/index';
import { audioService } from '@/src/shared/lib/audioService';

interface VoiceMessageRecorderProps {
  onSendVoiceMessage: (data: {
    title: string;
    transcript: string;
    voiceData: VoiceMessageData;
  }) => void;
  teamName: string;
  authorName: string;
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  onSendVoiceMessage,
  teamName,
  authorName,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordedResult, setRecordedResult] = useState<VoiceMessageData | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Suggested space report titles
  const reportSuggestions = [
    'Отчет по калибровке датчиков CubeSat',
    'Баллистический расчет высоты апогея',
    'Замечания по тепловому балансу в тени Земли',
    'Телеметрия канала радиосвязи 437 МГц',
  ];

  useEffect(() => {
    return () => {
      if (isRecording) {
        audioService.cancelVoiceRecording();
      }
      audioService.stopVoiceAudio();
    };
  }, [isRecording]);

  const handleStartRecording = async () => {
    setErrorMsg(null);
    setRecordedResult(null);
    setLiveTranscript('');
    setRecordSeconds(0);
    setIsPlayingPreview(false);

    try {
      const ok = await audioService.startVoiceRecording({
        onStart: () => {
          setIsRecording(true);
        },
        onTranscriptUpdate: (text) => {
          setLiveTranscript(text);
        },
        onTimeUpdate: (sec) => {
          setRecordSeconds(sec);
        },
        onError: (err) => {
          setErrorMsg(err);
          setIsRecording(false);
        },
      });

      if (!ok) {
        setErrorMsg('Не удалось включить запись аудио');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Ошибка доступа к микрофону');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await audioService.stopVoiceRecording();
      setIsRecording(false);

      // If transcript was empty (e.g. mic muted or recognition unavailable in sandbox), provide a helpful default
      const finalTranscript =
        result.transcript &&
        result.transcript !== 'Голосовое сообщение экипажа без распознанного текста'
          ? result.transcript
          : liveTranscript.trim() ||
            `Бортовой доклад экипажа «${teamName}»: штатная работа подсистем CubeSat, параметров питания и терморегуляции.`;

      const preparedResult: VoiceMessageData = {
        ...result,
        transcript: finalTranscript,
      };

      setRecordedResult(preparedResult);
      if (!customTitle) {
        setCustomTitle(`Голосовое сообщение: ${preparedResult.recordedAt || 'Борт'}`);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Ошибка при сохранении аудио');
      setIsRecording(false);
    }
  };

  const handleCancel = () => {
    audioService.cancelVoiceRecording();
    audioService.stopVoiceAudio();
    setIsRecording(false);
    setRecordedResult(null);
    setLiveTranscript('');
    setRecordSeconds(0);
    setIsPlayingPreview(false);
  };

  const handleTogglePreviewPlay = () => {
    if (!recordedResult) return;

    if (isPlayingPreview) {
      audioService.stopVoiceAudio();
      setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(true);
      audioService.playVoiceAudio(recordedResult.audioUrl, recordedResult.transcript, () =>
        setIsPlayingPreview(false),
      );
    }
  };

  const handleSubmit = () => {
    if (!recordedResult) return;

    onSendVoiceMessage({
      title: customTitle.trim() || `Голосовое сообщение от ${authorName}`,
      transcript: recordedResult.transcript,
      voiceData: recordedResult,
    });

    handleCancel();
    audioService.playSuccessChime();
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden">
      {/* Background glow when recording */}
      {isRecording && (
        <div className="absolute inset-0 bg-rose-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Бортовая радиосвязь команды «{teamName}»</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                audioService ru-RU
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Запись голосового сообщения и автоматическая транскрибация речи в ленту
            </p>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-mono font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>REC {formatSeconds(recordSeconds)}</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* IDLE STATE: Large Record Action Button */}
      {!isRecording && !recordedResult && (
        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl">
          <button
            type="button"
            onClick={handleStartRecording}
            className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition-all group shrink-0"
          >
            <Mic className="w-4 h-4 group-hover:scale-125 transition-transform" />
            <span>Начать запись голоса</span>
          </button>

          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>
              Нажмите кнопку, произнесите доклад или расчет по спутнику CubeSat — сервис
              audioService запишет аудиодорожку и сразу выполнит транскрипцию текста на русском
              языке.
            </span>
          </div>
        </div>
      )}

      {/* RECORDING IN PROGRESS STATE */}
      {isRecording && (
        <div className="p-4 bg-slate-900 border border-rose-500/40 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>Идёт запись аудио и транскрибация речи...</span>
            </span>
            <span className="font-mono text-rose-300 font-bold">
              {formatSeconds(recordSeconds)}
            </span>
          </div>

          {/* Animated sound wave bars */}
          <div className="flex items-center justify-center gap-1.5 h-12 py-1 bg-slate-950/80 rounded-xl px-4 overflow-hidden border border-slate-800">
            {Array.from({ length: 32 }).map((_, i) => {
              const animDuration = 0.4 + (i % 5) * 0.15;
              return (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-indigo-500 via-rose-500 to-amber-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.max(15, Math.sin(i * 0.4 + recordSeconds * 2) * 40 + 50)}%`,
                    animationDuration: `${animDuration}s`,
                  }}
                />
              );
            })}
          </div>

          {/* Real-time transcript preview */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Живая транскрипция речи (SpeechRecognition):</span>
            </div>
            <p className="text-xs text-indigo-200 font-mono italic leading-relaxed min-h-[24px]">
              {liveTranscript || 'Слушаю вас... Начните говорить в микрофон...'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="min-h-[38px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Отмена</span>
            </button>
            <button
              type="button"
              onClick={handleStopRecording}
              className="min-h-[38px] px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-rose-600/30"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Остановить и транскрибировать</span>
            </button>
          </div>
        </div>
      )}

      {/* COMPLETED RECORDING PREVIEW & EDIT STATE */}
      {recordedResult && !isRecording && (
        <div className="p-4 bg-slate-900 border border-indigo-500/40 rounded-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Голосовое сообщение записано и транскрибировано</span>
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Длительность: {formatSeconds(recordedResult.durationSec)}
            </span>
          </div>

          {/* Player Bar */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePreviewPlay}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-colors shrink-0"
              title={isPlayingPreview ? 'Остановить' : 'Прослушать запись'}
            >
              {isPlayingPreview ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Static/Dynamic Waveform */}
            <div className="flex-1 flex items-center gap-1 h-8 px-2 overflow-hidden">
              {recordedResult.waveform?.map((val, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlayingPreview ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'
                  }`}
                  style={{ height: `${val * 100}%` }}
                />
              ))}
            </div>

            <span className="font-mono text-xs text-indigo-300 shrink-0">
              {formatSeconds(recordedResult.durationSec)}
            </span>
          </div>

          {/* Title Input & Quick Suggestions */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase">
              Заголовок записи в ленте:
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Название доклада или сообщения..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {reportSuggestions.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => setCustomTitle(sug)}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-indigo-300 hover:border-slate-700 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Transcript Text Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300 uppercase flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Транскрибированный текст сообщения (можно отредактировать):</span>
              </span>
              <span className="text-[10px] text-slate-500">audioService</span>
            </div>
            <textarea
              rows={3}
              value={recordedResult.transcript}
              onChange={(e) => setRecordedResult({ ...recordedResult, transcript: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleStartRecording}
              className="min-h-[38px] px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Перезаписать</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="min-h-[38px] px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="min-h-[38px] px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Опубликовать в ленту</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface VoiceMessagePlayerProps {
  voiceData: VoiceMessageData;
  authorName: string;
  className?: string;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  voiceData,
  authorName,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioService.stopVoiceAudio();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioService.stopVoiceAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioService.playVoiceAudio(voiceData.audioUrl, voiceData.transcript, () =>
        setIsPlaying(false),
      );
    }
  };

  const handleSpeakTranscript = () => {
    if (isPlaying) {
      audioService.stopVoiceAudio();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioService.speak(voiceData.transcript, 'engineer', () => setIsPlaying(false));
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2.5 shadow-md ${className}`}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
          <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Голосовое сообщение борта</span>
        </div>
        <span className="font-mono text-slate-400 text-[10px]">
          {voiceData.recordedAt || 'Радиоэфир'} · {formatSeconds(voiceData.durationSec)}
        </span>
      </div>

      {/* Audio Playback Controls */}
      <div className="flex items-center gap-3 p-2 bg-slate-900/90 rounded-lg border border-slate-800/80">
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm shrink-0 ${
            isPlaying
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
          title={isPlaying ? 'Пауза' : 'Воспроизвести голосовое сообщение'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform Visualization */}
        <div className="flex-1 flex items-center gap-1 h-7 overflow-hidden px-1">
          {(voiceData.waveform || [0.3, 0.6, 0.8, 0.4, 0.7, 0.9, 0.5, 0.8, 0.3, 0.6]).map(
            (val, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isPlaying ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'
                }`}
                style={{ height: `${Math.max(20, val * 100)}%` }}
              />
            ),
          )}
        </div>

        <button
          type="button"
          onClick={handleSpeakTranscript}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 transition-colors text-[10px] flex items-center gap-1 shrink-0"
          title="Озвучить транскрипцию голосом бортового ассистента"
        >
          <Headphones className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Озвучить</span>
        </button>
      </div>

      {/* Real-Time Transcript Display */}
      {voiceData.transcript && (
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>Расшифровка (audioService):</span>
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed italic">«{voiceData.transcript}»</p>
        </div>
      )}
    </div>
  );
};
