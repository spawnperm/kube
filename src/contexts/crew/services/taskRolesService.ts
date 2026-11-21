/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Сервис генерации ролевых подзадач под выбранную тему CubeSat,
 * энциклопедических справок из Википедии и базы стартового квиза.
 */

import {
  CrewRoleType,
  RoleSubtask,
  CaseTask,
  QuizQuestion,
  CrmNotificationEmail,
  CrmChampionshipStage,
  CrewRoleDefinition,
} from '@/src/shared/types/index';

export const INITIAL_CREW_ROLES: CrewRoleDefinition[] = [
  {
    id: 'role-commander',
    key: 'captain',
    title: 'Командир корабля',
    category: 'command',
    categoryLabel: 'Командный состав',
    shortDesc:
      'Общее руководство миссией, координация экипажа, выбор кейса, утверждение 3 слайдов и защита перед ЦУП',
    defaultDiscipline: 'Управление миссией',
    isPredefined: true,
  },
  {
    id: 'role-navigator',
    key: 'navigator',
    title: 'Штурман',
    category: 'command',
    categoryLabel: 'Командный состав',
    shortDesc:
      'Баллистический расчет орбит, сеансы радиосвязи 437 МГц, передача телеметрии на Землю',
    defaultDiscipline: 'Радионавигация и баллистика',
    isPredefined: true,
  },
  {
    id: 'role-medic',
    key: 'medic',
    title: 'Медик',
    category: 'medicine',
    categoryLabel: 'Медицина и биозащита',
    shortDesc:
      'Оценка физиологических нормативов, токсичность газовой смеси, стерильность биоконтейнера',
    defaultDiscipline: 'Космическая медицина',
    isPredefined: true,
  },
  {
    id: 'role-biologist',
    key: 'biologist',
    title: 'Биолог',
    category: 'exact_sciences',
    categoryLabel: 'Точные науки',
    shortDesc:
      'Замкнутые биосистемы, фотосинтез Chlorella, биосенсоры и расчет радиационной дозы в поясах Ван Аллена',
    defaultDiscipline: 'Космическая биология',
    isPredefined: true,
  },
  {
    id: 'role-translator',
    key: 'translator',
    title: 'Переводчик (филолог)',
    category: 'humanities',
    categoryLabel: 'Гуманитарные науки',
    shortDesc:
      'Международная космическая терминология, перевод научной спецификации CubeSat на английский, тезаурус миссии',
    defaultDiscipline: 'Космическая филология и лингвистика',
    isPredefined: true,
  },
  {
    id: 'role-marketer',
    key: 'marketer',
    title: 'Маркетолог (торговец)',
    category: 'commercial',
    categoryLabel: 'Коммерциализация',
    shortDesc:
      'Коммерциализация данных орбитальной миссии, оценка рынка наноспутников, привлечение индустриальных спонсоров',
    defaultDiscipline: 'Экономика космоса и маркетинг',
    isPredefined: true,
  },
  {
    id: 'role-physicist',
    key: 'physicist',
    title: 'Физик',
    category: 'exact_sciences',
    categoryLabel: 'Точные науки',
    shortDesc:
      'Физико-математические расчеты торможения в термосфере, свободномолекулярный поток, тепловой баланс',
    defaultDiscipline: 'Физика и баллистика',
    isPredefined: true,
  },
  {
    id: 'role-chemist',
    key: 'chemist',
    title: 'Химик',
    category: 'exact_sciences',
    categoryLabel: 'Точные науки',
    shortDesc:
      'Электрохимия аккумуляторов LiFePO4, радиационная стойкость материалов, дегазация в глубоком вакууме',
    defaultDiscipline: 'Химия космических систем',
    isPredefined: true,
  },
  {
    id: 'role-engineer',
    key: 'engineer',
    title: 'Инженер',
    category: 'engineering',
    categoryLabel: 'Точные науки / Инженерия',
    shortDesc:
      '3D компоновка шасси 3U, шина PC104, раскрытие солнечных батарей и энергобаланс полезной нагрузки',
    defaultDiscipline: 'Космическая инженерия',
    isPredefined: true,
  },
  {
    id: 'role-flight-mechanic',
    key: 'flight_mechanic',
    title: 'Бортмеханик',
    category: 'engineering',
    categoryLabel: 'Точные науки / Инженерия',
    shortDesc:
      'Механические узлы, рельсы P-POD, вибродинамика при пуске РН 12g, сервоприводы и замки раскрытия',
    defaultDiscipline: 'Прикладная механика космических аппаратов',
    isPredefined: true,
  },
  {
    id: 'role-mathematician',
    key: 'mathematician',
    title: 'Математик (орбитальный аналитик)',
    category: 'exact_sciences',
    categoryLabel: 'Точные науки',
    shortDesc:
      'Численные интеграторы траектории, оптимизация энергопотребления маховиков ADCS, алгоритмы ориентации',
    defaultDiscipline: 'Прикладная математика',
    isPredefined: true,
  },
  {
    id: 'role-designer',
    key: 'designer',
    title: 'Бортовой дизайнер',
    category: 'engineering',
    categoryLabel: 'Инженерный дизайн',
    shortDesc:
      '3D-визуализация наноспутника, инфографика и наглядное оформление 3-х слайдов защиты',
    defaultDiscipline: 'Инженерный дизайн',
    isPredefined: true,
  },
];

