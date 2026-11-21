import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StageSuccessStatsChart } from './StageSuccessStatsChart';
import { INITIAL_TEAMS } from '../../data/mockData';

describe('StageSuccessStatsChart: Статистические графики успешности этапов (Recharts)', () => {
  const mockTeam = INITIAL_TEAMS[0];

  it('рендерит заголовок компонента, бейдж Recharts и имя команды', () => {
    render(<StageSuccessStatsChart team={mockTeam} allTeams={INITIAL_TEAMS} />);

    expect(
      screen.getByText(/Статистические графики успешности этапов команды/i),
    ).toBeInTheDocument();
    expect(screen.getByText('RECHARTS')).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`«${mockTeam.name}»`, 'i')).length).toBeGreaterThan(0);
  });

  it('отображает сводные KPI метрики успешности и TRL', () => {
    render(<StageSuccessStatsChart team={mockTeam} allTeams={INITIAL_TEAMS} />);

    expect(screen.getByText('Общая успешность')).toBeInTheDocument();
    expect(screen.getByText('Уровень готовности')).toBeInTheDocument();
    expect(screen.getByText('Сходимость расчетов')).toBeInTheDocument();
    expect(screen.getByText('Зачтено этапов')).toBeInTheDocument();
  });

  it('позволяет переключать все 4 аналитических режима Recharts', () => {
    render(<StageSuccessStatsChart team={mockTeam} allTeams={INITIAL_TEAMS} />);

    const rateBtn = screen.getByTestId('btn-mode-rate');
    const radarBtn = screen.getByTestId('btn-mode-radar');
    const criteriaBtn = screen.getByTestId('btn-mode-criteria');
    const statusBtn = screen.getByTestId('btn-mode-status');

    expect(rateBtn).toBeInTheDocument();
    expect(radarBtn).toBeInTheDocument();
    expect(criteriaBtn).toBeInTheDocument();
    expect(statusBtn).toBeInTheDocument();

    // Mode 1: Rate & TRL
    expect(screen.getByTestId('chart-container-rate')).toBeInTheDocument();

    // Mode 2: Radar
    fireEvent.click(radarBtn);
    expect(screen.getByTestId('chart-container-radar')).toBeInTheDocument();
    expect(screen.getByText(/Радар профильных инженерных компетенций/i)).toBeInTheDocument();

    // Mode 3: Criteria Breakdown
    fireEvent.click(criteriaBtn);
    expect(screen.getByTestId('chart-container-criteria')).toBeInTheDocument();
    expect(
      screen.getByText(/Структура баллов по критериям судейской комиссии/i),
    ).toBeInTheDocument();

    // Mode 4: Status Distribution
    fireEvent.click(statusBtn);
    expect(screen.getByTestId('chart-container-pie')).toBeInTheDocument();
    expect(screen.getByText(/Баланс готовности этапов и статус аттестации/i)).toBeInTheDocument();

    // Return to Rate
    fireEvent.click(rateBtn);
    expect(screen.getByTestId('chart-container-rate')).toBeInTheDocument();
  });

  it('рендерит карточки каждого из 5 этапов чемпионата с процентами успешности', () => {
    render(<StageSuccessStatsChart team={mockTeam} allTeams={INITIAL_TEAMS} />);

    expect(screen.getAllByText(/Этап 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Этап 2/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Этап 3/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Этап 4/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Этап 5/i).length).toBeGreaterThan(0);
  });
});
