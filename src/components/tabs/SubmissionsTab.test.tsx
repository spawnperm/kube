import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { SubmissionsTab } from './SubmissionsTab';
import { INITIAL_TEAMS, INITIAL_SUBMISSIONS } from '../../data/mockData';
import {
  saveSubmissionDraft,
  loadSubmissionDraft,
  hasSubmissionDraft,
} from '../../utils/submissionDraft';

describe('SubmissionsTab: Механизм автосохранения черновиков', () => {
  const mockTeam = INITIAL_TEAMS[0];

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('автоматически сохраняет введенные данные в localStorage черновика', () => {
    const onSubmit = vi.fn();

    render(
      <SubmissionsTab
        team={mockTeam}
        submissions={INITIAL_SUBMISSIONS}
        onSubmitSolution={onSubmit}
      />,
    );

    const titleInput = screen.getByLabelText(/Название технического отчета/i);

    // Пользователь вводит название
    fireEvent.change(titleInput, { target: { value: 'Мой черновой отчет по фотометру' } });

    // Проматываем таймер дебаунса автосохранения (450ms)
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Проверяем, что черновик сохранился в localStorage
    const savedDraft = loadSubmissionDraft(mockTeam.id, 'stage_3');
    expect(savedDraft).not.toBeNull();
    expect(savedDraft?.title).toBe('Мой черновой отчет по фотометру');
  });

  it('автоматически восстанавливает ранее сохраненный черновик при открытии формы', () => {
    // Предварительно сохраняем черновик в localStorage
    saveSubmissionDraft(mockTeam.id, 'stage_3', {
      title: 'Восстановленное название отчета',
      summary: 'Сохраненное краткое резюме расчета',
      details: 'Детальное математическое описание',
      repoUrl: 'https://github.com/team/cubesat-draft',
      calcDeltaV: 165,
      calcPower: 21.0,
      calcMargin: 10.5,
      uploadedFiles: [],
    });

    render(
      <SubmissionsTab
        team={mockTeam}
        submissions={INITIAL_SUBMISSIONS}
        onSubmitSolution={vi.fn()}
      />,
    );

    // Проверяем, что поля формы заполнены из черновика
    expect(screen.getByDisplayValue('Восстановленное название отчета')).toBeDefined();
    expect(screen.getByDisplayValue('Сохраненное краткое резюме расчета')).toBeDefined();
    expect(screen.getByText(/Восстановлен несохраненный черновик/i)).toBeDefined();
  });

  it('очищает черновик из localStorage при клике на "Сбросить черновик"', () => {
    saveSubmissionDraft(mockTeam.id, 'stage_3', {
      title: 'Черновик для удаления',
      summary: 'Резюме',
      details: 'Детали',
      repoUrl: '',
      calcDeltaV: 145,
      calcPower: 18.5,
      calcMargin: 9.2,
      uploadedFiles: [],
    });

    render(
      <SubmissionsTab
        team={mockTeam}
        submissions={INITIAL_SUBMISSIONS}
        onSubmitSolution={vi.fn()}
      />,
    );

    const discardButtons = screen.getAllByRole('button', { name: /Сбросить черновик/i });
    fireEvent.click(discardButtons[0]);

    // Черновик удален из хранилища
    expect(hasSubmissionDraft(mockTeam.id, 'stage_3')).toBe(false);
  });
});
