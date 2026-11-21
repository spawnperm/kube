import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpacePiTab } from './SpacePiTab';
import { INITIAL_TEAMS, INITIAL_SUBMISSIONS } from '../../data/mockData';
import { buildSpacePiSampleApplicationPdf } from '../../services/spacePiPdfExport';

describe('SpacePiTab и пример заявки в Space-π (.PDF)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('строит валидный пример заявки в Space-π в формате PDF с кириллицей', async () => {
    const doc = await buildSpacePiSampleApplicationPdf();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    const bytes = new Uint8Array(doc.output('arraybuffer'));
    expect(bytes.byteLength).toBeGreaterThan(20000);
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
  });

  it('отображает кнопку скачивания примера заявки в Space-π и запускает загрузку PDF', async () => {
    const createObjectUrlSpy = vi.fn(() => 'blob:mock-spacepi-sample-pdf');
    const revokeObjectUrlSpy = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      value: createObjectUrlSpy,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: revokeObjectUrlSpy,
      writable: true,
      configurable: true,
    });

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    render(
      <SpacePiTab
        team={INITIAL_TEAMS[0]}
        allTeams={INITIAL_TEAMS}
        submissions={INITIAL_SUBMISSIONS}
        userRole="participant"
      />,
    );

    const sampleBtn = screen.getByRole('button', {
      name: /Скачать пример заявки Space-π \(PDF\)/i,
    });
    expect(sampleBtn).toBeInTheDocument();

    fireEvent.click(sampleBtn);

    await waitFor(
      () => {
        expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
        expect(clickSpy).toHaveBeenCalledTimes(1);
      },
      { timeout: 10000 },
    );

    expect(
      await screen.findByText(
        /SpacePi_Sample_Application\.pdf.*успешно сформирован и скачан/i,
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  }, 15000);
});