const ROLES_STORAGE_KEY = 'kosmoport_crm_roles_v2';

export interface WikiEntry {
  id: string;
  query: string;
  title: string;
  discipline: 'Физика' | 'Химия' | 'Биология' | 'Математика' | 'Космонавтика' | 'Инженерия';
  extract: string;
  keyFormulas?: string[];
  wikipediaUrl: string;
}

export const WIKIPEDIA_DATABASE: WikiEntry[] = [
  {
    id: 'wiki-01',
    query: 'Свободномолекулярное течение',
    title: 'Свободномолекулярное течение (Аэродинамика разреженных газов)',
    discipline: 'Физика',
    extract:
      'Режим течения разреженного газа, при котором длина свободного пробега молекул значительно превышает характерный размер обтекаемого тела (число Кнудсена Kn >> 1). Характерен для орбит наноспутников на высотах от 200 до 600 км. Молекулы нейтральной атмосферы сталкиваются с поверхностью кубсата и отражаются диффузно либо зеркально, передавая спутнику тормозной импульс.',
    keyFormulas: [
      'Kn = \\frac{\\lambda}{L} \\gg 1',
      'a_{drag} = \\frac{1}{2} C_D \\frac{A}{m} \\rho v^2',
    ],
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/Свободномолекулярное_течение',
  },
  {
    id: 'wiki-02',
    query: 'Законы Кеплера',
    title: 'Законы Кеплера и круговая скорость на орбите',
    discipline: 'Физика',
    extract:
      'Три эмпирических закона движения планет и искусственных спутников: 1) Орбиты являются коническими сечениями с фокусом в центре Земли. 2) Радиус-вектор описывает равные площади за равные промежутки времени. 3) Квадраты периодов обращения относятся как кубы больших полуосей орбит.',
    keyFormulas: ['v_1 = \\sqrt{\\frac{G M_E}{R_E + h}}', 'T = 2\\pi \\sqrt{\\frac{a^3}{\\mu}}'],
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/Законы_Кеплера',
  },
  {
    id: 'wiki-03',
    query: 'Литий-железо-фосфатный аккумулятор',
    title: 'Литий-железо-фосфатные аккумуляторы (LiFePO4) в космосе',
    discipline: 'Химия',
    extract:
      'Тип электрического аккумулятора, являющийся подвидом литий-ионного аккумулятора, в котором катод состоит из LiFePO4. Обладает высочайшей термической и химической стабильностью (отсутствие теплового разгона до 270°C), ресурсом более 4000 циклов заряда-разряда при глубине DoD 80%, что делает его идеальным выбором для 16 суточных витков кубсатов в условиях периодических затмений.',
    keyFormulas: [
      'LiFePO_4 \\rightleftarrows FePO_4 + Li^+ + e^-',
      'E_{bat} = \\frac{P_{load} \\cdot t_{eclipse}}{\\eta \\cdot DoD}',
    ],
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/Литий-железо-фосфатный_аккумулятор',
  },
  {
    id: 'wiki-04',
    query: 'Реакция Сабатье',
    title: 'Реакция Сабатье (Каталитическое метанирование углекислого газа)',
    discipline: 'Химия',
    extract:
      'Реакция взаимодействия водорода с диоксидом углерода при повышенной температуре (300—400 °C) и давлении в присутствии никелевого или рутениевого катализатора. Применяется на космических кораблях и биомодулях для регенерации кислорода: выдыхаемый CO2 превращается в метан и воду, а вода затем разлагается электролизом с возвратом O2 экипажу.',
    keyFormulas: [
      'CO_2 + 4H_2 \\xrightarrow{Ni, 400^\\circ C} CH_4 + 2H_2O + 165\\text{ кДж/моль}',
      '2H_2O \\xrightarrow{электролиз} 2H_2 + O_2',
    ],
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/Реакция_Сабатье',
  },
  {
    id: 'wiki-05',
    query: 'Радиационный пояс',
    title: 'Радиационные пояса Земли (Пояса Ван Аллена)',
    discipline: 'Биология',
    extract:
      'Область магнитосферы Земли, в которой удерживаются захваченные геомагнитным полем высокоэнергетичные заряженные частицы (протоны солнечного происхождения с энергией до сотен МэВ и релятивистские электроны). Внутренний пояс расположен на высотах от 1000 до 6000 км, однако в районе Южно-Атлантической магнитной аномалии (SAMA) опускается до 200–400 км, создавая радиационную опасность для кремниевых микросхем и биоэкспериментов на борту CubeSat.',
    keyFormulas: ['D = \\frac{\\Delta E}{\\Delta m}', 'I(x) = I_0 \\cdot e^{-\\mu x}'],
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/Радиационный_пояс',
  },
  {
    id: 'wiki-06',
    query: 'Фотосинтез микроводорослей',
    title: 'Культивирование микроводорослей Chlorella vulgaris в условиях микрогравитации',
    discipline: 'Биология',
    extract:
      'Использование одноклеточных зеленых водорослей рода Хлорелла в фотобиореакторах малых спутников. В условиях невесомости и конвективной стагнации требуется принудительное перемешивание и светодиодное освещение фотосинтетически активной радиацией (ФАР 400–700 нм). 1 литр суспензии хлореллы способен поглотить до 25 литров CO2 в сутки, вырабатывая эквивалентный объем чистого O2.',
    keyFormulas: [
      '6CO_2 + 6H_2O + h\\nu \\rightarrow C_6H_{12}O_6 + 6O_2',
      '\\text{КПД фотосинтеза} \\approx 8-12\\%',
    ],
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/Хлорелла',
  },
  {
    id: 'wiki-07',
    query: 'CubeSat',
    title: 'Международный стандарт наноспутников CubeSat (1U, 2U, 3U, 6U)',
    discipline: 'Космонавтика',
    extract:
      'Формат малых искусственных спутников Земли, предложенный в 1999 году профессорами Робертом Твиггсом (Стэнфорд) и Джорди Пуиг-Суари (CalPoly). Базовая единица 1U имеет габариты 100×100×113.5 мм и массу до 1.33 кг (в обновленной спецификации до 2.0 кг). Формат 3U (300×100×100 мм) является отраслевым эталоном для образовательных и научных миссий, позволяя нести стабилизацию по трем осям и научную полезную нагрузку.',
    keyFormulas: [
      '1U = 10 \\times 10 \\times 11.35\\text{ см}',
      'm_{3U} \\le 4.0 - 5.0\\text{ кг}',
    ],
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/CubeSat',
  },
  {
    id: 'wiki-08',
    query: 'Формула Циолковского',
    title: 'Формула Циолковского и характеристическая скорость',
    discipline: 'Математика',
    extract:
      'Фундаментальное уравнение динамики ракеты, связывающее скорость летательного аппарата под действием тяги ракетного двигателя с удельным импульсом и отношением начальной и конечной массы. Применяется для расчета маневров перехода с круговой на эллиптическую орбиту (маневры Гомана).',
    keyFormulas: [
      '\\Delta v = I_{sp} \\cdot g_0 \\cdot \\ln\\left(\\frac{m_0}{m_k}\\right)',
      '\\Delta v_{Hohmann} = |v_{a1} - v_{circ1}| + |v_{circ2} - v_{a2}|',
    ],
    wikipediaUrl: 'https://ru.wikipedia.org/wiki/Формула_Циолковского',
  },
];

