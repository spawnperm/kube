import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TeamParticipationCertificate } from './TeamParticipationCertificate';
import { INITIAL_TEAMS } from '../data/mockData';
import * as pdfExportModule from '../services/pdfExport';

vi.mock('../services/pdfExport', () => ({
  generateDigitalCertificatePdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('TeamParticipationCertificate: Генерация PDF-сертификата участия команды', () => {
  const mockTeam = INITIAL_TEAMS[0]; // «Орион-3U», rank 1, totalScore 276

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('отображает заголовок, бейдж финального рейтинга и данные текущей команды', () => {
    render(<TeamParticipationCertificate team={mockTeam} />);

    expect(screen.getByText(/Официальный PDF-сертификат участия команды/i)).toBeInTheDocument();

    // Финальный рейтинг (1 место для Ориона)
    expect(screen.getByText(/Победитель \(1 место\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(`#${mockTeam.rank} в Лиге`, 'i')).length).toBeGreaterThan(
      0,
    );

    // Название команды в предпросмотре
    expect(
      screen.getAllByText(new RegExp(`КОМАНДА «${mockTeam.name.toUpperCase()}»`, 'i')).length,
    ).toBeGreaterThan(0);

    // Школа и город
    expect(screen.getAllByText(new RegExp(`${mockTeam.school}`, 'i')).length).toBeGreaterThan(0);
  });

  it('позволяет переключать формат сертификата между командным и именным', () => {
    render(<TeamParticipationCertificate team={mockTeam} />);

    const memberBtn = screen.getByRole('button', { name: /Именной/i });
    fireEvent.click(memberBtn);

    // Должен появиться селект выбора члена экипажа
    expect(screen.getByLabelText(/Член экипажа для диплома:/i)).toBeInTheDocument();

    const teamBtn = screen.getByRole('button', { name: /Командный/i });
    fireEvent.click(teamBtn);

    // Возврат к командному формату
    expect(screen.queryByLabelText(/Член экипажа для диплома:/i)).not.toBeInTheDocument();
  });

  it('позволяет переключать визуальные стили оформления (Золото, Сапфир, Космос)', () => {
    render(<TeamParticipationCertificate team={mockTeam} />);

    const sapphireBtn = screen.getByRole('button', { name: /Сапфир/i });
    const cyberBtn = screen.getByRole('button', { name: /Космос/i });
    const goldBtn = screen.getByRole('button', { name: /Золото/i });

    fireEvent.click(sapphireBtn);
    expect(sapphireBtn).toHaveClass('border-sky-400');

    fireEvent.click(cyberBtn);
    expect(cyberBtn).toHaveClass('border-cyan-400');

    fireEvent.click(goldBtn);
    expect(goldBtn).toHaveClass('border-amber-400');
  });

  it('вызывает функцию генерации PDF-сертификата при клике на кнопку скачивания', async () => {
    render(<TeamParticipationCertificate team={mockTeam} />);

    const downloadBtn = screen.getByRole('button', { name: /Скачать PDF-сертификат/i });
    fireEvent.click(downloadBtn);

    await waitFor(
      () => {
        expect(pdfExportModule.generateDigitalCertificatePdf).toHaveBeenCalledWith(
          mockTeam,
          expect.objectContaining({
            recipientType: 'team',
            style: 'gold',
          }),
        );
      },
      { timeout: 2000 },
    );
  });

  it('копирует ссылку верификации в буфер обмена', async () => {
    render(<TeamParticipationCertificate team={mockTeam} />);

    const copyBtn = screen.getByRole('button', { name: /Скопировать ссылку проверки/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(`CERT-${mockTeam.id.toUpperCase()}-RANK${mockTeam.rank}`),
    );

    await waitFor(() => {
      expect(screen.getByText(/Ссылка скопирована/i)).toBeInTheDocument();
    });
  });
});
