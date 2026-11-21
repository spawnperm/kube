import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TeamMobileAuthQrModal } from './TeamMobileAuthQrModal';
import { INITIAL_TEAMS } from '../data/mockData';
import { getInitialConnectedDevices } from '../domain/mobileAuth';

describe('TeamMobileAuthQrModal', () => {
  const mockTeam = INITIAL_TEAMS[0];
  const mockDevices = getInitialConnectedDevices(mockTeam);

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <TeamMobileAuthQrModal
        isOpen={false}
        onClose={vi.fn()}
        team={mockTeam}
        connectedDevices={mockDevices}
        onAddDevice={vi.fn()}
        onRemoveDevice={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header, team name, and QR section when isOpen is true', () => {
    render(
      <TeamMobileAuthQrModal
        isOpen={true}
        onClose={vi.fn()}
        team={mockTeam}
        connectedDevices={mockDevices}
        onAddDevice={vi.fn()}
        onRemoveDevice={vi.fn()}
      />,
    );

    expect(screen.getByText('Мобильная авторизация команды')).toBeDefined();
    expect(screen.getByText(new RegExp(mockTeam.name))).toBeDefined();
    expect(screen.getByText('QR-код подключения')).toBeDefined();
    expect(screen.getByText(/Резервный код ручного ввода/i)).toBeDefined();
  });

  it('switches to devices tab and renders connected devices', () => {
    const onRemove = vi.fn();
    render(
      <TeamMobileAuthQrModal
        isOpen={true}
        onClose={vi.fn()}
        team={mockTeam}
        connectedDevices={mockDevices}
        onAddDevice={vi.fn()}
        onRemoveDevice={onRemove}
      />,
    );

    const devicesTabBtn = screen.getByText(new RegExp(`Подключенные устройства`));
    fireEvent.click(devicesTabBtn);

    expect(screen.getByText('Синхронизированные устройства экипажа')).toBeDefined();
    expect(screen.getByText(mockDevices[0].deviceName)).toBeDefined();

    const deleteBtns = screen.getAllByTitle('Отозвать авторизацию устройства');
    expect(deleteBtns.length).toBeGreaterThan(0);
    fireEvent.click(deleteBtns[0]);
    expect(onRemove).toHaveBeenCalledWith(mockDevices[0].id);
  });

  it('switches to guide tab and displays mobile features', () => {
    render(
      <TeamMobileAuthQrModal
        isOpen={true}
        onClose={vi.fn()}
        team={mockTeam}
        connectedDevices={mockDevices}
        onAddDevice={vi.fn()}
        onRemoveDevice={vi.fn()}
      />,
    );

    const guideTabBtn = screen.getByText('Возможности приложения');
    fireEvent.click(guideTabBtn);

    expect(screen.getByText(/Возможности мобильного клиента/i)).toBeDefined();
    expect(screen.getByText(/Push-оповещения/i)).toBeDefined();
    expect(screen.getByText(/Прямой радиомаяк/i)).toBeDefined();
  });

  it('simulates mobile scan and calls onAddDevice', async () => {
    vi.useFakeTimers();
    const onAdd = vi.fn();

    render(
      <TeamMobileAuthQrModal
        isOpen={true}
        onClose={vi.fn()}
        team={mockTeam}
        connectedDevices={mockDevices}
        onAddDevice={onAdd}
        onRemoveDevice={vi.fn()}
      />,
    );

    const simulateBtn = screen.getByText('Имитировать сканирование со смартфона');
    fireEvent.click(simulateBtn);

    vi.advanceTimersByTime(1500);

    expect(onAdd).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <TeamMobileAuthQrModal
        isOpen={true}
        onClose={onClose}
        team={mockTeam}
        connectedDevices={mockDevices}
        onAddDevice={vi.fn()}
        onRemoveDevice={vi.fn()}
      />,
    );

    const closeBtn = screen.getByLabelText('Закрыть окно');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
