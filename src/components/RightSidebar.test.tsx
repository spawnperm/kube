import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RightSidebar } from './RightSidebar';
import { INITIAL_TEAMS } from '../data/mockData';
import { TelemetrySimulator } from '../services/telemetrySimulator';

const mockTelemetry = new TelemetrySimulator().generateInitialPacket();

describe('RightSidebar: Боковая панель управления ЦУП', () => {
  const baseProps = {
    isOpen: false,
    onToggle: vi.fn(),
    currentTab: 'team',
    onTabChange: vi.fn(),
    userRole: 'participant' as const,
    onRoleChange: vi.fn(),
    activeTeam: INITIAL_TEAMS[0],
    allTeams: INITIAL_TEAMS,
    onSelectTeam: vi.fn(),
    telemetry: mockTelemetry,
    simSpeed: 1,
    isPaused: false,
    onSetSimSpeed: vi.fn(),
    onTogglePause: vi.fn(),
    onForceEvent: vi.fn(),
    onOpenVoiceAssistant: vi.fn(),
    onOpenCustomizer: vi.fn(),
    onOpenRegistration: vi.fn(),
  };

  it('не рендерит плавающий лаунчер когда панель закрыта', () => {
    render(<RightSidebar {...baseProps} isOpen={false} />);

    const launcherBtn = screen.queryByRole('button', {
      name: /Развернуть боковую панель ЦУП и навигации/i,
    });
    expect(launcherBtn).not.toBeInTheDocument();
  });

  it('отображает раскрытую панель, заголовок ЦУП и показатели телеметрии в табе HUD', () => {
    render(<RightSidebar {...baseProps} isOpen={true} />);

    expect(screen.getByText(/Телеметрический поток/i)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${mockTelemetry.altitudeKm.toFixed(1)} км`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${mockTelemetry.velocityKms.toFixed(2)} км/с`)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${mockTelemetry.batterySocPercent.toFixed(1)}%`)),
    ).toBeInTheDocument();
  });

  it('позволяет переключаться между табами: HUD, Разделы, Экипаж, Опции', () => {
    const onTabChange = vi.fn();
    render(<RightSidebar {...baseProps} isOpen={true} onTabChange={onTabChange} />);

    // Switch to 'Разделы'
    const navBtn = screen.getByRole('button', { name: /Разделы/i });
    fireEvent.click(navBtn);
    expect(screen.getByText(/Каталог разделов чемпионата/i)).toBeInTheDocument();
    expect(screen.getByText(/Подача решений/i)).toBeInTheDocument();

    // Click section item
    fireEvent.click(screen.getByText(/Подача решений/i));
    expect(onTabChange).toHaveBeenCalledWith('submissions');

    // Switch to 'Профиль / Экипаж'
    const crewBtn = screen.getByRole('button', { name: /Профиль|Экипаж/i });
    fireEvent.click(crewBtn);
    expect(screen.getByText(/Активная команда/i)).toBeInTheDocument();
    expect(screen.getByText(/Состав экипажа/i)).toBeInTheDocument();

    // Switch to 'Опции'
    const toolsBtn = screen.getByRole('button', { name: /Опции/i });
    fireEvent.click(toolsBtn);
    expect(screen.getByText(/Голос ЦУП \(Маскот «Кубик»\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Кастомизация дашборда/i)).toBeInTheDocument();
    expect(screen.getByText(/Инженерные спецификации/i)).toBeInTheDocument();
  });

  it('вызывает функции управления симулятором (пауза, скорость, событие)', () => {
    const onTogglePause = vi.fn();
    const onSetSimSpeed = vi.fn();
    const onForceEvent = vi.fn();

    render(
      <RightSidebar
        {...baseProps}
        isOpen={true}
        onTogglePause={onTogglePause}
        onSetSimSpeed={onSetSimSpeed}
        onForceEvent={onForceEvent}
      />,
    );

    // Pause toggle
    const pauseBtn = screen.getByRole('button', { name: /Пауза/i });
    fireEvent.click(pauseBtn);
    expect(onTogglePause).toHaveBeenCalledTimes(1);

    // Speed 5x
    const speed5xBtn = screen.getByRole('button', { name: /5x/i });
    fireEvent.click(speed5xBtn);
    expect(onSetSimSpeed).toHaveBeenCalledWith(5);

    // Event
    const eventBtn = screen.getByRole('button', { name: /Событие/i });
    fireEvent.click(eventBtn);
    expect(onForceEvent).toHaveBeenCalledTimes(1);
  });

  it('отображает разделы сгруппированными по 4 функциональным категориям', () => {
    render(<RightSidebar {...baseProps} isOpen={true} userRole="participant" />);

    // Switch to 'Разделы'
    const navBtn = screen.getByRole('button', { name: /Разделы/i });
    fireEvent.click(navBtn);

    // Verify 4 functional categories
    expect(screen.getByText(/ЦУП и Орбитальная группировка/i)).toBeInTheDocument();
    expect(screen.getByText(/Кейс-чемпионат и Управление/i)).toBeInTheDocument();
    expect(screen.getByText(/Знания, Наставничество и Сообщество/i)).toBeInTheDocument();
    expect(screen.getByText(/Инструменты, Аналитика и Отчеты/i)).toBeInTheDocument();

    // Verify role mapping badge and section item
    expect(screen.getAllByText(/Доступно роли/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Телеметрия CubeSat AX.25/i)).toBeInTheDocument();
  });

  it('отображает и применяет настройки бегущей строки и анонса открытия во вкладке Пульт', () => {
    const onUpdateEventStage = vi.fn();
    render(
      <RightSidebar
        {...baseProps}
        isOpen={true}
        eventStageState={{
          currentStage: 'start_ships',
          presentingTeamId: 'team-perm-01',
          activeSlideIndex: 0,
          orbitSpeed: 1,
          orbitViewMode: 'global',
          focusedSubsystem: 'EPS',
          timer: { totalSeconds: 300, remainingSeconds: 300, isRunning: false, mode: 'pitch' },
          announcement: 'Начальный анонс',
          tickerText: 'Бегущая строка',
          updatedAt: Date.now(),
          updatedBy: 'Тест',
        }}
        onUpdateEventStage={onUpdateEventStage}
      />,
    );

    expect(screen.getByText(/Бегущая строка и анонс открытия/i)).toBeInTheDocument();
    const textarea = screen.getByLabelText(/Текст приветствия на экране:/i);
    fireEvent.change(textarea, { target: { value: 'Новый анонс ЦУП' } });
    fireEvent.click(screen.getByRole('button', { name: /Применить текст к экрану/i }));

    expect(onUpdateEventStage).toHaveBeenCalledWith({ announcement: 'Новый анонс ЦУП' });
  });
});

