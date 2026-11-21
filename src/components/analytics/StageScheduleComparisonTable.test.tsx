import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StageScheduleComparisonTable } from './StageScheduleComparisonTable';
import { INITIAL_TEAMS } from '../../data/mockData';

describe('StageScheduleComparisonTable: Интерактивная таблица сравнения с рекомендованным графиком', () => {
  const team = INITIAL_TEAMS[0]; // Orion-3
  const allTeams = INITIAL_TEAMS;
  const onNavigateTab = vi.fn();

  it('рендерит заголовок компонента, сводку SPI и таблицу всех 5 этапов', () => {
    render(
      <StageScheduleComparisonTable
        team={team}
        allTeams={allTeams}
        onNavigateTab={onNavigateTab}
      />,
    );

    expect(
      screen.getByText('СРАВНЕНИЕ ТЕКУЩЕГО ПРОГРЕССА С РЕКОМЕНДОВАННЫМ ГРАФИКОМ'),
    ).toBeInTheDocument();
    expect(screen.getByText('SCHEDULE BENCHMARK & VELOCITY')).toBeInTheDocument();
    expect(screen.getByText(/Индекс темпа \(SPI\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Орбитальная баллистика и параметры выведения/i)).toBeInTheDocument();
    expect(screen.getByText(/Архитектура КубСат 3U и энергобаланс/i)).toBeInTheDocument();
  });

  it('отображает плановые нормативы дедлайнов и фактический прогресс команды', () => {
    render(
      <StageScheduleComparisonTable
        team={team}
        allTeams={allTeams}
        onNavigateTab={onNavigateTab}
      />,
    );

    expect(screen.getByText(/10 мая 2026/)).toBeInTheDocument();
    expect(screen.getByText(/24 мая 2026/)).toBeInTheDocument();
    expect(screen.getAllByText(/Сдано в срок \(100%\)/i).length).toBeGreaterThan(0);
  });

  it('поддерживает переключение команды для сравнительного анализа', () => {
    render(
      <StageScheduleComparisonTable
        team={team}
        allTeams={allTeams}
        onNavigateTab={onNavigateTab}
      />,
    );

    const teamSelect = screen.getAllByRole('combobox')[0];
    // First select is team switcher
    expect(teamSelect).toBeInTheDocument();
    fireEvent.change(teamSelect, { target: { value: allTeams[1].id } });
    expect(screen.getAllByText(new RegExp(allTeams[1].name, 'i')).length).toBeGreaterThan(0);
  });

  it('позволяет фильтровать этапы по статусу выполнения', () => {
    render(
      <StageScheduleComparisonTable
        team={team}
        allTeams={allTeams}
        onNavigateTab={onNavigateTab}
      />,
    );

    const filterSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(filterSelect, { target: { value: 'completed' } });
    // Completed stages for Orion-3 are stage 1 and stage 2
    expect(screen.getByText(/Орбитальная баллистика/i)).toBeInTheDocument();
    expect(screen.getByText(/Архитектура КубСат 3U/i)).toBeInTheDocument();
  });

  it('поддерживает экспорт данных таблицы в CSV', () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;

    render(
      <StageScheduleComparisonTable
        team={team}
        allTeams={allTeams}
        onNavigateTab={onNavigateTab}
      />,
    );

    const csvBtn = screen.getByRole('button', { name: /CSV/i });
    fireEvent.click(csvBtn);
    expect(createObjectURL).toHaveBeenCalled();
  });

  it('вызывает onNavigateTab при клике на переход к этапу', () => {
    render(
      <StageScheduleComparisonTable
        team={team}
        allTeams={allTeams}
        onNavigateTab={onNavigateTab}
      />,
    );

    const stageBtns = screen.getAllByRole('button', { name: /К этапу/i });
    fireEvent.click(stageBtns[0]);
    expect(onNavigateTab).toHaveBeenCalledWith('submissions');
  });
});
