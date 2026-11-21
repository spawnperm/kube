import { Team, TeamMember, ChampionshipTrack, CubesatSpecs } from '../types';
import { createId } from '../utils/id';

export const CHAMPIONSHIP_TRACKS: ChampionshipTrack[] = [
  {
    id: 'track_ballistics',
    title: 'Орбитальная баллистика и маневрирование',
    shortTitle: 'Баллистика',
    category: 'Теоретическая механика и астродинамика',
    description:
      'Расчет солнечно-синхронных орбит (ССО), характеристической скорости ΔV, времени нахождения в тени Земли и срока службы аппарата с учетом торможения в термосфере.',
    icon: '🛰️',
    recommendedSpecs: 'Формат 1U/3U, высота 500–550 км, наклонение 97.4°',
  },
  {
    id: 'track_payload_remote_sensing',
    title: 'Полезная нагрузка и Дистанционное зондирование Земли (ДЗЗ)',
    shortTitle: 'ДЗЗ и полезная нагрузка',
    category: 'Оптика, спектроскопия и сенсорика',
    description:
      'Проектирование оптического фотометра верхней атмосферы, сенсора радиации или камеры ДЗЗ, расчет пространственного разрешения GSD и интерфейса передачи данных.',
    icon: '📸',
    recommendedSpecs: 'Формат 3U, оптический сенсор RGB/NIR, шина CAN/I2C',
  },
  {
    id: 'track_radio_telemetry',
    title: 'Бортовой радиокомплекс и космическая связь',
    shortTitle: 'Радиоканал и телеметрия',
    category: 'Радиофизика и телекоммуникации',
    description:
      'Разработка радиолинии диапазона 437 МГц (AX.25/GFSK), расчет энергетического потенциала радиолинии (Link Budget), развертываемых антенн и протоколов связи с ЦУП.',
    icon: '📡',
    recommendedSpecs: 'Частота 437.425 МГц, мощность 1 Вт, модуляция AX.25 GFSK',
  },
  {
    id: 'track_adcs_orientation',
    title: 'Системы ориентации и стабилизации (ADCS)',
    shortTitle: 'Ориентация ADCS',
    category: 'Теория автоматического управления',
    description:
      'Алгоритмы детамблинга (гашения начального углового вращения B-dot), магнитные катушки (магнеторокеры), маховики и наведение солнечных панелей на Солнце.',
    icon: '🧭',
    recommendedSpecs: 'Точность наведения ±2°, 3-осевые магнеторокеры, гироскопы MEMS',
  },
  {
    id: 'track_power_systems',
    title: 'Система энергоснабжения (EPS) и термобаланс',
    shortTitle: 'Энергосистема и термобаланс',
    category: 'Электротехника и космическая термодинамика',
    description:
      'Интегральный суточный расчет выработки арсенид-галлиевых солнечных батарей, буферных аккумуляторов LiFePO4, баланса тепла и глубины разряда в тени Земли.',
    icon: '⚡',
    recommendedSpecs: 'Мощность СБ ≥ 12 Вт, батарея 20 Вт·ч, DoD ≤ 25%',
  },
];

export interface TeamRegistrationFormData {
  teamName: string;
  trackId: string;
  school: string;
  city: string;
  league: 'Старшая лига (10-11 классы)' | 'Юниорская лига (8-9 классы)';
  mentorName: string;
  mentorTitle: string;
  format: '1U' | '2U' | '3U';
  orbitAltitudeKm: number;
  radioFreqMhz: number;
  payloadType: string;
  members: TeamMember[];
}

export interface RegistrationValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  memberErrors?: Record<number, Record<string, string>>;
}

/**
 * Валидация полей формы регистрации команды
 */
