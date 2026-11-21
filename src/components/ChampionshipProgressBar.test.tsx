import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChampionshipProgressBar } from './ChampionshipProgressBar';
import { INITIAL_TEAMS } from '../data/mockData';

describe('ChampionshipProgressBar: Диаграмма Ганта и индикатор дедлайнов', () => {
  const team = INITIAL_TEAMS[0]; // Orion-3
  const onNavigateTab = vi.fn();

  it('отображает заголовок диаграммы Ганта и статус прохождения этапов', () => {
    render(<ChampionshipProgressBar team={team} onNavigateTab={onNavigateTab} />);

    expect(screen.getByText('ИНДИКАТОР ПРОГРЕССА И ДЕДЛАЙНОВ')).toBeInTheDocument();
    expect(screen.getByText('ДИАГРАММА ГАНТА')).toBeInTheDocument();
    expect(screen.getByText(/Пройдено/i)).toBeInTheDocument();
  });

  it('отображает дедлайны и временные шкалы этапов чемпионата', () => {
    render(<ChampionshipProgressBar team={team} onNavigateTab={onNavigateTab} />);

    // Check deadlines and dates
    expect(screen.getByText('Календарная шкала чемпионата (Май — Июнь 2026)')).toBeInTheDocument();
    expect(screen.getByText('СЕГОДНЯ')).toBeInTheDocument();
    expect(screen.getByText(/10 мая — 24 мая/)).toBeInTheDocument();
    expect(screen.getByText(/25 мая — 02 июня/)).toBeInTheDocument();
  });

  it('переключает режимы отображения между Гантом, шагами спринта и баллами', () => {
    render(<ChampionshipProgressBar team={team} onNavigateTab={onNavigateTab} />);

    // Click "Этапы спринта"
    const stepperBtn = screen.getByRole('button', { name: /Этапы спринта/i });
    fireEvent.click(stepperBtn);
    expect(screen.getAllByText(/max 100 б/i).length).toBeGreaterThan(0);

    // Click "Баллы (Score)"
    const scoreBtn = screen.getByRole('button', { name: /Баллы \(Score\)/i });
    fireEvent.click(scoreBtn);
    expect(screen.getByText('Суммарный балл команды')).toBeInTheDocument();
    expect(screen.getByText(/Распределение баллов по этапам:/i)).toBeInTheDocument();
  });

  it('вызывает onNavigateTab при клике на этап или кнопку перехода к загрузке', () => {
    render(<ChampionshipProgressBar team={team} onNavigateTab={onNavigateTab} />);

    const uploadBtn = screen.getByRole('button', { name: /Загрузить решение этапа/i });
    fireEvent.click(uploadBtn);
    expect(onNavigateTab).toHaveBeenCalledWith('submissions');
  });
});
