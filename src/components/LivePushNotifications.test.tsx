import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { LivePushNotifications } from './LivePushNotifications';
import { AppNotification } from '../types';
import {
  playCosmicNotificationSound,
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from '../utils/sound';

describe('LivePushNotifications', () => {
  it('does not render any toasts initially for existing notifications', () => {
    const existing: AppNotification[] = [
      {
        id: 'n1',
        type: 'review',
        title: 'Прежнее уведомление',
        message: 'Старый текст',
        timestamp: '1 час назад',
        read: false,
        linkTab: 'submissions',
      },
    ];

    render(
      <LivePushNotifications
        notifications={existing}
        onMarkNotificationRead={vi.fn()}
        onNavigateTab={vi.fn()}
      />,
    );

    expect(screen.queryByText('Прежнее уведомление')).toBeNull();
  });

  it('renders a push toast when a new notification is added to the array', () => {
    const onMarkRead = vi.fn();
    const onNavigate = vi.fn();

    // Harness component to trigger notifications state updates
    const TestHarness = () => {
      const [list, setList] = useState<AppNotification[]>([]);

      return (
        <div>
          <button
            onClick={() =>
              setList([
                {
                  id: 'n2',
                  type: 'review',
                  submissionStatus: 'approved',
                  statusBadge: 'Одобрено',
                  title: 'Заявка одобрена жюри! (+95 б.)',
                  message: 'Решение по этапу 3 утверждено экспертом.',
                  timestamp: 'Только что',
                  read: false,
                  linkTab: 'submissions',
                },
                ...list,
              ])
            }
          >
            Add Notification
          </button>
          <LivePushNotifications
            notifications={list}
            onMarkNotificationRead={onMarkRead}
            onNavigateTab={onNavigate}
          />
        </div>
      );
    };

    render(<TestHarness />);

    // Click to add new notification
    fireEvent.click(screen.getByText('Add Notification'));

    // Toast should be rendered
    expect(screen.getByText('Заявка одобрена жюри! (+95 б.)')).toBeDefined();
    expect(screen.getByText('Одобрено')).toBeDefined();

    // Click on toast to navigate
    fireEvent.click(screen.getByText('Заявка одобрена жюри! (+95 б.)'));
    expect(onMarkRead).toHaveBeenCalledWith('n2');
    expect(onNavigate).toHaveBeenCalledWith('submissions');
  });

  it('allows dismissing a toast by clicking close button', () => {
    const TestHarness = () => {
      const [list, setList] = useState<AppNotification[]>([]);

      return (
        <div>
          <button
            onClick={() =>
              setList([
                {
                  id: 'n3',
                  type: 'review',
                  submissionStatus: 'needs_revision',
                  statusBadge: 'На доработке',
                  title: 'Требуется доработка решения',
                  message: 'Уточните Link Budget.',
                  timestamp: 'Только что',
                  read: false,
                  linkTab: 'submissions',
                },
              ])
            }
          >
            Trigger Revision
          </button>
          <LivePushNotifications
            notifications={list}
            onMarkNotificationRead={vi.fn()}
            onNavigateTab={vi.fn()}
          />
        </div>
      );
    };

    render(<TestHarness />);
    fireEvent.click(screen.getByText('Trigger Revision'));

    expect(screen.getByText('Требуется доработка решения')).toBeDefined();

    const closeBtn = screen.getByLabelText('Закрыть уведомление');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Требуется доработка решения')).toBeNull();
  });
});

describe('sound utility', () => {
  it('handles sound enabling/disabling safely', () => {
    setNotificationSoundEnabled(false);
    expect(isNotificationSoundEnabled()).toBe(false);
    expect(() => playCosmicNotificationSound('approved')).not.toThrow();

    setNotificationSoundEnabled(true);
    expect(isNotificationSoundEnabled()).toBe(true);
    expect(() => playCosmicNotificationSound('revision')).not.toThrow();
  });
});