export function validateTeamRegistration(
  data: TeamRegistrationFormData,
): RegistrationValidationResult {
  const errors: Record<string, string> = {};
  const memberErrors: Record<number, Record<string, string>> = {};

  // 1. Валидация названия команды
  const trimmedName = data.teamName.trim();
  if (!trimmedName) {
    errors.teamName = 'Введите название команды';
  } else if (trimmedName.length < 3) {
    errors.teamName = 'Название команды должно содержать не менее 3 символов';
  } else if (trimmedName.length > 50) {
    errors.teamName = 'Название команды не должно превышать 50 символов';
  }

  // 2. Валидация выбора трека чемпионата
  if (!data.trackId || !data.trackId.trim()) {
    errors.trackId = 'Выберите трек кейс-чемпионата';
  } else {
    const trackExists = CHAMPIONSHIP_TRACKS.some((t) => t.id === data.trackId);
    if (!trackExists) {
      errors.trackId = 'Выбран неизвестный трек кейс-чемпионата';
    }
  }

  // 3. Валидация учебного заведения
  if (!data.school || !data.school.trim()) {
    errors.school = 'Укажите учебное заведение (школа, лицей, гимназия, кванториум)';
  } else if (data.school.trim().length < 3) {
    errors.school = 'Название учебного заведения должно содержать не менее 3 символов';
  }

  // 4. Валидация города
  if (!data.city || !data.city.trim()) {
    errors.city = 'Укажите город или населенный пункт';
  }

  // 5. Валидация списка участников
  if (!data.members || data.members.length === 0) {
    errors.members = 'В команде должен быть хотя бы один участник';
  } else {
    let hasCaptain = false;
    let anyMemberError = false;

    data.members.forEach((member, index) => {
      const currentMemberErrors: Record<string, string> = {};
      const trimmedMemberName = member.name.trim();

      if (!trimmedMemberName) {
        currentMemberErrors.name = 'Укажите ФИО участника';
        anyMemberError = true;
      } else if (trimmedMemberName.length < 3) {
        currentMemberErrors.name = 'ФИО должно содержать не менее 3 символов';
        anyMemberError = true;
      }

      if (member.role === 'Капитан') {
        hasCaptain = true;
      }

      if (member.email && member.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(member.email.trim())) {
          currentMemberErrors.email = 'Укажите корректный email';
          anyMemberError = true;
        }
      }

      if (Object.keys(currentMemberErrors).length > 0) {
        memberErrors[index] = currentMemberErrors;
      }
    });

    if (anyMemberError) {
      errors.members = 'Заполните обязательные поля для каждого участника';
    } else if (!hasCaptain) {
      errors.members = 'Один из участников должен быть назначен Капитаном команды';
    }
  }

  // 6. Валидация параметров CubeSat
  if (data.orbitAltitudeKm <= 0 || isNaN(data.orbitAltitudeKm)) {
    errors.orbitAltitudeKm = 'Укажите корректную высоту орбиты (обычно 400–600 км)';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    memberErrors: Object.keys(memberErrors).length > 0 ? memberErrors : undefined,
  };
}

/**
 * Создает полную модель команды из данных формы регистрации
 */
export function buildTeamFromFormData(data: TeamRegistrationFormData): Team {
  const selectedTrack = CHAMPIONSHIP_TRACKS.find((t) => t.id === data.trackId);
  const is3U = data.format === '3U';

  const specs: CubesatSpecs = {
    format: data.format,
    payloadType:
      data.payloadType.trim() ||
      (selectedTrack?.shortTitle
        ? `ПН: ${selectedTrack.shortTitle}`
        : 'Орбитальный сенсорный модуль'),
    orbitAltitudeKm: data.orbitAltitudeKm || 520,
    inclinationDeg: 97.4,
    powerBudgetWatts: is3U ? 15.0 : 4.5,
    radioFreqMhz: data.radioFreqMhz || 437.425,
    massKg: is3U ? 3.5 : 1.3,
  };

  const captain = data.members.find((m) => m.role === 'Капитан');
  const captainName = captain?.name?.trim() || data.mentorName?.trim() || 'Капитан команды';
  const captainTitle = data.mentorTitle?.trim() || 'Капитан команды';

  return {
    id: createId('team'),
    name: data.teamName.trim(),
    school: data.school.trim(),
    city: data.city.trim() || 'Россия',
    league: data.league,
    track: data.trackId,
    trackTitle: selectedTrack?.title,
    mentorName: captainName,
    mentorTitle: captainTitle,
    logo: is3U ? '🛰️' : '🛸',
    description: `Проект наноспутника CubeSat ${data.format} по направлению «${selectedTrack?.shortTitle || 'Космос'}». Учебное заведение: ${data.school}.`,
    members: data.members.map((m) => ({
      ...m,
      id: m.id || createId('m'),
      name: m.name.trim(),
    })),
    cubesatSpecs: specs,
    stageStatuses: {
      stage_1: 'draft',
      stage_2: 'not_started',
      stage_3: 'not_started',
      stage_4: 'not_started',
      stage_5: 'not_started',
    },
    stageScores: {
      stage_1: 0,
      stage_2: 0,
      stage_3: 0,
      stage_4: 0,
      stage_5: 0,
    },
    totalScore: 0,
    rank: 6,
    badges: ['Новый участник', selectedTrack?.shortTitle || 'Зарегистрирован'],
    launchReadinessPercent: 12,
  };
}
