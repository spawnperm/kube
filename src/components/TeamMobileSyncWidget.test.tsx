import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TeamMobileSyncWidget } from './TeamMobileSyncWidget';
import { INITIAL_TEAMS } from '../data/mockData';
import { getInitialConnectedDevices } from '../domain/mobileAuth';

describe('TeamMobileSyncWidget', () => {
  const mockTeam = INITIAL_TEAMS[0];
  const mockDevices = getInitialConnectedDevices(mockTeam);

  it('renders widget title, connection status and buttons', () => {
    const onOpen = vi.fn();
    render(
      <TeamMobileSyncWidget team={mockTeam} connectedDevices={mockDevices} onOpenModal={onOpen} />,
    );

    expect(screen.getByText('Синхронизация мобильного приложения команды')).toBeDefined();
    expect(screen.getByText(/устройств\(а\) на связи/i)).toBeDefined();
    expect(screen.getByText('Открыть QR-код')).toBeDefined();

    const openBtn = screen.getByText('Открыть QR-код');
    fireEvent.click(openBtn);
    expect(onOpen).toHaveBeenCalled();
  });

  it('opens modal when clicking on devices badge button', () => {
    const onOpen = vi.fn();
    render(
      <TeamMobileSyncWidget team={mockTeam} connectedDevices={mockDevices} onOpenModal={onOpen} />,
    );

    const devicesBtn = screen.getByText(new RegExp(`Устройства \\(${mockDevices.length}\\)`));
    fireEvent.click(devicesBtn);
    expect(onOpen).toHaveBeenCalled();
  });
});
