import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CubeSatFlightTimeline } from './CubeSatFlightTimeline';
import { TelemetrySimulator } from '../services/telemetrySimulator';

describe('CubeSatFlightTimeline: Временная шкала ключевых событий полета КубСата', () => {
  const sim = new TelemetrySimulator();
  const mockTelemetry = sim.generateInitialPacket();

  it('рендерит заголовок хронологии полета, статус MET и счетчик выполненных этапов', () => {
    render(<CubeSatFlightTimeline telemetry={mockTelemetry} />);

    expect(screen.getByText(/Хронология полета & Временная шкала миссии/i)).toBeInTheDocument();
    expect(screen.getByText(/LIVE MET:/i)).toBeInTheDocument();
    expect(screen.getByText(/Выполнено этапов:/i)).toBeInTheDocument();
  });

  it('отображает ключевые вехи миссии: отделение, раскрытие СБ, развертывание антенн и радиомаяк', () => {
    render(<CubeSatFlightTimeline telemetry={mockTelemetry} />);

    expect(screen.getAllByText(/Отделение от пускового контейнера/i).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.getAllByText(/Раскрытие панелей солнечных батарей/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Развертывание 4-элементного антенного комплекса/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Первый радиомаяк и начало регулярной передачи/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('позволяет фильтровать события по категориям (Развертывание, Системы, Радиоканал)', () => {
    render(<CubeSatFlightTimeline telemetry={mockTelemetry} />);

    const deployFilter = screen.getByRole('button', { name: /^Развертывание$/i });
    fireEvent.click(deployFilter);

    // Должны остаться события развертывания
    expect(
      screen.getAllByText(/Развертывание 4-элементного антенного комплекса/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Раскрытие панелей солнечных батарей/i).length,
    ).toBeGreaterThanOrEqual(1);

    // Переключение обратно на "Все события"
    const allFilter = screen.getByRole('button', { name: /^Все события$/i });
    fireEvent.click(allFilter);
    expect(screen.getAllByText(/Отделение от пускового контейнера/i).length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it('переключает формат отображения: интерактивная шкала vs подробный лог', () => {
    render(<CubeSatFlightTimeline telemetry={mockTelemetry} />);

    const listBtn = screen.getByRole('button', { name: /Подробный лог/i });
    fireEvent.click(listBtn);

    // В подробном логе отображаются описания и бейджи
    expect(screen.getAllByText(/Выполнено/i).length).toBeGreaterThan(0);

    const flowBtn = screen.getByRole('button', { name: /Интерактивная шкала/i });
    fireEvent.click(flowBtn);
    expect(screen.getByText(/Отметка циклограммы:/i)).toBeInTheDocument();
  });

  it('позволяет выбрать событие кликом на узел и отображает параметры телеметрии', () => {
    render(<CubeSatFlightTimeline telemetry={mockTelemetry} />);

    // Клик по узлу раскрытия солнечных батарей
    const solarNode = screen.getByRole('button', {
      name: /Раскрытие панелей солнечных батарей/i,
    });
    fireEvent.click(solarNode);

    // В карточке выбранного события отображаются параметры
    expect(screen.getByText(/Подтверждающие параметры телеметрии борта:/i)).toBeInTheDocument();
    expect(screen.getByText(/Генерация панелей/i)).toBeInTheDocument();
  });

  it('динамически реагирует на изменение режима телеметрии (DETUMBLING, ECLIPSE)', () => {
    const detumbleTelemetry = sim.getNextPacket(mockTelemetry, 1, 'DETUMBLING');
    render(<CubeSatFlightTimeline telemetry={detumbleTelemetry} />);

    // Этап детамблинга должен перейти в активное состояние
    expect(screen.getAllByText(/АКТИВНО СЕЙЧАС|АКТИВЕН: B-DOT DAMPING/i).length).toBeGreaterThan(0);
  });

  it('вызывает onForceEvent при нажатии на кнопки моделирования событий', () => {
    const onForceEvent = vi.fn();
    render(<CubeSatFlightTimeline telemetry={mockTelemetry} onForceEvent={onForceEvent} />);

    const detumbleBtn = screen.getByRole('button', { name: /Детамблинг/i });
    fireEvent.click(detumbleBtn);
    expect(onForceEvent).toHaveBeenCalledWith('DETUMBLING');

    const eclipseBtn = screen.getByRole('button', { name: /Тень/i });
    fireEvent.click(eclipseBtn);
    expect(onForceEvent).toHaveBeenCalledWith('ECLIPSE');

    const transmitBtn = screen.getByRole('button', { name: /Сброс связи/i });
    fireEvent.click(transmitBtn);
    expect(onForceEvent).toHaveBeenCalledWith('TRANSMITTING');
  });
});
