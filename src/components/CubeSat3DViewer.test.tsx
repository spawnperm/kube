import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CubeSat3DViewer } from './CubeSat3DViewer';
import { TelemetrySimulator } from '../services/telemetrySimulator';

describe('CubeSat3DViewer: 3D-визуализация КубСата на Three.js и ориентация по телеметрии', () => {
  const sim = new TelemetrySimulator();
  const mockTelemetry = sim.generateInitialPacket();

  it('рендерит контейнер 3D-модели, позывной спутника и статус ADCS', () => {
    render(<CubeSat3DViewer telemetry={mockTelemetry} />);

    expect(screen.getByText(/ORION-3 \[3U CubeSat\]/i)).toBeInTheDocument();
    expect(screen.getByText(/УГЛЫ ОРИЕНТАЦИИ/i)).toBeInTheDocument();
    expect(screen.getByText(/Крен \(X\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Тангаж \(Y\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Рыскание \(Z\)/i)).toBeInTheDocument();
  });

  it('отображает расчетные углы ориентации спутника из телеметрии', () => {
    render(<CubeSat3DViewer telemetry={mockTelemetry} />);

    if (mockTelemetry.orientation) {
      const rollStr =
        mockTelemetry.orientation.roll > 0
          ? `+${mockTelemetry.orientation.roll.toFixed(1)}°`
          : `${mockTelemetry.orientation.roll.toFixed(1)}°`;
      expect(screen.getByText(rollStr)).toBeInTheDocument();
    }
  });

  it('переключает режим следования за телеметрией на свободный осмотр', () => {
    render(<CubeSat3DViewer telemetry={mockTelemetry} />);

    const followBtn = screen.getByTitle(/Следование за телеметрией ВКЛ/i);
    expect(followBtn).toBeInTheDocument();
    expect(screen.getByText(/Телеметрия Live/i)).toBeInTheDocument();

    fireEvent.click(followBtn);
    expect(screen.getByText(/Свободный/i)).toBeInTheDocument();
  });

  it('поддерживает переключение ракурсов камеры (пресеты)', () => {
    render(<CubeSat3DViewer telemetry={mockTelemetry} />);

    const nadirBtn = screen.getByRole('button', { name: /Оптика \(Nadir\)/i });
    expect(nadirBtn).toBeInTheDocument();
    fireEvent.click(nadirBtn);

    const solarBtn = screen.getByRole('button', { name: /СБ \(\+X\)/i });
    fireEvent.click(solarBtn);

    const antennaBtn = screen.getByRole('button', { name: /Антенна/i });
    fireEvent.click(antennaBtn);
  });

  it('поддерживает сворачивание и развертывание солнечных крыльев', () => {
    render(<CubeSat3DViewer telemetry={mockTelemetry} />);

    const wingsBtn = screen.getByTitle(/Развернуть \/ сложить солнечные крылья/i);
    expect(screen.getByText(/СБ: Крылья/i)).toBeInTheDocument();

    fireEvent.click(wingsBtn);
    expect(screen.getByText(/СБ: Корпус/i)).toBeInTheDocument();
  });

  it('переключает режим полного экрана', () => {
    render(<CubeSat3DViewer telemetry={mockTelemetry} />);

    const fullscreenBtn = screen.getByTitle(/Развернуть во весь экран/i);
    fireEvent.click(fullscreenBtn);

    expect(screen.getByTitle(/Свернуть/i)).toBeInTheDocument();
  });

  it('динамически отражает статус режима B-Dot Detumbling при соответствующей телеметрии', () => {
    const detumblePacket = sim.getNextPacket(mockTelemetry, 1, 'DETUMBLING');
    render(<CubeSat3DViewer telemetry={detumblePacket} />);

    expect(screen.getByText(/B-Dot Detumbling/i)).toBeInTheDocument();
  });

  it('отображает кнопку включения VR-режима (Cardboard-style)', () => {
    render(<CubeSat3DViewer telemetry={mockTelemetry} />);

    const vrBtn = screen.getByRole('button', {
      name: /VR-режим Cardboard/i,
    });
    expect(vrBtn).toBeInTheDocument();
    expect(screen.getByText(/Cardboard/i)).toBeInTheDocument();
  });

  it('активирует стереоскопический режим Cardboard и позволяет выйти из VR', () => {
    render(<CubeSat3DViewer telemetry={mockTelemetry} />);

    const vrBtn = screen.getByRole('button', {
      name: /VR-режим Cardboard/i,
    });
    fireEvent.click(vrBtn);

    // Должен отобразиться стереоскопический оверлей Cardboard
    expect(screen.getByText(/VR CARDBOARD STEREO/i)).toBeInTheDocument();
    expect(screen.getByText(/IPD: 64 мм/i)).toBeInTheDocument();
    expect(screen.getByText(/Вставьте смартфон в VR-очки Cardboard/i)).toBeInTheDocument();

    // Регулировка IPD
    const increaseIpdBtn = screen.getByTitle(/Увеличить межзрачковое расстояние/i);
    fireEvent.click(increaseIpdBtn);
    expect(screen.getByText(/IPD: 66 мм/i)).toBeInTheDocument();

    // Выход из VR режима
    const exitVrBtn = screen.getByRole('button', { name: /Выйти из VR/i });
    fireEvent.click(exitVrBtn);

    // Возврат к стандартному интерфейсу
    expect(screen.queryByText(/VR CARDBOARD STEREO/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ORION-3 \[3U CubeSat\]/i)).toBeInTheDocument();
  });
});