export const STARTER_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'sq-1',
    category: 'Физика и баллистика',
    question:
      'Какова первая космическая скорость для круговой орбиты на высоте около 400 км над Землей?',
    options: ['7.67 км/с', '11.2 км/с', '3.14 км/с', '9.81 км/с'],
    correctIndex: 0,
    explanation:
      'Первая космическая скорость вычисляется по формуле v1 = sqrt(G*M / (R_Земли + h)). Для высоты 400 км радиус r = 6371 + 400 = 6771 км, скорость составляет 7.67 км/с.',
    formulaReference: 'v_1 = \\sqrt{\\frac{G M_E}{R_E + h}} \\approx 7.67\\text{ км/с}',
  },
  {
    id: 'sq-2',
    category: 'Аэродинамика термосферы',
    question:
      'Как называется режим обтекания наноспутника на высоте 400 км, где длина пробега молекул много больше размера кубсата?',
    options: [
      'Свободномолекулярное течение',
      'Сверхзвуковой турбулентный пограничный слой',
      'Ламинарное вязкое обтекание',
      'Ударная волна Маха',
    ],
    correctIndex: 0,
    explanation:
      'На высотах свыше 200 км число Кнудсена Kn >> 1, что соответствует режиму свободномолекулярного течения без образования сплошной ударной волны.',
    formulaReference: 'Kn = \\frac{\\lambda}{L} \\gg 1',
  },
  {
    id: 'sq-3',
    category: 'Химия и электропитание',
    question:
      'Почему в космических аппаратах CubeSat отдают предпочтение аккумуляторам LiFePO4 перед обычными Li-Po?',
    options: [
      'Высокая термическая стабильность (нет теплового разгона) и ресурс более 4000 циклов',
      'Они работают только в вакууме и не требуют герметизации',
      'Они заряжаются быстрее скорости света',
      'Они весят в 10 раз меньше гелия',
    ],
    correctIndex: 0,
    explanation:
      'LiFePO4 выдерживают жесткие условия циклирования (16 витков в сутки, каждый со входом в тень) и безопасны при экстремальных перепадах температур от -40°C до +60°C.',
    formulaReference: 'Ресурс > 4000\\text{ циклов при } DoD = 80\\%',
  },
  {
    id: 'sq-4',
    category: 'Биология и экология замкнутого цикла',
    question:
      'Какая микроводоросль наиболее эффективна в космических биорегенеративных модулях 1U для поглощения CO2 и выработки кислорода?',
    options: [
      'Chlorella vulgaris (Хлорелла)',
      'Спирогира',
      'Морская капуста (Ламинария)',
      'Дрожжи хлебопекарные',
    ],
    correctIndex: 0,
    explanation:
      'Хлорелла обладает рекордной скоростью фотосинтеза и способна вырабатывать до 25 литров кислорода на литр суспензии в сутки.',
    formulaReference: '6CO_2 + 6H_2O \\xrightarrow{h\\nu} C_6H_{12}O_6 + 6O_2',
  },
  {
    id: 'sq-5',
    category: 'Инженерия CubeSat',
    question:
      'Каковы стандартные габариты корпуса одного юнита (1U) по стандарту CalPoly / Stanford?',
    options: [
      '100 × 100 × 113.5 мм',
      '50 × 50 × 50 мм',
      '1000 × 1000 × 1000 мм',
      '250 × 150 × 100 мм',
    ],
    correctIndex: 0,
    explanation:
      '1U кубсат имеет сечение 100 на 100 мм и высоту 113.5 мм с учетом направляющих рельсов для транспортно-пускового контейнера P-POD.',
    formulaReference: '1U = 100 \\times 100 \\times 113.5\\text{ мм}',
  },
];

