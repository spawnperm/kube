import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { EducationTab } from './EducationTab';
import { INITIAL_EDUCATIONAL_MATERIALS } from '../../data/mockData';
import { EducationalMaterial } from '../../types';

describe('EducationTab: Образовательный контент и видеоматериалы', () => {
  beforeEach(() => {
    // Mock HTMLMediaElement methods in jsdom
    window.HTMLMediaElement.prototype.play = vi.fn().mockImplementation(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.load = vi.fn();

    // Mock URL.createObjectURL
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/sample-video');
    }
  });

  it('рендерит заголовок раздела, каталог материалов и поисковую строку', () => {
    render(
      <EducationTab
        materials={INITIAL_EDUCATIONAL_MATERIALS}
        userRole="participant"
        onAddMaterial={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Образовательный контент & Виртуальные 360° экскурсии/i),
    ).toBeInTheDocument();
    expect(screen.getByText('COSMO-ACADEMY')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Поиск по лекциям, темам и авторам/i)).toBeInTheDocument();
    expect(screen.getByText(/Добавить видеоматериал/i)).toBeInTheDocument();
  });

  it('отображает детальную информацию выбранного материала и список внешних ресурсов', () => {
    render(
      <EducationTab
        materials={INITIAL_EDUCATIONAL_MATERIALS}
        userRole="participant"
        onAddMaterial={vi.fn()}
      />,
    );

    const firstMat = INITIAL_EDUCATIONAL_MATERIALS[0];
    expect(screen.getAllByText(firstMat.title).length).toBeGreaterThan(0);
    expect(screen.getByText(firstMat.author)).toBeInTheDocument();

    // Verify external resources rendering
    expect(
      screen.getByText(/Методические материалы и ссылки на внешние ресурсы/i),
    ).toBeInTheDocument();
    firstMat.externalResources.forEach((res) => {
      expect(screen.getByText(res.title)).toBeInTheDocument();
    });
  });

  it('позволяет переключать категории и фильтровать список материалов', () => {
    render(
      <EducationTab
        materials={INITIAL_EDUCATIONAL_MATERIALS}
        userRole="participant"
        onAddMaterial={vi.fn()}
      />,
    );

    const lectureButton = screen.getAllByRole('button', { name: /Видеолекции ученых/i })[0];
    fireEvent.click(lectureButton);

    // Lectures should be visible
    expect(
      screen.getByText(/Баллистика малых космических аппаратов и расчет параметров ССО/i),
    ).toBeInTheDocument();
  });

  it('фильтрует материалы по поисковому запросу', () => {
    render(
      <EducationTab
        materials={INITIAL_EDUCATIONAL_MATERIALS}
        userRole="participant"
        onAddMaterial={vi.fn()}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Поиск по лекциям, темам и авторам/i);
    fireEvent.change(searchInput, { target: { value: 'AX.25' } });

    expect(
      screen.getByText(/Проектирование бортовых радиолиний КубСата 437 МГц/i),
    ).toBeInTheDocument();
  });

  it('управляет воспроизведением видео: Play/Pause и переключение скорости', () => {
    render(
      <EducationTab
        materials={INITIAL_EDUCATIONAL_MATERIALS}
        userRole="participant"
        onAddMaterial={vi.fn()}
      />,
    );

    // Switch to lecture mode to test video player
    const lectureButton = screen.getAllByRole('button', { name: /Видеолекции ученых/i })[0];
    fireEvent.click(lectureButton);

    const lectureCard = screen.getByText(
      /Баллистика малых космических аппаратов и расчет параметров ССО/i,
    );
    fireEvent.click(lectureCard);

    // Check play button
    const playBtn = screen.getByLabelText(/Воспроизвести видео/i);
    fireEvent.click(playBtn);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Check speed button
    const speedBtn = screen.getByText('1x');
    fireEvent.click(speedBtn);
    expect(screen.getByText('1.25x')).toBeInTheDocument();
  });

  it('позволяет переключаться между главами видео по таймкодам', () => {
    render(
      <EducationTab
        materials={INITIAL_EDUCATIONAL_MATERIALS}
        userRole="participant"
        onAddMaterial={vi.fn()}
      />,
    );

    // Select lecture
    const lectureCard = screen.getByText(
      /Баллистика малых космических аппаратов и расчет параметров ССО/i,
    );
    fireEvent.click(lectureCard);

    // Click on a chapter button
    const chapterBtn = screen.getByText(/Гармоника J2 и прецессия плоскости/i);
    expect(chapterBtn).toBeInTheDocument();
    fireEvent.click(chapterBtn);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('открывает модальное окно добавления материала и успешно создает новую запись с внешними ссылками', () => {
    const onAddMock = vi.fn();
    render(
      <EducationTab
        materials={INITIAL_EDUCATIONAL_MATERIALS}
        userRole="mentor"
        onAddMaterial={onAddMock}
      />,
    );

    const openModalBtn = screen.getByRole('button', { name: /Добавить видеоматериал/i });
    fireEvent.click(openModalBtn);

    expect(screen.getByText(/Добавить образовательный видеоматериал/i)).toBeInTheDocument();

    // Fill title
    const titleInput = screen.getByPlaceholderText(/например, Видеолекция: Расчет теплообмена/i);
    fireEvent.change(titleInput, {
      target: { value: 'Тест: Лабораторный практикум по расчету радиолинии 437 МГц' },
    });

    // Fill author
    const authorInput = screen.getByPlaceholderText(/ФИО ученого или инженера/i);
    fireEvent.change(authorInput, { target: { value: 'Инженер Космодрома Иванов' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Опубликовать материал/i });
    fireEvent.click(submitBtn);

    expect(onAddMock).toHaveBeenCalledTimes(1);
    const addedMat: EducationalMaterial = onAddMock.mock.calls[0][0];
    expect(addedMat.title).toBe('Тест: Лабораторный практикум по расчету радиолинии 437 МГц');
    expect(addedMat.author).toBe('Инженер Космодрома Иванов');
    expect(addedMat.externalResources.length).toBeGreaterThan(0);
  });

  it('поддерживает переключение между 360° интерактивной панорамой и видео-экскурсией', () => {
    render(
      <EducationTab
        materials={INITIAL_EDUCATIONAL_MATERIALS}
        userRole="participant"
        onAddMaterial={vi.fn()}
      />,
    );

    // First material is tour_360
    expect(screen.getByText(/360° Интерактивная панорама/i)).toBeInTheDocument();
    expect(screen.getByText(/Видео-экскурсия/i)).toBeInTheDocument();

    // Switch to video mode
    const videoModeBtn = screen.getByRole('button', { name: /Видео-экскурсия/i });
    fireEvent.click(videoModeBtn);

    // Switch back to 360 panorama mode
    const panoramaModeBtn = screen.getByRole('button', {
      name: /360° Интерактивная панорама/i,
    });
    fireEvent.click(panoramaModeBtn);
    expect(screen.getAllByText(/Стартовый комплекс 1С/i).length).toBeGreaterThan(0);
  });
});
