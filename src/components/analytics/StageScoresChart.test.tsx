import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StageScoresChart } from './StageScoresChart';
import { INITIAL_TEAMS } from '../../data/mockData';

describe('StageScoresChart: График рейтинговых баллов по этапам (Recharts)', () => {
  const mockTeam = INITIAL_TEAMS[0]; // «Орион-3U», rank 1, score 276

  it('рендерит заголовок графика, бейдж Recharts и общую информацию команды', () => {
    render(<StageScoresChart team={mockTeam} allTeams={INITIAL_TEAMS} />);

    expect(
      screen.getByText(/Динамика рейтинговых баллов по этапам чемпионата/i),
    ).toBeInTheDocument();
    expect(screen.getByText('RECHARTS')).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`«${mockTeam.name}»`, 'i')).length).toBeGreaterThan(0);
  });

  it('корректно отображает KPI-карточки рейтинга, среднего балла и лучшего этапа', () => {
    render(<StageScoresChart team={mockTeam} allTeams={INITIAL_TEAMS} />);

    // Общий счет
    expect(screen.getAllByText(new RegExp(`${mockTeam.totalScore}`, 'i')).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(new RegExp(`#${mockTeam.rank} в`, 'i')).length).toBeGreaterThan(0);

    // Лучший результат этапа (у Ориона 96 б. за Этап 1)
    expect(screen.getAllByText(/96/).length).toBeGreaterThan(0);
  });

  it('позволяет переключать режимы отображения: Накопительный, По этапам, Сравнение', () => {
    render(<StageScoresChart team={mockTeam} allTeams={INITIAL_TEAMS} />);

    const perStageBtn = screen.getByTestId('btn-view-perStage');
    const comparisonBtn = screen.getByTestId('btn-view-comparison');
    const cumulativeBtn = screen.getByTestId('btn-view-cumulative');

    expect(perStageBtn).toBeInTheDocument();
    expect(comparisonBtn).toBeInTheDocument();
    expect(cumulativeBtn).toBeInTheDocument();

    // Переключение на "По этапам"
    fireEvent.click(perStageBtn);
    expect(perStageBtn).toHaveClass('bg-cyan-500/20');

    // Переключение на "Сравнение"
    fireEvent.click(comparisonBtn);
    expect(comparisonBtn).toHaveClass('bg-cyan-500/20');

    // Переключение обратно на "Накопительный"
    fireEvent.click(cumulativeBtn);
    expect(cumulativeBtn).toHaveClass('bg-cyan-500/20');
  });

  it('рендерит карточки квалификационных этапов с баллами и статусами', () => {
    render(<StageScoresChart team={mockTeam} allTeams={INITIAL_TEAMS} />);

    expect(screen.getAllByText(/Этап 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Этап 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Этап 3/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Этап 4/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Этап 5/i).length).toBeGreaterThan(0);

    // Баллы первого этапа (96)
    expect(screen.getAllByText(/96/).length).toBeGreaterThan(0);
  });
});