export const CHAMPIONSHIP_STAGES_CRM: CrmChampionshipStage[] = [
  {
    id: 'crm-stage-1',
    number: 1,
    title: 'Регистрация корабля, наставника и штатного расписания',
    dates: '1 – 10 октября 2026',
    status: 'past',
    deadlineTime: '10 октября, 23:59',
    description:
      'Формирование экипажа (Капитан-наставник, 3 специалиста, Бортовой компьютер Леший). Утверждение квоты школы из реестра 16 ОУ г. Перми.',
    requiredDeliverables: [
      'Заполненное штатное расписание',
      'Название и позывной корабля',
      'Выбор темы миссии',
    ],
    notificationSent: true,
  },
  {
    id: 'crm-stage-2',
    number: 2,
    title: 'Стартовый квиз и заправка баков топливом',
    dates: '11 – 14 октября 2026',
    status: 'current',
    deadlineTime: '14 октября, 21:00',
    description:
      'Бортовой тест на знание физики, химии, биологии и наноспутников. Результат определяет уровень плазменного топлива корабля (0–100%).',
    requiredDeliverables: [
      'Прохождение 5 вопросов стартового квиза',
      'Заправка баков не менее 70%',
    ],
    notificationSent: true,
  },
  {
    id: 'crm-stage-3',
    number: 3,
    title: 'Разработка 3-х структурированных слайдов',
    dates: '15 – 19 октября 2026',
    status: 'future',
    deadlineTime: '19 октября, 21:00',
    description:
      'Слайд 1: Представление и фото команды. Слайд 2: Теоретическая модель, формулы и графики. Слайд 3: Практическая применимость в космосе (мнение каждого участника).',
    requiredDeliverables: [
      'Загрузка командного фото',
      'Ввод формул и расчетов',
      'Заполнение рефлексии каждого участника',
    ],
    notificationSent: false,
  },
  {
    id: 'crm-stage-4',
    number: 4,
    title: 'Предзащита и автоматический AI-аудит проектов',
    dates: '20 – 22 октября 2026',
    status: 'future',
    deadlineTime: '22 октября, 18:00',
    description:
      'Бортовой компьютер «Леший» и нейросеть Gemini проверяют полноту решения, баланс экипажа и корректность баллистических вычислений.',
    requiredDeliverables: ['Заключение AI-аудита ЦРСО', 'Устранение замечаний экспертов'],
    notificationSent: false,
  },
  {
    id: 'crm-stage-5',
    number: 5,
    title: 'Финал: Демонстрация презентации перед жюри ЦУП',
    dates: '25 октября 2026',
    status: 'future',
    deadlineTime: '25 октября, 16:00',
    description:
      'Прямая трансляция защиты проектов из личного кабинета капитана на большой экран перед Администрацией ЦУП (Смирнов А.А., Песин М.В., Анисимова А.С.).',
    requiredDeliverables: ['Демонстрация 3 слайдов с экрана', 'Ответы на вопросы экспертов ЦУП'],
    notificationSent: false,
  },
];

