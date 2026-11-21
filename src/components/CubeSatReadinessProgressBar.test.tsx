import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CubeSatReadinessProgressBar } from './CubeSatReadinessProgressBar';
import { INITIAL_TEAMS } from '../data/mockData';

describe('CubeSatReadinessProgressBar: Комплексный прогресс-бар подготовки КубСата', () => {
  const mockTeam = INITIAL_TEAMS[0];

  it('рендерит заголовок интегральной готовности, бейдж TRL и статус подготовки', () => {
    render(<CubeSatReadinessProgressBar team={mockTeam} />);

    expect(screen.getByText(/ИНТЕГРАЛЬНАЯ ГОТОВНОСТЬ КУБСАТА К ЗАПУСКУ/i)).toBeInTheDocument();
    expect(screen.getByText(/TRL \/ FLIGHT READINESS/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Общий суммарный прогресс подготовки систем борта/i),
    ).toBeInTheDocument();
  });

  it('отображает все 4 качественных показателя бортовых систем КубСата', () => {
    render(<CubeSatReadinessProgressBar team={mockTeam} />);

    expect(screen.getByText(/Баллистика и орбита/i)).toBeInTheDocument();
    expect(screen.getByText(/Конструкция и масса/i)).toBeInTheDocument();
    expect(screen.getByText(/Радиоканал и питание/i)).toBeInTheDocument();
    expect(screen.getByText(/Научная программа ПН/i)).toBeInTheDocument();

    expect(
      screen.getByText(new RegExp(`Высота: ${mockTeam.cubesatSpecs.orbitAltitudeKm} км`, 'i')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`Формат: ${mockTeam.cubesatSpecs.format}`, 'i')),
    ).toBeInTheDocument();
  });

  it('отображает сегментированный прогресс по всем 5 этапам кейс-чемпионата', () => {
    render(<CubeSatReadinessProgressBar team={mockTeam} />);

    expect(screen.getByText('Этап 01')).toBeInTheDocument();
    expect(screen.getByText('Этап 02')).toBeInTheDocument();
    expect(screen.getByText('Этап 03')).toBeInTheDocument();
    expect(screen.getByText('Этап 04')).toBeInTheDocument();
    expect(screen.getByText('Этап 05')).toBeInTheDocument();
  });

  it('вызывает onNavigateTab при клике на карточку этапа для загрузки решения', () => {
    const onNavigate = vi.fn();
    render(<CubeSatReadinessProgressBar team={mockTeam} onNavigateTab={onNavigate} />);

    const stage1Btn = screen.getByRole('button', { name: /Этап 01/i });
    fireEvent.click(stage1Btn);

    expect(onNavigate).toHaveBeenCalledWith('submissions');
  });
});
