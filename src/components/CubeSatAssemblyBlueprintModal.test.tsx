import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CubeSatAssemblyBlueprintModal } from './CubeSatAssemblyBlueprintModal';

describe('CubeSatAssemblyBlueprintModal: 3D-схема сборочного чертежа внутреннего устройства КубСата', () => {
  const mockSpecs = {
    format: '3U' as const,
    payloadType: 'Спектрометр свечений ночной атмосферы',
    orbitAltitudeKm: 540,
    inclinationDeg: 97.4,
    powerBudgetWatts: 22.0,
    radioFreqMhz: 437.5,
    massKg: 3.2,
  };

  const renderModal = (onClose = vi.fn()) =>
    render(
      <CubeSatAssemblyBlueprintModal
        isOpen={true}
        onClose={onClose}
        specs={mockSpecs}
        teamName="Космос-Пермь"
      />,
    );

  it('не рендерит модальное окно когда isOpen = false', () => {
    const { container } = render(
      <CubeSatAssemblyBlueprintModal
        isOpen={false}
        onClose={vi.fn()}
        specs={mockSpecs}
        teamName="Космос-Пермь"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('рендерит заголовок, команду и 2D CAD чертёж выбранного формата', () => {
    renderModal();

    expect(
      screen.getByRole('heading', { name: /3D-Схема и сборочный чертеж КубСата 3U/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Космос-Пермь/)).toBeInTheDocument();
    expect(screen.getByText(/Запас массы:/)).toBeInTheDocument();

    // Переключаемся на вкладку 2D CAD и проверяем изображение чертежа
    fireEvent.click(screen.getByRole('button', { name: /2D CAD Чертеж ИИ/ }));

    const blueprintImg = screen.getByAltText('Сборочный чертеж КубСата 3U');
    expect(blueprintImg).toBeInTheDocument();
    expect(blueprintImg.getAttribute('src')).toMatch(/cubesat_3u_blueprint/);
    expect(blueprintImg).toHaveAttribute('referrerPolicy', 'no-referrer');
  });

  it('позволяет переключаться между подсистемами спутника и отображает инженерные рекомендации', () => {
    renderModal();

    // Переходим на вкладку спецификации модулей
    fireEvent.click(screen.getByRole('button', { name: /Спецификация модулей/ }));

    // По умолчанию выбран отсек полезной нагрузки
    expect(
      screen.getByText(/Целевой модуль: Спектрометр свечений ночной атмосферы/),
    ).toBeInTheDocument();

    // EPS
    fireEvent.click(screen.getByRole('button', { name: /Система электропитания/ }));
    expect(screen.getByText(/4S2P LiFePO4/)).toBeInTheDocument();
    expect(screen.getByText(/Литий-железо-фосфат обеспечивает работу/)).toBeInTheDocument();

    // ADCS
    fireEvent.click(screen.getByRole('button', { name: /Система ориентации и стабилизации/ }));
    expect(screen.getByText(/блок маховиков \+ магнеторкеры/)).toBeInTheDocument();
    expect(screen.getByText(/Алгоритм B-Dot активируется через 15 минут/)).toBeInTheDocument();

    // OBC
    fireEvent.click(screen.getByRole('button', { name: /Бортовой комплекс управления/ }));
    expect(
      screen.getByText(/Центральная плата PC\/104 со спаренным MCU STM32H7/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Шина CAN 2.0B обеспечивает помехозащищенную связь/),
    ).toBeInTheDocument();
  });

  it('вызывает onClose при клике на кнопку закрытия и нижнюю кнопку', () => {
    const handleClose = vi.fn();
    renderModal(handleClose);

    fireEvent.click(screen.getByTitle('Закрыть'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Закрыть схему/ }));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