export const INITIAL_NOTIFICATIONS_EMAILS: CrmNotificationEmail[] = [
  {
    id: 'em-01',
    recipientEmail: 'dsbondarenko@yandex.ru',
    recipientName: 'Бондаренко Дарья Сергеевна',
    recipientRole: 'Капитан корабля «Восток-81»',
    teamName: 'Восток-81 (МАОУ «СОШ №81»)',
    subject: 'ЦУП КОСМОПОРТ: Штатное расписание корабля утверждено',
    preview:
      'Здравствуйте, Дарья Сергеевна! Администрация ЦУП подтвердила регистрацию Вашего экипажа...',
    body: `Уважаемая Дарья Сергеевна!

Центр Управления Полётами Чемпионата «КОСМОПОРТ» и МАОУ ДПО «ЦРСО» сообщают:
Ваша заявка от МАОУ «СОШ №81» г. Перми успешно сопоставлена с официальной квотой. 

Состав Вашего корабля «Восток-81»:
• Капитан: Бондаренко Дарья Сергеевна
• Бортовой Физик: Габдушев Марат Русланович (9А)
• Бортовой Химик: Глушко Андрей Михайлович (9А)
• Бортовой Биолог: Вотинов Илья Иванович (8А)
• Бортовой компьютер: «Леший» (Оркестратор бортовых систем)

Следующий обязательный шаг:
Пройдите стартовый квиз для 100% заправки плазменных баков корабля и приступайте к заполнению 3-х слайдов итоговой презентации.

С уважением,
Администратор ЦУП: Смирнов Александр Анатольевич
Руководитель полётов: Песин Михаил Владимирович
Консультант полётов: Анисимова Анастасия Сергеевна`,
    sentAt: '24 сентября 2026, 09:30',
    senderName: 'Смирнов Александр Анатольевич',
    senderPosition: 'Главный Администратор ЦУП',
    stageTitle: 'Этап 1: Регистрация',
    isRead: false,
    type: 'system',
  },
  {
    id: 'em-02',
    recipientEmail: 'dsbondarenko@yandex.ru',
    recipientName: 'Бондаренко Дарья Сергеевна',
    recipientRole: 'Капитан корабля «Восток-81»',
    teamName: 'Восток-81 (МАОУ «СОШ №81»)',
    subject: 'Этап 2: Открыта заправка баков и регламент 3-х слайдов',
    preview:
      'Внимание наставникам и экипажам! На основном экране личного кабинета активирован презентационный режим...',
    body: `Уважаемый Капитан!

Руководство полётов ЦУП объявляет о переходе к активной фазе подготовки орбитальной защиты.

Напоминаем структуру итоговых слайдов:
1. Слайд 1: Представление команды, название корабля, список экипажа с ролями и командная фотография.
2. Слайд 2: Теоретическая модель — формулы, графики и физические выкладки.
3. Слайд 3: Практическая применимость решения на орбите с персональным описанием от каждого члена экипажа!

Защита будет производиться прямо из Вашего личного кабинета в полноэкранном режиме демонстрации презентации.

Бортовой компьютер «Леший» готов предоставить энциклопедические справки из Википедии по Вашему кейсу в любой момент.

Удачного полета!
Михаил Владимирович Песин, Руководитель полётов ЦУП`,
    sentAt: '24 сентября 2026, 11:15',
    senderName: 'Михаил Владимирович Песин',
    senderPosition: 'Руководитель полётов ЦУП',
    stageTitle: 'Этап 2: Подготовка слайдов',
    isRead: false,
    type: 'stage_announcement',
  },
];

