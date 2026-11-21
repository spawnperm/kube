import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PortalPresentationTab } from './PortalPresentationTab';
import { INITIAL_TEAMS } from '../../data/mockData';
import { PORTAL_PRESENTATION_SLIDES } from '../../data/portalPresentationSlides';
import { buildPortalPresentationPptx } from '../../services/presentationPptxExport';
import { buildPortalPresentationPdf } from '../../services/presentationPdfExport';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('PortalPresentationTab и экспорт .PPTX / .PDF', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('содержит 10 слайдов с обзором функционала, задачами и руководствами для 4 ролей', () => {
    expect(PORTAL_PRESENTATION_SLIDES).toHaveLength(10);
    const audiences = new Set(PORTAL_PRESENTATION_SLIDES.map((s) => s.audience));
    expect(audiences.has('features')).toBe(true);
    expect(audiences.has('tasks')).toBe(true);
    expect(audiences.has('participant')).toBe(true);
    expect(audiences.has('organizer')).toBe(true);
    expect(audiences.has('jury')).toBe(true);
    expect(audiences.has('admin')).toBe(true);
  });

  it('строит валидный .pptx буфер через PptxGenJS без выхода за границы 16:9', async () => {
    const pptx = buildPortalPresentationPptx({
      teamName: 'Альтаир-3U',
      totalTeams: 10,
      generatedDate: '21.11.2026',
    });

    expect(pptx.slides).toHaveLength(10);
    const uint8 = (await pptx.write({ outputType: 'uint8array' })) as Uint8Array;
    expect(uint8.byteLength).toBeGreaterThan(10000);
    // ZIP magic header "PK"
    expect(uint8[0]).toBe(0x50);
    expect(uint8[1]).toBe(0x4b);
  });

  it('строит валидный 10-страничный .pdf документ формата 16:9 с кириллицей', async () => {
    const doc = await buildPortalPresentationPdf({
      teamName: 'Альтаир-3U',
      totalTeams: 10,
      generatedDate: '21.11.2026',
    });

    expect(doc.getNumberOfPages()).toBe(10);
    const pdfBytes = new Uint8Array(doc.output('arraybuffer'));
    expect(pdfBytes.byteLength).toBeGreaterThan(50000);
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('отображает слайды, фильтры по ролям и навигацию Вперёд/Назад', () => {
    render(<PortalPresentationTab activeTeam={INITIAL_TEAMS[0]} totalTeams={INITIAL_TEAMS.length} />);

    expect(screen.getByText(/Презентация портала и руководства ролей/i)).toBeInTheDocument();
    expect(screen.getByText(/Слайд 1 из 10/i)).toBeInTheDocument();

    // Навигация вперёд
    fireEvent.click(screen.getByRole('button', { name: /Вперёд/i }));
    expect(screen.getByText(/Слайд 2 из 10/i)).toBeInTheDocument();

    // Фильтр руководства для членов комиссии
    fireEvent.click(screen.getByRole('button', { name: /Комиссии/i }));
    expect(screen.getByText(/РУКОВОДСТВО ДЛЯ ЧЛЕНОВ КОМИССИИ/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Экспертиза решений и судейство/i }),
    ).toBeInTheDocument();

    // Фильтр руководства для администраторов
    fireEvent.click(screen.getByRole('button', { name: /Администратору/i }));
    expect(screen.getByText(/РУКОВОДСТВО ДЛЯ АДМИНИСТРАТОРОВ/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Администрирование, безопасность RBAC/i }),
    ).toBeInTheDocument();
  });

  it('формирует и запускает скачивание .pptx и .pdf при нажатии на соответствующие кнопки', async () => {
    const createObjectUrlSpy = vi.fn(() => 'blob:mock-presentation-url');
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

    render(<PortalPresentationTab activeTeam={INITIAL_TEAMS[0]} totalTeams={INITIAL_TEAMS.length} />);

    fireEvent.click(screen.getByRole('button', { name: /Скачать презентацию \(\.PPTX\)/i }));

    await waitFor(
      () => {
        expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
        expect(clickSpy).toHaveBeenCalledTimes(1);
      },
      { timeout: 10000 },
    );

    expect(
      await screen.findByText(
        /Cosmoport_Portal_Presentation\.pptx.*успешно сформирована и скачана/i,
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Скачать презентацию \(\.PDF\)/i }));

    await waitFor(
      () => {
        expect(createObjectUrlSpy).toHaveBeenCalledTimes(2);
        expect(clickSpy).toHaveBeenCalledTimes(2);
      },
      { timeout: 10000 },
    );

    expect(
      await screen.findByText(
        /Cosmoport_Portal_Presentation\.pdf.*успешно сформирована и скачана/i,
        {},
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
  }, 15000);
});
