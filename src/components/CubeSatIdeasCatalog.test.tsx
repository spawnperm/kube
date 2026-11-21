import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CubeSatIdeasCatalog } from './CubeSatIdeasCatalog';
import { CUBESAT_IDEAS_CATALOG, CREW_ROLES } from '../data/cubesatMissionIdeas';

describe('CUBESAT_IDEAS_CATALOG dataset', () => {
  it('contains exactly 340 curated, realizable mission ideas with ratings between 3 and 5 stars', () => {
    expect(CUBESAT_IDEAS_CATALOG.length).toBe(340);
    // Проверяем, что в каталоге только карточки с рейтингом 3 звезды и выше (3, 4 и 5 звезд)
    expect(CUBESAT_IDEAS_CATALOG.every((item) => item.rating >= 3 && item.rating <= 5)).toBe(true);
    expect(CUBESAT_IDEAS_CATALOG.some((item) => item.rating === 3)).toBe(true);
    expect(CUBESAT_IDEAS_CATALOG.some((item) => item.rating === 4)).toBe(true);
    expect(CUBESAT_IDEAS_CATALOG.some((item) => item.rating === 5)).toBe(true);

    const uniqueIds = new Set(CUBESAT_IDEAS_CATALOG.map((item) => item.id));
    expect(uniqueIds.size).toBe(340);

    const uniqueTitles = new Set(CUBESAT_IDEAS_CATALOG.map((item) => item.title));
    expect(uniqueTitles.size).toBe(340);
  });

  it('each idea has title, description, payload, orbit, category, scope, roles, rating and creativityHighlight', () => {
    CUBESAT_IDEAS_CATALOG.forEach((idea) => {
      expect(idea.title).toBeTruthy();
      expect(idea.description).toBeTruthy();
      expect(idea.payload).toBeTruthy();
      expect(idea.orbit).toBeTruthy();
      expect(idea.rating).toBeGreaterThanOrEqual(3);
      expect(idea.creativityHighlight).toBeTruthy();
      expect(idea.roles.length).toBeGreaterThan(0);
      expect(idea.roles.every((role) => CREW_ROLES.includes(role as any))).toBe(true);
    });
  });

  it('includes specialized roles (Историк, Архивариус, Переводчик, Картограф, Журналист, Астрофизик, Военный)', () => {
    const allRoles = new Set(CUBESAT_IDEAS_CATALOG.flatMap((item) => item.roles));
    expect(allRoles.has('Астрофизик')).toBe(true);
    expect(allRoles.has('Военный')).toBe(true);
    expect(allRoles.has('Картограф')).toBe(true);
    expect(allRoles.has('Историк')).toBe(true);
    expect(allRoles.has('Архивариус')).toBe(true);
    expect(allRoles.has('Переводчик')).toBe(true);
    expect(allRoles.has('Журналист')).toBe(true);
    // Филолог заменен
    expect(allRoles.has('Филолог')).toBe(false);
  });
});