class TaskRolesService {
  /**
   * Генерирует ролевые подзадачи экипажа согласно выбранной теме кейса
   */
  public generateSubtasksForTeam(
    taskId: string,
    taskTitle: string,
    crewRoles: { studentName: string; role: CrewRoleType }[],
    mentorName: string,
  ): RoleSubtask[] {
    const subtasks: RoleSubtask[] = [];

    // Подзадача Капитана (Педагога)
    subtasks.push({
      id: `st-cap-${Date.now()}`,
      role: 'captain',
      roleTitle: 'Капитан корабля (Наставник)',
      title: 'Координация команды и генерация 3-х слайдов презентации',
      description: `Утвердить структуру решения по теме «${taskTitle}», загрузить фото экипажа и подготовиться к защите с экрана перед ЦУП.`,
      discipline: 'Управление миссией',
      wikiQuery: 'CubeSat',
      completed: true,
      assignedStudentName: mentorName,
    });

    // Генерация задач для каждого школьника в зависимости от его роли
    crewRoles.forEach((member, idx) => {
      const assignedName = member.studentName;
      const role = member.role;

      if (role === 'physicist') {
        subtasks.push({
          id: `st-phys-${idx}-${Date.now()}`,
          role: 'physicist',
          roleTitle: 'Бортовой Физик',
          title: 'Математический и физический расчет модели на витке',
          description: `Вывести формулы торможения/теплообмена для темы «${taskTitle}», подготовить график зависимости параметров от высоты для Слайда 2.`,
          discipline: 'Физика и баллистика',
          wikiQuery: 'Свободномолекулярное течение',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'chemist') {
        subtasks.push({
          id: `st-chem-${idx}-${Date.now()}`,
          role: 'chemist',
          roleTitle: 'Бортовой Химик',
          title: 'Электрохимический расчет и материаловедение оболочки',
          description: `Оценить химическую стойкость покрытий ЭВТИ, термодеградацию полимеров и химический ресурс аккумуляторов LiFePO4.`,
          discipline: 'Химия космических систем',
          wikiQuery: 'Литий-железо-фосфатный аккумулятор',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'biologist') {
        subtasks.push({
          id: `st-bio-${idx}-${Date.now()}`,
          role: 'biologist',
          roleTitle: 'Бортовой Биолог',
          title: 'Анализ выживаемости биокультуры и радиационной дозы',
          description: `Рассчитать поглощенную дозу в поясах Ван Аллена и описать замкнутый контур регенерации с водорослями Chlorella для Слайда 3.`,
          discipline: 'Космическая биология',
          wikiQuery: 'Фотосинтез микроводорослей',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'mathematician') {
        subtasks.push({
          id: `st-math-${idx}-${Date.now()}`,
          role: 'mathematician',
          roleTitle: 'Орбитальный Аналитик (Математик)',
          title: 'Численное моделирование траектории и векторов тяги',
          description: `Составить дифференциальное уравнение изменения элементов кеплеровой орбиты и рассчитать время жизни спутника.`,
          discipline: 'Прикладная математика',
          wikiQuery: 'Законы Кеплера',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'engineer') {
        subtasks.push({
          id: `st-eng-${idx}-${Date.now()}`,
          role: 'engineer',
          roleTitle: 'Инженер-конструктор CubeSat',
          title: 'Компоновка полезной нагрузки и спецификация шасси 3U',
          description: `Проверить массогабаритный лимит 3.8 кг, размещение плат стандарта PC104 и угол раскрытия солнечных панелей GaAs.`,
          discipline: 'Космическая инженерия',
          wikiQuery: 'CubeSat',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'designer') {
        subtasks.push({
          id: `st-des-${idx}-${Date.now()}`,
          role: 'designer',
          roleTitle: 'Бортовой Дизайнер',
          title: '3D-визуализация корабля и инфографика слайдов',
          description: `Подготовить графический макет CubeSat 3U, оформить читаемые схемы и композицию совместной фотографии экипажа для Слайда 1.`,
          discipline: 'Инженерный дизайн',
          wikiQuery: 'CubeSat',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'medic') {
        subtasks.push({
          id: `st-med-${idx}-${Date.now()}`,
          role: 'medic',
          roleTitle: 'Космический Медик',
          title: 'Оценка физиологических нормативов и токсичности',
          description: `Сформулировать требования к стерильности биомодуля, составу газовой смеси и радиационной безопасности биокультур.`,
          discipline: 'Космическая медицина',
          wikiQuery: 'Радиационный пояс',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'navigator') {
        subtasks.push({
          id: `st-nav-${idx}-${Date.now()}`,
          role: 'navigator',
          roleTitle: 'Штурман корабля',
          title: 'Расчет зон радиовидимости и каналов телеметрии',
          description: `Рассчитать продолжительность сеансов радиосвязи на частоте 437 МГц над Пермской наземной станцией приема данных.`,
          discipline: 'Радионавигация и баллистика',
          wikiQuery: 'Законы Кеплера',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'translator') {
        subtasks.push({
          id: `st-trans-${idx}-${Date.now()}`,
          role: 'translator',
          roleTitle: 'Переводчик (филолог)',
          title: 'Международная космическая терминология и тезаурус CubeSat',
          description: `Перевести паспорт миссии «${taskTitle}» на международный английский язык, унифицировать терминологию телеметрии стандартов CCSDS и подготовить англоязычное резюме Слайда 1 и Слайда 3.`,
          discipline: 'Космическая филология и лингвистика',
          wikiQuery: 'CubeSat',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'marketer') {
        subtasks.push({
          id: `st-mkt-${idx}-${Date.now()}`,
          role: 'marketer',
          roleTitle: 'Маркетолог (торговец)',
          title: 'Технико-экономическое обоснование и коммерциализация миссии',
          description: `Рассчитать себестоимость одного витка орбитального эксперимента по теме «${taskTitle}», сформировать пакет монетизации данных для предприятий Пермского края и обосновать инвестиционную привлекательность для жюри.`,
          discipline: 'Экономика космоса и маркетинг',
          wikiQuery: 'CubeSat',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else if (role === 'flight_mechanic') {
        subtasks.push({
          id: `st-fm-${idx}-${Date.now()}`,
          role: 'flight_mechanic',
          roleTitle: 'Бортмеханик',
          title: 'Вибродинамический расчет и кинематика замков раскрытия',
          description: `Проверить устойчивость каркаса 3U к стартовым перегрузкам до 12g при выведении РН «Союз-2», рассчитать тепловые зазоры алюминиевых направляющих контейнера P-POD и ресурс пружинных толкателей.`,
          discipline: 'Прикладная космическая механика',
          wikiQuery: 'CubeSat',
          completed: false,
          assignedStudentName: assignedName,
        });
      } else {
        // Fallback for custom added roles from CRM
        const roleDef = this.getRoleDefinition(role);
        const title = roleDef?.title || `Специалист (${role})`;
        const discipline = roleDef?.defaultDiscipline || 'Космические технологии';
        subtasks.push({
          id: `st-custom-${idx}-${Date.now()}`,
          role: role,
          roleTitle: title,
          title: `Решение целевой задачи по теме «${taskTitle}»`,
          description: `Выполнить специализированную проработку орбитальной миссии корабля в соответствии с направлением ${discipline} для итоговых слайдов защиты.`,
          discipline: discipline,
          wikiQuery: 'CubeSat',
          completed: false,
          assignedStudentName: assignedName,
        });
      }
    });

    return subtasks;
  }

  /**
   * Получить пополняемый список всех ролей CRM (из локального хранилища или начального списка)
   */
  public getAvailableRoles(): CrewRoleDefinition[] {
    if (typeof window === 'undefined') return INITIAL_CREW_ROLES;
    try {
      const stored = localStorage.getItem(ROLES_STORAGE_KEY);
      if (stored) {
        const parsed: CrewRoleDefinition[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with initial in case new predefined roles were added
          const existingKeys = new Set(parsed.map((r) => r.key));
          const missingPredefined = INITIAL_CREW_ROLES.filter((r) => !existingKeys.has(r.key));
          if (missingPredefined.length > 0) {
            const merged = [...parsed, ...missingPredefined];
            localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(merged));
            return merged;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading CRM roles:', e);
    }
    return INITIAL_CREW_ROLES;
  }

  /**
   * Добавить новую роль в пополняемый справочник CRM
   */
  public addCustomRole(newRole: {
    title: string;
    category?: CrewRoleDefinition['category'];
    categoryLabel?: string;
    shortDesc: string;
    defaultDiscipline?: string;
  }): CrewRoleDefinition {
    const roles = this.getAvailableRoles();
    const slug = newRole.title
      .toLowerCase()
      .trim()
      .replace(/[^a-zа-я0-9]+/g, '_')
      .slice(0, 24);
    const key = `custom_${slug}_${Date.now()}`;

    const created: CrewRoleDefinition = {
      id: `role-${Date.now()}`,
      key,
      title: newRole.title.trim(),
      category: newRole.category || 'custom',
      categoryLabel: newRole.categoryLabel || 'Пользовательская роль',
      shortDesc: newRole.shortDesc.trim(),
      defaultDiscipline: newRole.defaultDiscipline?.trim() || 'Космические исследования',
      isPredefined: false,
    };

    const updated = [...roles, created];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving custom role:', e);
      }
    }
    return created;
  }

  /**
   * Найти определение роли по ее ключу
   */
  public getRoleDefinition(roleKey: string): CrewRoleDefinition | undefined {
    const roles = this.getAvailableRoles();
    return (
      roles.find((r) => r.key === roleKey) || INITIAL_CREW_ROLES.find((r) => r.key === roleKey)
    );
  }

  /**
   * Получить название роли
   */
  public getRoleTitle(roleKey: string): string {
    const roleDef = this.getRoleDefinition(roleKey);
    return roleDef?.title || roleKey;
  }

  /**
   * Поиск статей в Википедии по ключевому слову или дисциплине
   */
  public searchWikipedia(query: string): WikiEntry[] {
    const q = query.toLowerCase().trim();
    if (!q) return WIKIPEDIA_DATABASE;

    return WIKIPEDIA_DATABASE.filter(
      (item) =>
        item.query.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.extract.toLowerCase().includes(q) ||
        item.discipline.toLowerCase().includes(q),
    );
  }

  /**
   * Получить статью по точному совпадению или релевантности
   */
  public getWikiForQuery(query?: string): WikiEntry {
    if (!query) return WIKIPEDIA_DATABASE[0];
    const match = WIKIPEDIA_DATABASE.find(
      (w) =>
        w.query.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(w.query.toLowerCase()),
    );
    return match || WIKIPEDIA_DATABASE[0];
  }

  /**
   * Сгенерировать стартовые размышления участников для Слайда 3
   */
  public generateDefaultReflections(
    mentorName: string,
    students: { name: string; roleTitle: string; role: CrewRoleType }[],
    shipName: string,
  ) {
    const list = [
      {
        memberName: mentorName,
        role: 'captain' as CrewRoleType,
        roleTitle: 'Капитан (Наставник)',
        text: `Наш корабль «${shipName}» отрабатывает технологию малых спутников, которая уже в ближайшие годы позволит школьным и университетским лабораториям Пермского края проводить собственные научные эксперименты в космосе с минимальной себестоимостью.`,
      },
    ];

    students.forEach((s) => {
      let text: string;
      if (s.role === 'physicist') {
        text = `С точки зрения физики, рассчитанная нами модель торможения в термосфере позволяет прогнозировать орбитальное время жизни наноспутников и вовремя уводить их с рабочих орбит для предотвращения столкновений с МКС.`;
      } else if (s.role === 'chemist') {
        text = `Химические расчеты деградации полимеров и стабильности батарей доказывают, что выбранные материалы выдержат перепады температур от -60°C до +120°C в течение расчетного срока миссии.`;
      } else if (s.role === 'biologist') {
        text = `Биологический эксперимент наглядно демонстрирует возможность культивирования одноклеточных микроорганизмов в условиях микрогравитации для будущих замкнутых систем жизнеобеспечения на Луне.`;
      } else if (s.role === 'mathematician') {
        text = `Математический алгоритм оптимизации ориентации спутника экономит до 35% электроэнергии бортовых маховиков ADCS на каждом витке орбиты.`;
      } else if (s.role === 'engineer') {
        text = `Модульная компоновка стандарта 3U позволяет разместить всю полезную нагрузку в объеме 1U без перегрева соседних блоков бортовой электроники.`;
      } else if (s.role === 'designer') {
        text = `Наглядная инфографика и цветовая кодировка подсистем ускоряют анализ телеметрии операторами ЦУП при наземных испытаниях.`;
      } else if (s.role === 'medic') {
        text = `Контроль герметичности и биозащиты гарантирует полную безопасность полезной нагрузки при проведении орбитального эксперимента.`;
      } else if (s.role === 'translator') {
        text = `Международный перевод спецификаций и терминологический глоссарий открывают доступ к публикации результатов нашей школы в каталогах открытых данных CubeSat.`;
      } else if (s.role === 'marketer') {
        text = `Бизнес-модель миссии доказывает, что полученные данные зондирования окупают запуск наноспутника за счет востребованности агро- и лесными хозяйствами региона.`;
      } else if (s.role === 'flight_mechanic') {
        text = `Надежность замковых соединений и расчет виброустойчивости при перегрузках 12g гарантируют безотказное раскрытие панелей в первые минуты после отделения от разгонного блока.`;
      } else {
        text = `Устойчивый радиоканал на частоте 437 МГц позволяет передавать научные данные прямо на приемную антенну нашей школы в Перми.`;
      }

      list.push({
        memberName: s.name,
        role: s.role,
        roleTitle: s.roleTitle,
        text,
      });
    });

    return list;
  }
}

export const taskRolesService = new TaskRolesService();
