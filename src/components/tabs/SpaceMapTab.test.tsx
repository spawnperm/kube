import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SpaceMapTab } from './SpaceMapTab';
import { INITIAL_TEAMS, INITIAL_SPACE_OBJECTS } from '../../data/mockData';
import type { TelemetryPacket } from '../../types';

describe('SpaceMapTab: Визуализация траектории CubeSat на основе телеметрии (SVG)', () => {
  const mockTeam = INITIAL_TEAMS[0];
  const mockTelemetry: TelemetryPacket = {
    timestamp: '14:25:30',
    epoch: 1712490330000,
    satelliteName: 'КубСат-Тест-1',
    altitudeKm: 524.8,
    velocityKms: 7.61,
    latitude: 58.01,
    longitude: 56.25,
    batteryVoltage: 8.2,
    batterySocPercent: 88,
    batteryTempC: 19.5,
    solarCurrentMa: 1420,
    solarPowerW: 28.5,
    solarPanelTempC: 32.0,
    obcTempC: 24.1,
    payloadStatus: 'ACQUIRING_DATA',
    radioRssiDb: -72,
    downlinkSpeedKbps: 115.2,
    mode: 'NORMAL',
    gyroRates: [0.01, -0.02, 0.04],
    packetsDownlinked: 49200,
    rawHex: '0x1A2B3C',
  };

  it('рендерит компонент карты, инфо-полосу телеметрии и переключатель проекций', () => {
    const onAdd = vi.fn();
    const onDelete = vi.fn();

    render(
      <SpaceMapTab
        objects={INITIAL_SPACE_OBJECTS}
        activeTeam={mockTeam}
        userRole="participant"
        onAddObject={onAdd}
        onDeleteObject={onDelete}
        telemetry={mockTelemetry}
      />,
    );

    expect(
      screen.getByText(/Интерактивная карта космоса и орбитальной траектории/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/SVG TELEMETRY TRACK/i)).toBeInTheDocument();
    expect(screen.getAllByText('КубСат-Тест-1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/524.8 км/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/7.61 км\/с/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  it('рендерит элементы SVG-графики для траектории CubeSat', () => {
    const { container } = render(
      <SpaceMapTab
        objects={INITIAL_SPACE_OBJECTS}
        activeTeam={mockTeam}
        userRole="participant"
        onAddObject={vi.fn()}
        onDeleteObject={vi.fn()}
        telemetry={mockTelemetry}
      />,
    );

    // Должен присутствовать SVG-слой траектории с viewBox
    const svgEl = container.querySelector('svg[viewBox="0 0 900 440"]');
    expect(svgEl).toBeInTheDocument();

    // Проверяем наличие SVG-градиентов и фильтра свечения
    expect(svgEl?.querySelector('#trailGradient')).toBeInTheDocument();
    expect(svgEl?.querySelector('#futureOrbitGradient')).toBeInTheDocument();
    expect(svgEl?.querySelector('#cubesatGlow')).toBeInTheDocument();

    // Проверяем SVG-пути прогноза витка и следа полета
    const svgPaths = svgEl?.querySelectorAll('path');
    expect(svgPaths && svgPaths.length).toBeGreaterThan(0);
  });

  it('позволяет переключать режим проекции между Небесной сферой и Подспутниковой трассой', () => {
    render(
      <SpaceMapTab
        objects={INITIAL_SPACE_OBJECTS}
        activeTeam={mockTeam}
        userRole="participant"
        onAddObject={vi.fn()}
        onDeleteObject={vi.fn()}
        telemetry={mockTelemetry}
      />,
    );

    const groundBtn = screen.getByRole('button', { name: /Подспутниковая трасса/i });
    fireEvent.click(groundBtn);

    expect(screen.getByText(/Географическая равнопромежуточная проекция/i)).toBeInTheDocument();

    const celestialBtn = screen.getByRole('button', { name: /Небесная сфера/i });
    fireEvent.click(celestialBtn);

    expect(screen.getByText(/Экваториальная небесная сетка/i)).toBeInTheDocument();
  });

  it('позволяет скрывать и включать SVG-слой траектории и прогноза витка', () => {
    const { container } = render(
      <SpaceMapTab
        objects={INITIAL_SPACE_OBJECTS}
        activeTeam={mockTeam}
        userRole="participant"
        onAddObject={vi.fn()}
        onDeleteObject={vi.fn()}
        telemetry={mockTelemetry}
      />,
    );

    const toggleTrajectoryBtn = screen.getByRole('button', { name: /Траектория CubeSat/i });
    expect(toggleTrajectoryBtn).toBeInTheDocument();

    // Отключаем траекторию
    fireEvent.click(toggleTrajectoryBtn);
    expect(container.querySelector('svg[viewBox="0 0 900 440"]')).toBeNull();

    // Включаем обратно
    fireEvent.click(toggleTrajectoryBtn);
    expect(container.querySelector('svg[viewBox="0 0 900 440"]')).toBeInTheDocument();
  });

  it('поддерживает сброс накопленного трека траектории', () => {
    render(
      <SpaceMapTab
        objects={INITIAL_SPACE_OBJECTS}
        activeTeam={mockTeam}
        userRole="participant"
        onAddObject={vi.fn()}
        onDeleteObject={vi.fn()}
        telemetry={mockTelemetry}
      />,
    );

    const resetBtn = screen.getByRole('button', { name: /Сброс трека/i });
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);
  });
});