describe('CubeSatIdeasCatalog component', () => {
  it('automatically filters cards by team member roles and displays crew competencies', () => {
    const handleSelectIdea = vi.fn();
    const members = [
      { id: '1', name: 'Сергей', role: 'Капитан', grade: '11' },
      { id: '2', name: 'Анна', role: 'Биолог', grade: '10' },
      { id: '3', name: 'Максим', role: 'Историк', grade: '11' },
    ];
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} teamMembers={members} />);

    // Проверяем отображение компетенций экипажа
    expect(screen.getByText('Компетенции экипажа корабля')).toBeDefined();
    expect(screen.getAllByText('Биолог').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Историк').length).toBeGreaterThan(0);
    expect(screen.getByText(/Фильтр по экипажу активен/)).toBeDefined();

    // Проверяем, что дублирующих слотов для школьников нет
    expect(screen.queryByText('Школьник #1')).toBeNull();
    expect(screen.queryByText('Школьник #2')).toBeNull();
  });

  it('filters ideas by search query', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    const searchInput = screen.getByPlaceholderText(/Поиск идей/);
    fireEvent.change(searchInput, { target: { value: 'метана' } });

    // Должно найти карточки с метаном
    const cards = screen.getAllByRole('button');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('calls onSelectIdea when clicking a card', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    // Кликаем по первой карточке миссии
    const firstIdea = CUBESAT_IDEAS_CATALOG[0];
    const cardTitles = screen.getAllByText(firstIdea.title);
    expect(cardTitles.length).toBeGreaterThan(0);
    fireEvent.click(cardTitles[0]);

    expect(handleSelectIdea).toHaveBeenCalledWith(
      expect.objectContaining({
        id: firstIdea.id,
        title: firstIdea.title,
      }),
    );
  });

  it('renders purely visual star icons without numeric ratings and without the word Новизна in highlight block', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    // Проверяем отсутствие слова "Новизна"
    expect(screen.queryByText(/^Новизна/i)).toBeNull();
    expect(screen.queryByText(/Новизна:/i)).toBeNull();

    // Проверяем отсутствие числовых рейтингов на карточках (3.0, 4.0, 5.0)
    expect(screen.queryByText('3.0')).toBeNull();
    expect(screen.queryByText('4.0')).toBeNull();
    expect(screen.queryByText('5.0')).toBeNull();
  });

  it('filters ideas by interactive visual role filter buttons', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    // Проверяем наличие визуального блока фильтрации по ролям
    expect(screen.getByText(/Фильтр по ролям участников миссии/i)).toBeDefined();

    // Кликаем по фильтру роли 'Астрофизик'
    const astrophysicistButtons = screen.getAllByRole('button', { name: /Астрофизик/i });
    expect(astrophysicistButtons.length).toBeGreaterThan(0);
    fireEvent.click(astrophysicistButtons[0]);

    // Проверяем, что отображается бейдж активной роли
    expect(screen.getAllByText(/Астрофизик/i).length).toBeGreaterThan(0);
  });

  it('does NOT include rating in filter controls', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    // Проверяем, что выпадающего списка или элементов выбора рейтинга в фильтрах нет
    expect(screen.queryByText(/Все рейтинги/i)).toBeNull();
  });

  it('filters cards in dependence on already selected roles for team members', () => {
    const handleSelectIdea = vi.fn();
    const members = [
      { id: '1', name: 'Сергей', role: 'Капитан', grade: '11' },
      { id: '2', name: 'Иван', role: 'Астрофизик', grade: '10' },
    ];
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} teamMembers={members} />);

    // Карточки должны быть отфильтрованы по роли Астрофизик
    expect(screen.getByText(/Фильтр по экипажу активен/i)).toBeDefined();
    expect(screen.getAllByText(/Астрофизик/i).length).toBeGreaterThan(0);
  });

  it('marks idea cards with category value instead of scope field', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    // Проверяем, что на карточках отображаются категории
    const categoryBadges = screen.getAllByTitle(/Категория:/i);
    expect(categoryBadges.length).toBeGreaterThan(0);
    // Проверяем, что первая карточка имеет бейдж категории
    const firstIdea = CUBESAT_IDEAS_CATALOG[0];
    expect(screen.getAllByText(firstIdea.category).length).toBeGreaterThan(0);
  });

  it('allows team to open custom idea modal and add their own idea', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    const addBtn = screen.getByText(/\+ Внести свою идею/i);
    fireEvent.click(addBtn);

    // Модальное окно должно открыться
    expect(screen.getByText(/Внести свою идею CubeSat/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Например: Двухспектральный мониторинг/i)).toBeDefined();

    // Заполняем форму
    const titleInput = screen.getByPlaceholderText(/Например: Двухспектральный мониторинг/i);
    fireEvent.change(titleInput, {
      target: { value: 'Авторский наноспутник исследования термосферы' },
    });

    const highlightInput = screen.getByPlaceholderText(
      /Бортовая нейросеть для фильтрации облачности/i,
    );
    fireEvent.change(highlightInput, {
      target: { value: 'Инновационная оптика с адаптивным зумом' },
    });

    const descInput = screen.getByPlaceholderText(/Опишите подробно, какую физическую/i);
    fireEvent.change(descInput, {
      target: {
        value:
          'Детальное исследование параметров свободномолекулярного обтекания на высотах 500 км',
      },
    });

    const payloadInput = screen.getByPlaceholderText(/Спектрометр VIS\/NIR/i);
    fireEvent.change(payloadInput, { target: { value: 'Спектрофотометр термосферы 3U' } });

    // Отправляем форму
    const submitBtn = screen.getByText(/Добавить идею в банк решений/i);
    fireEvent.click(submitBtn);

    // Проверяем, что handleSelectIdea был вызван с новой идеей
    expect(handleSelectIdea).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Авторский наноспутник исследования термосферы',
        isCustom: true,
      }),
    );
  });

  it('opens printable cards dialog with crop marks and print options', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    const printBtn = screen.getByText(/Карточки для печати \(с полями реза\)/i);
    fireEvent.click(printBtn);

    // Проверяем открытие модального окна печати
    expect(screen.getByText(/Печать и экспорт карточек для выдачи командам/i)).toBeDefined();
    expect(screen.getAllByText(/С полями реза/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Метки и пунктир реза/i)).toBeDefined();
    expect(screen.getByText(/Скачать HTML для печати/i)).toBeDefined();
    expect(screen.getByText(/Распечатать \/ PDF/i)).toBeDefined();
  });

  it('displays full category names without abbreviation and renders rating stars', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    // Проверяем, что отображаются полные названия категорий
    const categoryBadges = screen.getAllByTitle(/Категория:/i);
    expect(categoryBadges.length).toBeGreaterThan(0);
    // Проверяем, что у бейджей категорий нет класса truncate
    categoryBadges.forEach((badge) => {
      expect(badge.className).not.toContain('truncate');
    });

    // Проверяем, что звезды рейтинга присутствуют на карточках
    const starContainers = screen.getAllByLabelText(/Рейтинг: \d из 5 звезд/i);
    expect(starContainers.length).toBeGreaterThan(0);
  });

  it('does NOT start descriptions with "Миссия аппарата CubeSat ориентирована на" and writes mission directly', () => {
    CUBESAT_IDEAS_CATALOG.forEach((idea) => {
      expect(idea.description).not.toMatch(/^Миссия аппарата CubeSat ориентирована на/i);
      expect(idea.description).not.toMatch(/^Миссия аппарата/i);
      // Описание должно начинаться сразу с сути миссии с заглавной буквы
      expect(idea.description.charAt(0)).toBe(idea.description.charAt(0).toUpperCase());
      expect(idea.description.length).toBeGreaterThan(30);
    });
  });

  it('renders mission description completely without line-clamp truncation on the card', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    const firstIdea = CUBESAT_IDEAS_CATALOG[0];
    const descElements = screen.getAllByText(firstIdea.description);
    expect(descElements.length).toBeGreaterThan(0);
    descElements.forEach((el) => {
      expect(el.className).not.toContain('line-clamp');
    });
  });

  it('verifies that all ideas in CUBESAT_IDEAS_CATALOG are scientifically sound and realizable', () => {
    CUBESAT_IDEAS_CATALOG.forEach((idea) => {
      // Исключены антинаучные и нереализуемые концепции
      expect(idea.title).not.toMatch(/темной материи|аксионо/i);
      expect(idea.description).not.toMatch(/темной материи|аксионоподобных/i);
      expect(idea.title).not.toMatch(/микрогравитационным аномалиям|подземных фортификационных/i);
      expect(idea.description).not.toMatch(/микрогравитационным аномалиям/i);
      expect(idea.payload).not.toMatch(
        /10 млн лет|5D лазерный|конфокальный биомикроскоп|криогенно/i,
      );
      expect(idea.creativityHighlight).not.toMatch(/10 млн лет|100 языках мира в открытый эфир/i);
    });
  });

  it('printable cards modal does not write "Ключевая особенность:" label and renders cleanly', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    const printBtn = screen.getByText(/Карточки для печати \(с полями реза\)/i);
    fireEvent.click(printBtn);

    // Проверяем, что модальное окно открыто
    expect(screen.getByText(/Печать и экспорт карточек для выдачи командам/i)).toBeDefined();

    // Проверяем, что метки "Ключевая особенность:" нет на карточках (только сама особенность для экономии места)
    expect(screen.queryByText(/Ключевая особенность:/i)).toBeNull();

    // Проверяем наличие кнопки прямого скачивания PDF
    expect(screen.getAllByText(/Скачать PDF/i).length).toBeGreaterThan(0);
    // Проверяем наличие опции минимального числа листов (9 на лист)
    expect(screen.getByText(/9 на лист/i)).toBeDefined();
  });

  it('guarantees sequential numbering 1 to 340 without gaps or duplicates', () => {
    expect(CUBESAT_IDEAS_CATALOG.length).toBe(340);
    CUBESAT_IDEAS_CATALOG.forEach((idea, index) => {
      const expectedNumber = index + 1;
      const expectedId = `cube-idea-${String(expectedNumber).padStart(4, '0')}`;
      expect(idea.number).toBe(expectedNumber);
      expect(idea.id).toBe(expectedId);
    });
  });

  it('renders direct PDF export link with 9perPage minimal sheet layout in catalog toolbar', () => {
    const handleSelectIdea = vi.fn();
    render(<CubeSatIdeasCatalog onSelectIdea={handleSelectIdea} />);

    const directPdfLink = screen.getByRole('link', {
      name: /Скачать PDF \(мин\. листов: 9\/лист\)/i,
    });
    expect(directPdfLink).toBeDefined();
    expect(directPdfLink.getAttribute('href')).toContain('/api/export/cards-pdf?layout=9perPage');
  });
});
