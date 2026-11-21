import React, { useState } from 'react';
import { X, RefreshCw, Check, Copy } from 'lucide-react';
import { audioService } from '@/src/shared/lib/audioService';
import { storageService } from '@/src/shared/lib/storageService';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  onUpdateRoomCode: (code: string) => void;
  onPushSync: () => Promise<boolean>;
  onPullSync: (code: string) => Promise<boolean>;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  onUpdateRoomCode,
  onPushSync,
  onPullSync,
}) => {
  const [inputCode, setInputCode] = useState(roomCode);
  const [inputToken, setInputToken] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTokenCopied, setIsTokenCopied] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const roomToken = storageService.getRoomToken(roomCode) || '';

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    audioService.playSuccessChime();
  };

  const handleCopyToken = () => {
    if (!roomToken) return;
    navigator.clipboard.writeText(roomToken);
    setIsTokenCopied(true);
    setTimeout(() => setIsTokenCopied(false), 2000);
    audioService.playSuccessChime();
  };

  const handlePush = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    const success = await onPushSync();
    setIsSyncing(false);
    if (success) {
      setSyncStatusMsg('Данные успешно выгружены в облако КОСМОПОРТ!');
      audioService.playSuccessChime();
    } else {
      setSyncStatusMsg('Ошибка отправки. Проверьте соединение.');
    }
  };

  const handlePull = async () => {
    if (!inputCode.trim()) return;
    setIsSyncing(true);
    setSyncStatusMsg(null);
    if (inputToken.trim()) {
      storageService.saveRoomToken(inputCode.trim().toUpperCase(), inputToken.trim());
    }
    const success = await onPullSync(inputCode.trim().toUpperCase());
    setIsSyncing(false);
    if (success) {
      setSyncStatusMsg(`Синхронизировано по коду ${inputCode.trim().toUpperCase()}!`);
      audioService.playSuccessChime();
    } else {
      setSyncStatusMsg('Комната не найдена, неверный код или токен.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-xs text-slate-300 relative shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Сквозная синхронизация устройств</h2>
              <span className="text-[11px] text-slate-400">Телефон ↔ Ноутбук ↔ Планшет</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Room Code */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Код вашей синхронизации
          </span>
          <div className="text-2xl font-black font-mono tracking-widest text-indigo-400 py-1">
            {roomCode}
          </div>
          <p className="text-[11px] text-slate-400">
            Введите этот код на компьютере или смартфоне напарника вместе с токеном комнаты, чтобы
            мгновенно видеть прогресс проекта.
          </p>

          {roomToken && (
            <div className="flex flex-col gap-1.5 items-center pt-1 border-t border-slate-800 mt-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Токен комнаты (защита данных)
              </span>
              <div className="text-sm font-mono text-emerald-400 break-all max-w-full">
                {roomToken}
              </div>
              <button
                onClick={handleCopyToken}
                className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                {isTokenCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{isTokenCopied ? 'Токен скопирован!' : 'Скопировать токен'}</span>
              </button>
            </div>
          )}

          <button
            onClick={handleCopyCode}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{isCopied ? 'Скопировано!' : 'Скопировать код'}</span>
          </button>
        </div>

        {/* Connect to existing room */}
        <div className="space-y-2">
          <label className="block text-slate-300 font-medium">
            Подключиться к коду другой сессии:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="sync-room-code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="НАПРИМЕР: KOSMO-742"
              aria-label="Код комнаты синхронизации"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white text-xs uppercase focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handlePull}
              disabled={isSyncing}
              className="min-h-[42px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            >
              Загрузить
            </button>
          </div>
          <input
            type="password"
            id="sync-room-token"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value.trim())}
            placeholder="Токен комнаты (обязателен для загрузки)"
            aria-label="Токен комнаты синхронизации"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Action: Push current state to Cloud */}
        <div className="pt-2">
          <button
            onClick={handlePush}
            disabled={isSyncing}
            className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`}
            />
            <span>Сохранить текущее состояние в облако</span>
          </button>
        </div>

        {syncStatusMsg && (
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-300 text-center text-xs">
            {syncStatusMsg}
          </div>
        )}
      </div>
    </div>
  );
};
