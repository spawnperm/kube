import React, { useState, useEffect } from 'react';
import { X, Bell, Sparkles, Clock, CheckCircle2, Send, ShieldCheck, Zap, Bot } from 'lucide-react';
import { audioService } from '@/src/shared/lib/audioService';
import { kubikAlertService } from '@/src/contexts/championship/services/kubikAlertService';
import { KubikDeadlineAlert } from '@/src/shared/types/index';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onClearUnread: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onClearUnread,
}) => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
  );

  const [alerts, setAlerts] = useState<KubikDeadlineAlert[]>(() => kubikAlertService.getAlerts());

  useEffect(() => {
    const unsub = kubikAlertService.subscribe(() => {
      setAlerts(kubikAlertService.getAlerts());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
        if (perm === 'granted') {
          audioService.playSuccessChime();
          new Notification('КОСМОПОРТ Push активирован 🚀', {
            body: 'Вы будете вовремя получать уведомления о дедлайнах и подсказках бортового компьютера «Леший»!',
            icon: '/icon-192.png',
          });
        }
      } catch (e) {
        console.warn(e);
      }
    } else {
      alert('Push-уведомления не поддерживаются вашим мобильным браузером.');
    }
  };

  const handleSendTestPush = () => {
    audioService.playSuccessChime();
    kubikAlertService.testKubikAlertSimulation(2);
  };

  const handleMarkAllRead = () => {
    kubikAlertService.markAllAlertsAsRead();
    onClearUnread();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-xs text-slate-300 relative shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Центр Push-уведомлений</h2>
              <span className="text-[11px] text-slate-400">Мотивация и дедлайны чемпионата</span>
            </div>
          </div>
          <button
            onClick={() => {
              onClearUnread();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission status card */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Статус системных Push
            </div>
            <div className="text-[11px] text-slate-400">
              {permissionState === 'granted'
                ? 'Разрешено на этом устройстве'
                : 'Требуется разрешение браузера'}
            </div>
          </div>

          {permissionState !== 'granted' ? (
            <button
              onClick={handleRequestPushPermission}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs whitespace-nowrap"
            >
              Включить Push
            </button>
          ) : (
            <button
              onClick={handleSendTestPush}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs whitespace-nowrap"
            >
              Тест Push
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Новых оповещений от Лешего нет. Системы корабля в норме.
            </div>
          ) : (
            alerts.map((n) => (
              <div
                key={n.id}
                onClick={() => kubikAlertService.markAlertAsRead(n.id)}
                className={`p-3 rounded-xl border text-left space-y-1 transition-all cursor-pointer ${
                  !n.isRead
                    ? n.alertLevel === 'urgent'
                      ? 'bg-rose-950/40 border-rose-500/50 text-white shadow-md shadow-rose-950/20'
                      : 'bg-indigo-950/40 border-indigo-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{n.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {n.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{n.message}</p>
                {n.deadlineTime && (
                  <div className="text-[10px] text-amber-400/90 font-mono pt-0.5">
                    ⏰ Дедлайн: {n.deadlineTime}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Прочитать все
          </button>
          <button
            onClick={() => {
              onClearUnread();
              onClose();
            }}
            className="min-h-[38px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
