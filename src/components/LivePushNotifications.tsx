import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Bell,
  X,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AppNotification } from '../types';
import {
  playCosmicNotificationSound,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from '../utils/sound';

interface LivePushNotificationsProps {
  notifications: AppNotification[];
  onMarkNotificationRead: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

interface ActiveToast {
  notification: AppNotification;
  addedAt: number;
  durationMs: number;
}

export const LivePushNotifications: React.FC<LivePushNotificationsProps> = ({
  notifications,
  onMarkNotificationRead,
  onNavigateTab,
}) => {
  const [activeToasts, setActiveToasts] = useState<ActiveToast[]>([]);
  const [isMuted, setIsMuted] = useState(!isNotificationSoundEnabled());
  const [isPaused, setIsPaused] = useState(false);

  // Set of seen notification IDs so we only push new ones
  const seenIdsRef = useRef<Set<string>>(new Set(notifications.map((n) => n.id)));
  const initialMountRef = useRef(true);

  // Track notifications updates
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }

    const newNotifications: AppNotification[] = [];

    for (const notif of notifications) {
      if (!seenIdsRef.current.has(notif.id) && !notif.read) {
        seenIdsRef.current.add(notif.id);
        newNotifications.push(notif);
      }
    }

    if (newNotifications.length > 0) {
      // Pick the newest notifications to toast (max 2 at a time)
      const toAdd = newNotifications.slice(0, 2);

      toAdd.forEach((notif) => {
        const titleLower = notif.title.toLowerCase();
        let soundVariant: 'approved' | 'revision' | 'submitted' | 'default' = 'default';

        if (notif.submissionStatus === 'approved' || titleLower.includes('одобрен')) {
          soundVariant = 'approved';
        } else if (
          notif.submissionStatus === 'needs_revision' ||
          titleLower.includes('доработк') ||
          titleLower.includes('ревизи')
        ) {
          soundVariant = 'revision';
        } else if (
          notif.submissionStatus === 'submitted' ||
          titleLower.includes('подан') ||
          titleLower.includes('передан')
        ) {
          soundVariant = 'submitted';
        }

        playCosmicNotificationSound(soundVariant);
      });

      setActiveToasts((prev) => {
        const newToasts: ActiveToast[] = toAdd.map((n) => ({
          notification: n,
          addedAt: Date.now(),
          durationMs: 7000,
        }));
        // Keep maximum 3 toasts visible
        return [...newToasts, ...prev].slice(0, 3);
      });
    }
  }, [notifications]);

  // Auto-dismiss interval timer
  useEffect(() => {
    if (activeToasts.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setActiveToasts((prev) => prev.filter((toast) => now - toast.addedAt < toast.durationMs));
    }, 400);

    return () => clearInterval(interval);
  }, [activeToasts, isPaused]);

  const handleDismiss = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveToasts((prev) => prev.filter((t) => t.notification.id !== id));
  };

  const handleToastClick = (toast: ActiveToast) => {
    const { notification } = toast;
    onMarkNotificationRead(notification.id);
    handleDismiss(notification.id);
    if (notification.linkTab) {
      onNavigateTab(notification.linkTab);
    } else {
      onNavigateTab('submissions');
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isMuted;
    setIsMuted(nextState);
    setNotificationSoundEnabled(!nextState);
    if (!nextState) {
      playCosmicNotificationSound('default');
    }
  };

  if (activeToasts.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Push-уведомления статуса заявки"
      className="fixed bottom-5 right-4 sm:top-20 sm:bottom-auto z-50 flex flex-col items-end gap-3 pointer-events-none max-w-sm w-full px-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sound Toggle Header */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-[11px] text-slate-400 backdrop-blur-md shadow-lg">
        <span className="flex items-center gap-1.5 font-medium text-cyan-300">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>ЦУП Push-канал</span>
        </span>
        <button
          type="button"
          onClick={toggleSound}
          title={isMuted ? 'Включить звук уведомлений' : 'Отключить звук'}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {isMuted ? (
            <VolumeX className="h-3.5 w-3.5 text-slate-500" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
          )}
        </button>
      </div>

      {/* Stacked Toasts */}
      {activeToasts.map((toast) => {
        const { notification } = toast;
        const titleLower = notification.title.toLowerCase();

        const isApproved =
          notification.submissionStatus === 'approved' || titleLower.includes('одобрен');
        const isRevision =
          notification.submissionStatus === 'needs_revision' ||
          titleLower.includes('доработк') ||
          titleLower.includes('ревизи');
        const isSubmitted =
          notification.submissionStatus === 'submitted' ||
          titleLower.includes('подан') ||
          titleLower.includes('передан');

        let borderClass = 'border-cyan-500/40 bg-slate-900/95 shadow-cyan-950/50';
        let badgeBg = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
        let badgeText = notification.statusBadge || 'Статус обновлен';
        let Icon = Bell;
        let iconColor = 'text-cyan-400';

        if (isApproved) {
          borderClass = 'border-emerald-500/50 bg-slate-950/95 shadow-emerald-950/50';
          badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
          badgeText = notification.statusBadge || 'Заявка одобрена';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-400';
        } else if (isRevision) {
          borderClass = 'border-amber-500/50 bg-slate-950/95 shadow-amber-950/50';
          badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
          badgeText = notification.statusBadge || 'Требуется доработка';
          Icon = AlertTriangle;
          iconColor = 'text-amber-400';
        } else if (isSubmitted) {
          borderClass = 'border-sky-500/50 bg-slate-950/95 shadow-sky-950/50';
          badgeBg = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
          badgeText = notification.statusBadge || 'Передано экспертам';
          Icon = Clock;
          iconColor = 'text-sky-400';
        } else if (notification.type === 'achievement') {
          borderClass = 'border-purple-500/50 bg-slate-950/95 shadow-purple-950/50';
          badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
          badgeText = 'Достижение ЦУП';
          Icon = Sparkles;
          iconColor = 'text-purple-400';
        }

        return (
          <div
            key={notification.id}
            role="status"
            className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border p-4 backdrop-blur-xl shadow-2xl transition-all hover:scale-[1.01] ${borderClass}`}
          >
            {/* Top header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 border border-slate-700/60">
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}
                >
                  {badgeText}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono">
                  {notification.timestamp}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDismiss(notification.id, e)}
                  aria-label="Закрыть уведомление"
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Clickable notification content */}
            <button
              type="button"
              onClick={() => handleToastClick(toast)}
              className="mt-2.5 w-full text-left cursor-pointer focus:outline-none"
            >
              <h4 className="text-xs font-bold text-white leading-snug group-hover:text-cyan-300 transition-colors">
                {notification.title}
              </h4>
              <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                {notification.message}
              </p>

              {/* Action prompt */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                <span className="text-slate-400">Нажмите, чтобы открыть</span>
                <span className="flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300">
                  <span>Перейти к этапу</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </button>

            {/* Animated timeout bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${
                  isApproved ? 'bg-emerald-400' : isRevision ? 'bg-amber-400' : 'bg-cyan-400'
                } animate-shrink-width`}
                style={{
                  animationDuration: `${toast.durationMs}ms`,
                  animationPlayState: isPaused ? 'paused' : 'running',
                }}
              />
            </div>
          </div>
        );
      })}
    </aside>
  );
};
