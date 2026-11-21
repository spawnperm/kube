import {
  SpacePiApplication,
  SpacePiIdea,
  SpacePiConstellationSatellite,
  SpacePiChecklist,
  Team,
  Submission,
} from '../types';

export const SPACE_PI_CONSTELLATION: SpacePiConstellationSatellite[] = [
  {
    id: 'um-ka-1',
    name: 'УмКА-1',
    slug: 'um-ka-1',
    organization: 'Школа №29 им. П.И. Забродина',
    schoolPartner: 'Школьный астрономический кружок г. Подольск',
    city: 'Подольск',
    year: 2023,
    platform: 'Спутникс SXC3 (OrbiCraft-Pro)',
    format: 'CubeSat 3U',
    noradId: 57172,
    callsign: 'RS40S',
    frequenciesMhz: '437.625 МГц',
    payloadDescription:
      'Светосильный телескоп «Лептонар-20955К» и камера PlayerOne Ares-C для астрономических съемок и сброса SSTV-изображений для школьников.',
    missionType: 'Астрономические наблюдения и образовательный открытый маяк',
    status: 'orbit',
    soniksUrl: 'https://sonik.space',
    description:
      'Первый в России школьный космический телескоп формата CubeSat 3U. Разработан при участии школьников школы №29 г. Подольска, позволяет юным астрономам получать снимки созвездий и Луны напрямую через открытую радиосеть СОНИКС.',
  },
  {
    id: 'svyatobor-1',
    name: 'Святобор-1',
    slug: 'svyatobor-1',
    organization: 'НИЯУ МИФИ & Образовательный центр «Сириус»',
    city: 'Москва / Сочи',
    year: 2023,
    platform: 'Спутникс OrbiCraft-Pro 3U',
    format: 'CubeSat 3U',
    noradId: 57175,
    callsign: 'RS38S',
    frequenciesMhz: '437.375 МГц',
    payloadDescription:
      'Тепловизионная матрица ДЗЗ и плазменный электротермический микродвигатель VERA разработки МИФИ для коррекции орбиты.',
    missionType: 'Мониторинг лесных пожаров и тестирование плазменного двигателя',
    status: 'orbit',
    soniksUrl: 'https://sonik.space',
    description:
      'Спутник предназначен для раннего обнаружения очагов лесных пожаров и экологических бедствий, а также для летной квалификации первого отечественного плазменного двигателя для наноспутников.',
  },
  {
    id: 'geoscan-edelveis',
    name: 'Геоскан-Эдельвейс',
    slug: 'geoscan-edelveis',
    organization: 'ООО «Геоскан» & Фонд содействия инновациям',
    city: 'Санкт-Петербург',
    year: 2022,
    platform: 'Геоскан 3U',
    format: 'CubeSat 3U',
    noradId: 53385,
    callsign: 'RS20S',
    frequenciesMhz: '436.200 МГц',
    payloadDescription:
      'Оптическая камера ДЗЗ высокого разрешения, модуль ГНСС и газовый микродвигатель на сжатом газе.',
    missionType: 'Дистанционное зондирование Земли и открытая телеметрия для школ',
    status: 'orbit',
    soniksUrl: 'https://sonik.space',
    description:
      'Флагманский аппарат проекта Space-π. Передает тестовые фотоснимки Земли и пакеты телеметрии, которые принимают более 200 школьных станций по всей России.',
  },
  {
    id: 'monitor-2',
    name: 'Монитор-2',
    slug: 'monitor-2',
    organization: 'НИИЯФ МГУ им. М.В. Ломоносова',
    schoolPartner: 'Школьники физико-математических классов Москвы',
    city: 'Москва',
    year: 2023,
    platform: 'Спутникс OrbiCraft-Pro 3U',
    format: 'CubeSat 3U',
    noradId: 57168,
    callsign: 'RS44S',
    frequenciesMhz: '437.525 МГц',
    payloadDescription:
      'Сцинтилляционный спектрометр «КОДОР» для измерения потоков протонов и электронов космических лучей и радиационных поясов.',
    missionType: 'Космическая погода, мониторинг радиации и солнечных вспышек',
    status: 'orbit',
    soniksUrl: 'https://sonik.space',
    description:
      'Орбитальная лаборатория космической погоды. Данные детектора открыты для школьных исследовательских проектов по физике космоса и геомагнитным бурям.',
  },
  {
    id: 'sit-2086',
    name: 'SIT-2086',
    slug: 'sit-2086',
    organization: 'ГБОУ «Школа №2086» г. Москвы & Спутникс',
    city: 'Москва',
    year: 2023,
    platform: 'Спутникс 3U',
    format: 'CubeSat 3U',
    noradId: 57177,
    callsign: 'RS47S',
    frequenciesMhz: '437.400 МГц',
    payloadDescription:
      'Компактная камера ДЗЗ и аппаратура приема сигналов автоматической идентификационной системы (АИС) морских судов.',
    missionType: 'Мониторинг судоходства (АИС) и съемка Земли',
    status: 'orbit',
    soniksUrl: 'https://sonik.space',
    description:
      'Школьный космический аппарат, созданный проектной командой учащихся 8-11 классов школы №2086. Отслеживает перемещение судов по Северному морскому пути.',
  },
  {
    id: 'politeh-yunivers-3',
    name: 'Политех Юниверс-3',
    slug: 'politeh-yunivers-3',
    organization: 'СПбПУ Петра Великого',
    schoolPartner: 'Академическая гимназия №56 СПб',
    city: 'Санкт-Петербург',
    year: 2023,
    platform: 'Геоскан 3U',
    format: 'CubeSat 3U',
    noradId: 57170,
    callsign: 'RS46S',
    frequenciesMhz: '437.200 МГц',
    payloadDescription:
      'Высокоскоростной радиомодем диапазона X/S и аппаратура мониторинга ионосферных неоднородностей.',
    missionType: 'Исследования ионосферы и метеорных следов',
    status: 'orbit',
    soniksUrl: 'https://sonik.space',
    description:
      'Аппарат университетского созвездия СПбПУ, предоставляющий школьникам доступ к реальным радиофизическим измерениям параметров верхней атмосферы.',
  },
];

export const SPACE_PI_IDEAS_BANK: SpacePiIdea[] = [
  {
    id: 'idea-airglow-photometer',
    title: 'Фотометр ночного свечения верхней атмосферы (Airglow-3U)',
    category: 'space_weather',
    categoryLabel: 'Космическая погода & Геофизика',
    badge: 'Рекомендуется для Прикамья',
    difficulty: 'Продвинутый',
    summary:
      'Регистрация интенсивности зеленой эмиссионной линии атомарного кислорода (λ = 557.7 нм) в мезопаузе (85-100 км) для раннего предупреждения геомагнитных бурь и изучения внутренних гравитационных волн.',
    scientificValue:
      'Позволяет школьным командам обнаружить корреляцию между вспышками на Солнце, индексами Kp и локальным свечением ночной атмосферы на высоких широтах.',
    payloadComponents: [
      'Узкополосный интерференционный светофильтр 557.7 нм (FWHM = 2 нм)',
      'Кремниевый фотоэлектронный умножитель (SiPM SensL/Hamamatsu)',
      'Прецизионный трансимпедансный усилитель с АЦП 24-бит',
      'Бортовой микроконтроллер сбора данных STM32G4 / Raspberry Pi Pico',
      'Технологическая камера для верификации ориентации на лимб Земли',
    ],
    specs: {
      massG: 680,
      powerW: 4.8,
      volumeU: '0.8U (85x85x80 мм)',
      dataRate: '1.2 МБайт / виток',
    },
    realSpacePiPrecedents: ['Монитор-2 (НИИЯФ МГУ)', 'Норби-2 (НГУ)'],
    soniksExperiment:
      'Передача среднеквадратичного профиля свечения за виток в открытом пакете телеметрии. Школы по всей РФ строят карты ночного свечения над своими регионами.',
    templateData: {
      projectName: 'Фотометр свечения атмосферы «Северное сияние»',
      missionCategory: 'space_weather',
      missionGoal:
        'Непрерывный орбитальный мониторинг эмиссии возбужденного кислорода 557.7 нм в верхних слоях атмосферы Земли.',
      scientificNovelty:
        'Первый школьный микрофотометр с SiPM-детектором на борту CubeSat 3U, передающий сырые данные через открытый радиоканал СОНИКС.',
      payloadDescription:
        'Оптический тубус с диафрагмами подавления рассеянного света, интерференционный фильтр 557.7 нм, матричный кремниевый ФЭУ, термостатированный предусилитель и микроконтроллер с алгоритмом усреднения по 100 мс.',
      payloadMassGrams: 680,
      payloadDimensionsMm: { x: 85, y: 85, z: 80 },
      powerConsumptionWatts: { average: 3.5, peak: 6.2 },
      supplyVoltage: '5V',
      dataInterface: 'I2C',
      dailyDataVolumeMb: 18,
    },
  },
  {
    id: 'idea-forest-fire-ir-camera',
    title: 'Микротепловизор ДЗЗ раннего обнаружения очагов лесных пожаров',
    category: 'remote_sensing',
    categoryLabel: 'Дистанционное зондирование Земли',
    badge: 'Экологический мониторинг',
    difficulty: 'Экспертный',
    summary:
      'Мультиспектральная съемка в среднем инфракрасном (MWIR 3.7–4.8 мкм) и видимом диапазонах для локализации подпологовых торфяных и лесных пожаров до их выхода на кроны.',
    scientificValue:
      'Отработка школьного алгоритма бортового компьютерного зрения: детектирование тепловых аномалий прямо на борту и сброс сжатого алерта с координатами в сеть СОНИКС.',
    payloadComponents: [
      'Микроболометрическая неохлаждаемая тепловизионная матрица 640x512',
      'Германиевый объектив с просветлением в ИК-диапазоне (F/1.1)',
      'Синхронная оптическая RGB-камера 12 Мп для привязки к рельефу',
      'Вычислительный модуль с нейросетевым ускорителем (K210 / Hailo-8L)',
    ],
    specs: {
      massG: 950,
      powerW: 7.5,
      volumeU: '1.2U (90x90x120 мм)',
      dataRate: '15.4 МБайт / сеанс',
    },
    realSpacePiPrecedents: ['Святобор-1 (МИФИ)', 'Геоскан-Эдельвейс'],
    soniksExperiment:
      'При фиксации пожара спутник передает короткий экстренный APRS/AX.25 пакет с широтой, долготой и мощностью очага, доступный школьным станциям мониторинга МЧС.',
    templateData: {
      projectName: 'Орбитальный экопатруль лесов Урала и Сибири',
      missionCategory: 'remote_sensing',
      missionGoal:
        'Раннее космическое обнаружение термоточек и мониторинг гарей таежных лесов Пермского края и сопредельных регионов.',
      scientificNovelty:
        'Применение энергоэффективного бортового edge-AI алгоритма распознавания очагов на борту 3U спутника без необходимости сброса гигабайтов сырого видео.',
      payloadDescription:
        'Модуль инфракрасного зрения на базе болометра с германиевой оптикой и сопряженная камера видимого диапазона, управляемые одноплатным компьютером с нейросетевым фильтром дыма.',
      payloadMassGrams: 950,
      payloadDimensionsMm: { x: 90, y: 90, z: 120 },
      powerConsumptionWatts: { average: 5.2, peak: 9.8 },
      supplyVoltage: '5V',
      dataInterface: 'SPI',
      dailyDataVolumeMb: 45,
    },
  },
  {
    id: 'idea-space-bio-lab',
    title: 'Миниатюрная орбитальная биолаборатория «Космо-Флора»',
    category: 'biology',
    categoryLabel: 'Космическая биология & Агрофизика',
    badge: 'Научный прорыв',
    difficulty: 'Экспертный',
    summary:
      'Герметичный микроконтейнер с семенами культурных растений (пшеница, редис), капиллярной системой автополива, светодиодной фитоподсветкой и макрокамерой роста ростков в невесомости.',
    scientificValue:
      'Изучение кинетики прорастания семян и фототропизма в условиях комбинации невесомости и повышенного радиационного фона на орбите 550 км.',
    payloadComponents: [
      'Герметичный анодированный алюминиевый контейнер (1 атм) с оптическим окном',
      'Капиллярный питательный субстрат с гидрогелем и микронасосом',
      'Фито-светодиоды спектра 450 нм (синий) и 660 нм (красный)',
      'Цифровая макрокамера 5 Мп с кольцевой подсветкой',
      'Датчики влажности, CO2, O2 и температуры воздуха',
    ],
    specs: {
      massG: 1120,
      powerW: 6.2,
      volumeU: '1.4U (95x95x140 мм)',
      dataRate: '4.8 МБайт / виток',
    },
    realSpacePiPrecedents: ['Бион-М', 'Cubesat BioSentinel'],
    soniksExperiment:
      'Ежесуточная отправка таймлапс-снимков растущих семян и графиков фотосинтеза через СОНИКС. Школы проводят синхронный наземный контрольный эксперимент в классах.',
    templateData: {
      projectName: 'Орбитальная школьная биолаборатория «Семена Будущего»',
      missionCategory: 'biology',
      missionGoal:
        'Сравнительное исследование прорастания семян сельскохозяйственных культур в космосе и на Земле школьными командами.',
      scientificNovelty:
        'Первая школьная полностью герметичная камера с автономным капиллярным жизнеобеспечением в стандарте CubeSat 3U.',
      payloadDescription:
        'Камера с регулируемым газообменом, автоматической дозацией влаги по показаниям емкостного датчика и периодической макросъемкой корней и проростков.',
      payloadMassGrams: 1120,
      payloadDimensionsMm: { x: 95, y: 95, z: 140 },
      powerConsumptionWatts: { average: 3.8, peak: 7.4 },
      supplyVoltage: '5V',
      dataInterface: 'UART',
      dailyDataVolumeMb: 24,
    },
  },
  {
    id: 'idea-sstv-art-beacon',
    title: 'Открытый образовательный радиомаяк со сбросом космических SSTV-рисунков',
    category: 'amateur_radio',
    categoryLabel: 'Радиолюбительская связь & Просвещение',
    badge: '100% открытость СОНИКС',
    difficulty: 'Базовый',
    summary:
      'Радиолюбительский ретранслятор на 437 МГц, передающий телеметрию голосовым синтезатором, телеграфом (CW) и цифровыми изображениями в формате Slow Scan Television (Robot36 / Martin 1).',
    scientificValue:
      'Массовое вовлечение школьников РФ в радиоспорт и практическое радиолюбительство: прием открыток с борта на ручные SDR-приемники и простые антенны типа «волновой канал».',
    payloadComponents: [
      'SDR-передатчик диапазона 435–438 МГц мощностью до 1 Вт',
      'Flash-хранилище рисунков победителей школьного конкурса рисунков',
      'Голосовой синтезатор для чтения приветствий из космоса',
      'Турникетная развертываемая антенна круговой поляризации',
    ],
    specs: {
      massG: 420,
      powerW: 3.8,
      volumeU: '0.5U (80x80x50 мм)',
      dataRate: '0.4 МБайт / сеанс',
    },
    realSpacePiPrecedents: ['УмКА-1 (RS40S)', 'КузГТУ-1 (RS27S)'],
    soniksExperiment:
      'Каждый виток над территорией РФ спутник передает изображение и аудиоприветствие. Школьники декодируют картинку в бесплатном приложении Robot36 и получают диплом оператора.',
    templateData: {
      projectName: 'Космический радиовестник «Голос Гагарина»',
      missionCategory: 'amateur_radio',
      missionGoal:
        'Популяризация космонавтики и радиоспорта через прием открытых SSTV-радиопередач с борта школьного спутника.',
      scientificNovelty:
        'Интеграция адаптивного модуля синтеза речи и динамического расписания передачи изображений по запросам от наземных станций сети СОНИКС.',
      payloadDescription:
        'Модуль формирования сигналов частотной и фазовой модуляции, генератор аудио-поднесущей SSTV, энергонезависимая память на 128 изображений и контроллер расписания сеансов.',
      payloadMassGrams: 420,
      payloadDimensionsMm: { x: 80, y: 80, z: 50 },
      powerConsumptionWatts: { average: 2.1, peak: 4.9 },
      supplyVoltage: '3.3V',
      dataInterface: 'I2C',
      dailyDataVolumeMb: 8,
    },
  },
  {
    id: 'idea-radiation-spectrometer',
    title: 'Школьный радиационный спектрометр «Гамма-Скан»',
    category: 'space_weather',
    categoryLabel: 'Ядерная физика & Радиация',
    badge: 'Фундаментальная физика',
    difficulty: 'Продвинутый',
    summary:
      'Сцинтилляционный детектор CsI(Tl) с кремниевым фотоумножителем для непрерывного измерения спектра гамма-квантов (50 кэВ – 3 МэВ) и заряженных частиц в зонах Бразильской магнитной аномалии и полярных шапок.',
    scientificValue:
      'Построение детальной трехмерной карты радиационной обстановки на высоте орбиты МКС и КубСатов для оценки дозовых нагрузок на космонавтов и микроэлектронику.',
    payloadComponents: [
      'Сцинтилляционный кристалл CsI(Tl) 15x15x15 мм в светонепроницаемом корпусе',
      'Кремниевый фотодиод/ФЭУ высокой чувствительности',
      'Быстрый спектрометрический усилитель и многоканальный анализатор (1024 канала)',
      'Детектор вторичных протонов на кремниевой PIN-структуре',
    ],
    specs: {
      massG: 560,
      powerW: 3.2,
      volumeU: '0.7U (80x80x70 мм)',
      dataRate: '2.5 МБайт / виток',
    },
    realSpacePiPrecedents: ['Монитор-2', 'Монитор-3', 'Скорпион'],
    soniksExperiment:
      'Передача накопленных гистограмм энергетического спектра в реальном времени. Школьники на уроках физики рассчитывают поглощенную дозу и строят радиационные профили.',
    templateData: {
      projectName: 'Орбитальный дозиметр космических лучей «РадМонитор»',
      missionCategory: 'space_weather',
      missionGoal:
        'Изучение радиационных поясов Земли и динамики солнечных космических лучей на низкой околоземной орбите.',
      scientificNovelty:
        'Разработка открытого спектрометрического тракта с многоканальным анализом амплитуд, калибруемого школьниками по естественному фону до запуска.',
      payloadDescription:
        'Сцинтилляционный блок CsI(Tl) с термокомпенсированным SiPM, формирователь импульсов, быстрый пиковый детектор и микроконтроллер с кольцевым буфером событий.',
      payloadMassGrams: 560,
      payloadDimensionsMm: { x: 80, y: 80, z: 70 },
      powerConsumptionWatts: { average: 2.4, peak: 4.1 },
      supplyVoltage: '5V',
      dataInterface: 'SPI',
      dailyDataVolumeMb: 14,
    },
  },
  {
    id: 'idea-ais-iot-tracker',
    title: 'Приемник сигналов АИС морского флота и маяков диких животных',
    category: 'iot_ais',
    categoryLabel: 'Интернет вещей & Логистика',
    badge: 'Арктика и Севморпуть',
    difficulty: 'Продвинутый',
    summary:
      'Орбитальный приемник морских сигналов АИС (161.975 МГц и 162.025 МГц) и телеметрии радиомаяков миграции перелетных птиц и редких животных (системы типа ICARUS / Argos).',
    scientificValue:
      'Мониторинг караванов судов в акватории Северного морского пути и траекторий миграций фауны Заполярья в труднодоступных районах.',
    payloadComponents: [
      'Двухканальный SDR-приемник VHF морского диапазона АИС',
      'Приемный модуль УВЧ для трекеров животных (401.6 МГц)',
      'Развертываемая ленточная четвертьволновая антенна',
      'Декодер сообщений АИС типа 1, 2, 3, 5 на базе ARM Cortex-M7',
    ],
    specs: {
      massG: 490,
      powerW: 4.1,
      volumeU: '0.6U (85x85x60 мм)',
      dataRate: '3.6 МБайт / сеанс',
    },
    realSpacePiPrecedents: ['SIT-2086', 'Политех Юниверс-3'],
    soniksExperiment:
      'Спутник принимает координаты судов в Арктике и передает пакет в сеть СОНИКС. Школьники наносят текущие позиции ледоколов на интерактивную карту в реальном времени.',
    templateData: {
      projectName: 'Арктический монитор судоходства и фауны «Северный трек»',
      missionCategory: 'iot_ais',
      missionGoal:
        'Прием и декодирование сигналов морских судов Севморпути и биологических трекеров с борта КубСата 3U.',
      scientificNovelty:
        'Совмещение функции приема АИС сообщений со сбором микротелеметрии с автономных полевых датчиков экологов.',
      payloadDescription:
        'Цифровой приемный тракт прямого преобразования с ПЛИС/DSP обработкой пакетов протокола GMSK, полосовыми фильтрами на ПАВ и кольцевой очередью сообщений.',
      payloadMassGrams: 490,
      payloadDimensionsMm: { x: 85, y: 85, z: 60 },
      powerConsumptionWatts: { average: 3.1, peak: 5.5 },
      supplyVoltage: '3.3V',
      dataInterface: 'UART',
      dailyDataVolumeMb: 22,
    },
  },
  {
    id: 'idea-optical-laser-beacon',
    title: 'Лазерный оптический маяк и ретрорефлектор измерения орбит',
    category: 'astrophysics',
    categoryLabel: 'Лазерная оптика & Лазерная дальнометрия',
    badge: 'Высокие технологии',
    difficulty: 'Экспертный',
    summary:
      'Уголковый отражатель лазерного излучения (Corner-Cube Retroreflector) и полупроводниковый лазерный маяк 650 нм / 850 нм для отработки оптической связи «Борт-Земля» с любительскими телескопами.',
    scientificValue:
      'Сверхточное измерение параметров орбиты спутника с точностью до сантиметров методами спутниковой лазерной дальнометрии (SLR) и тестирование оптического канала связи.',
    payloadComponents: [
      'Матрица из 4 прецизионных кварцевых призм-ретрорефлекторов',
      'Импульсный лазерный диод 200 мВт с коллимирующей оптикой',
      'Система стабилизации температуры лазера на элементе Пельтье',
      'Светоловушка и датчик освещенности для безопасного включения только в тени',
    ],
    specs: {
      massG: 620,
      powerW: 5.4,
      volumeU: '0.7U (85x85x75 мм)',
      dataRate: '0.8 МБайт / сеанс',
    },
    realSpacePiPrecedents: ['Сколтех-Б1', 'КузГТУ-1'],
    soniksExperiment:
      'Школьные обсерватории фиксируют лазерные вспышки спутника на фоне звездного неба, определяют видимый блеск и учатся фотографировать быстро движущиеся космические объекты.',
    templateData: {
      projectName: 'Орбитальный лазерный маяк «Фотон-Школа»',
      missionCategory: 'astrophysics',
      missionGoal:
        'Отработка лазерной оптической локации наноспутника и организация визуальных сеансов связи со школьными обсерваториями.',
      scientificNovelty:
        'Компактная комбинированная оптоэлектронная сборка с кварцевыми ретрорефлекторами для миллиметровой калибровки орбиты.',
      payloadDescription:
        'Блок уголковых отражателей из кварцевого стекла КУ-1, лазерный передатчик с контроллером импульсной модуляции и термостабилизацией.',
      payloadMassGrams: 620,
      payloadDimensionsMm: { x: 85, y: 85, z: 75 },
      powerConsumptionWatts: { average: 3.2, peak: 6.8 },
      supplyVoltage: '5V',
      dataInterface: 'CAN',
      dailyDataVolumeMb: 6,
    },
  },
  {
    id: 'idea-nanomaterials-degradation',
    title: 'Тестер деградации нанопокрытий и терморегулирующих красок в вакууме',
    category: 'materials_propulsion',
    categoryLabel: 'Материаловедение & Нанотехнологии',
    badge: 'Инженерия материалов',
    difficulty: 'Продвинутый',
    summary:
      'Исследование воздействия атомарного кислорода, глубокого ультрафиолета и циклов нагрева/охлаждения на перспективные полимерные пленки, углеродные нанотрубки и терморегулирующие эмали.',
    scientificValue:
      'Оценка ресурса новых отечественных материалов для спутников следующего поколения в условиях реального космического пространства.',
    payloadComponents: [
      'Кассета с 6 тестируемыми образцами на наружной панели КубСата',
      'Кварцевые пьезоэлектрические микровесы (QCM) для регистрации потери массы',
      'Четырехзондовые датчики поверхностного электросопротивления',
      'Прецизионные платиновые термометры сопротивления Pt1000',
    ],
    specs: {
      massG: 510,
      powerW: 2.9,
      volumeU: '0.5U (80x80x55 мм)',
      dataRate: '1.1 МБайт / виток',
    },
    realSpacePiPrecedents: ['МИЭТ-СатЛаб', 'Иоффе-1'],
    soniksExperiment:
      'Потоковые данные сопротивления и массы образцов сбрасываются в СОНИКС. Школьники строят графики деградации материалов в зависимости от числа витков на орбите.',
    templateData: {
      projectName: 'Орбитальный стенд наноматериалов «КосмоМат»',
      missionCategory: 'materials_propulsion',
      missionGoal:
        'Исследование деградации защитных нанопокрытий под воздействием космических факторов на орбите 500 км.',
      scientificNovelty:
        'Первый школьный миниатюрный стенд натурных испытаний нанокомпозитов на базе кварцевых микровесов.',
      payloadDescription:
        'Наружная открытая панель с держателями образцов, измерительный мост сопротивления, контроллер QCM-генератора частоты и АЦП высокой точности.',
      payloadMassGrams: 510,
      payloadDimensionsMm: { x: 80, y: 80, z: 55 },
      powerConsumptionWatts: { average: 2.1, peak: 3.8 },
      supplyVoltage: '3.3V',
      dataInterface: 'I2C',
      dailyDataVolumeMb: 12,
    },
  },
];

export const INITIAL_SPACE_PI_APPLICATIONS: Record<string, SpacePiApplication> = {
  team_orion_3: {
    id: 'app_orion_3',
    teamId: 'team_orion_3',
    teamName: 'Орион-3',
    projectName: 'Орбитальный узкополосный фотометр свечения атмосферы «Орион-Аврора»',
    satelliteName: 'Орион-3U (Пермь)',
    missionCategory: 'space_weather',
    missionGoal:
      'Регистрация интенсивности ночного свечения верхней атмосферы Земли на длине волны 557.7 нм (атомарный кислород) в высоких и средних широтах и корреляция с геомагнитной активностью.',
    scientificNovelty:
      'Использование компактного кремниевого фотоумножителя SiPM с температурной стабилизацией на платформе наноспутника CubeSat 3U и открытая трансляция данных через станции СОНИКС для школьных радиоклубов.',
    payloadDescription:
      'Светоизолированный оптический тубус с блендой, интерференционный узкополосный фильтр (полоса пропускания 2 нм на центральной длине 557.7 нм), сцинтиллятор/SiPM детектор, 24-битный АЦП и управляющий микроконтроллер на шине I2C. Предусмотрен калибровочный светодиодный источник.',
    platformFormat: 'CubeSat 3U',
    payloadMassGrams: 640,
    payloadDimensionsMm: { x: 85, y: 85, z: 80 },
    powerConsumptionWatts: { average: 3.4, peak: 5.8 },
    supplyVoltage: '5V',
    dataInterface: 'I2C',
    dailyDataVolumeMb: 16.5,
    radioFrequencyMhz: 437.425,
    soniksIntegration: {
      enabled: true,
      openBeaconDesc:
        'Открытый телеметрический маяк USP/AX.25 каждые 60 секунд. Передает усредненную яркость свечения, температуру сенсора и статус стабилизации.',
      amateurCallsign: 'RS51S',
      telemetryFormat: 'USP (Унифицированный протокол SPUTNIX) + AX.25',
    },
    schoolInvolvementPlan:
      'Учащиеся школ Пермского края и других регионов через открытую сеть СОНИКС принимают телеметрию, строят суточные кривые свечения мезосферы и сопоставляют их с наземными наблюдениями магнитометров.',
    teamMembersSummary:
      'Артём Кузнецов (Капитан, 11 кл.), Елена Воронова (Баллистик, 10 кл.), Михаил Седых (Конструктор, 11 кл.), Иван Третьяков (Радиоинженер, 10 кл.), София Лебедева (Разработчик ПН, 11 кл.)',
    mentorSummary:
      'Виктор Андреевич Соколов, к.ф.-м.н., доцент ПГНИУ, научный руководитель школьного астрофизического кружка лицея №1 г. Перми.',
    status: 'ready_for_review',
    spacePiRegistrationCode: 'SPACEPI-2026-PERM-014',
    submittedAt: '2026-06-18 14:30',
    complianceScore: 96,
    checklist: {
      massCompliant: true,
      powerCompliant: true,
      soniksChannelOpen: true,
      cameraOrSensorIncluded: true,
      schoolEngagementDefined: true,
      scientificNoveltyDefined: true,
      curatorConfirmed: true,
    },
    juryNotes: [
      'Проект идеально укладывается в весогабаритный лимит CubeSat 3U (масса ПН 640 г < 1200 г).',
      'Протокол СОНИКС проработан полностью, открытый позывной RS51S согласован с радиолюбительской службой.',
      'Рекомендация: добавить в описание калибровку фотометра по звездам сравнения при пролете теневого участка.',
    ],
    attachedFiles: [
      { name: 'Orion3_Payload_Specification_v2.pdf', size: '4.2 МБ', type: 'application/pdf' },
      { name: 'SiPM_Photometer_Schematics.step', size: '14.1 МБ', type: 'model/step' },
      { name: 'Link_Budget_Soniks_437MHz.xlsx', size: '1.1 МБ', type: 'application/vnd.ms-excel' },
    ],
  },
  team_pulsar_11: {
    id: 'app_pulsar_11',
    teamId: 'team_pulsar_11',
    teamName: 'Пульсар-11',
    projectName: 'Компактный спектрометр солнечных вспышек «Гелиос-П»',
    satelliteName: 'Пульсар-3U (Екатеринбург)',
    missionCategory: 'space_weather',
    missionGoal:
      'Регистрация мягкого рентгеновского излучения солнечных вспышек (1–15 кэВ) на кремниевом дрейфовом детекторе.',
    scientificNovelty:
      'Высокое энергетическое разрешение спектрометра для обнаружения микро-вспышек на начальной фазе развития.',
    payloadDescription:
      'Детектор SDD с бериллиевым окном, термоэлектрическим охладителем Пельтье и многоканальным процессором амплитуд.',
    platformFormat: 'CubeSat 3U',
    payloadMassGrams: 780,
    payloadDimensionsMm: { x: 90, y: 90, z: 90 },
    powerConsumptionWatts: { average: 4.8, peak: 7.2 },
    supplyVoltage: '5V',
    dataInterface: 'SPI',
    dailyDataVolumeMb: 28,
    radioFrequencyMhz: 437.15,
    soniksIntegration: {
      enabled: true,
      openBeaconDesc: 'Сброс предупреждений о вспышках класса M и X в открытом эфире СОНИКС.',
      amateurCallsign: 'RS52S',
      telemetryFormat: 'AX.25 GFSK',
    },
    schoolInvolvementPlan:
      'Оповещение сети школьных обсерваторий о начале вспышки на Солнце за 15 минут до прихода потока частиц.',
    teamMembersSummary:
      'Дмитрий Романов (Капитан), Анна Кравцова (Оптика), Егор Смирнов (Электроника)',
    mentorSummary: 'Игорь Павлович Чернов, ведущий научный сотрудник Института геофизики УрО РАН',
    status: 'submitted_to_spacepi',
    spacePiRegistrationCode: 'SPACEPI-2026-FASIE-7749',
    submittedAt: '2026-06-15 11:20',
    complianceScore: 100,
    checklist: {
      massCompliant: true,
      powerCompliant: true,
      soniksChannelOpen: true,
      cameraOrSensorIncluded: true,
      schoolEngagementDefined: true,
      scientificNoveltyDefined: true,
      curatorConfirmed: true,
    },
    juryNotes: [
      'Заявка зарегистрирована в автоматизированной системе «Фонд-М» и передана на научно-техническую экспертизу Space-π.',
      'Высокий потенциал для победы в грантовом конкурсе.',
    ],
  },
  team_vostok_4: {
    id: 'app_vostok_4',
    teamId: 'team_vostok_4',
    teamName: 'Восток-Квант',
    projectName: 'Микрокамера ДЗЗ высокого разрешения «Квант-Взор»',
    satelliteName: 'Восток-3U (Новосибирск)',
    missionCategory: 'remote_sensing',
    missionGoal:
      'Мультиспектральная съемка гидрологических объектов и водохранилищ Обского бассейна.',
    scientificNovelty:
      'Бортовое сжатие гиперспектральных матриц с использованием волнового сжатия без потери детализации.',
    payloadDescription:
      'Оптическая система типа Ричи-Кретьена, КМОП-матрица с глобальным затвором, блок обработки на Zynq UltraScale.',
    platformFormat: 'CubeSat 3U',
    payloadMassGrams: 990,
    payloadDimensionsMm: { x: 95, y: 95, z: 110 },
    powerConsumptionWatts: { average: 6.2, peak: 11.5 },
    supplyVoltage: '12V',
    dataInterface: 'CAN',
    dailyDataVolumeMb: 42,
    radioFrequencyMhz: 437.85,
    soniksIntegration: {
      enabled: true,
      openBeaconDesc:
        'Открытый маяк со снимками превью (Thumbnails) 160x120 пикселей для школьников.',
      amateurCallsign: 'RS53S',
      telemetryFormat: 'USP SPUTNIX',
    },
    schoolInvolvementPlan:
      'Школы Сибирского региона отслеживают экологическое состояние малых рек и эрозию берегов.',
    teamMembersSummary:
      'Максим Белов (Капитан), Алиса Ковалева (Баллистик), Роман Федоров (Конструктор)',
    mentorSummary: 'Сергей Николаевич Васильев, зав. лабораторией космических систем НГУ',
    status: 'jury_approved',
    spacePiRegistrationCode: 'SPACEPI-2026-NSK-009',
    submittedAt: '2026-06-17 09:45',
    complianceScore: 92,
    checklist: {
      massCompliant: true,
      powerCompliant: true,
      soniksChannelOpen: true,
      cameraOrSensorIncluded: true,
      schoolEngagementDefined: true,
      scientificNoveltyDefined: true,
      curatorConfirmed: true,
    },
    juryNotes: [
      'Одобрено жюри к передаче на официальный сайт spacepi.space.',
      'Рекомендовано уточнить расчет термобаланса оптического объектива в условиях освещенной части витка.',
    ],
  },
};

export function calculateSpacePiCompliance(app: Partial<SpacePiApplication>): {
  score: number;
  checklist: SpacePiChecklist;
  issues: string[];
} {
  const issues: string[] = [];

  // 1. Mass compliance (Payload for 3U should not exceed 1200g)
  const massCompliant =
    typeof app.payloadMassGrams === 'number' &&
    app.payloadMassGrams > 50 &&
    app.payloadMassGrams <= 1200;
  if (!massCompliant) {
    if (typeof app.payloadMassGrams === 'number' && app.payloadMassGrams > 1200) {
      issues.push(
        `Масса полезной нагрузки (${app.payloadMassGrams} г) превышает лимит CubeSat 3U (1200 г)`,
      );
    } else {
      issues.push('Не указана масса полезной нагрузки');
    }
  }

  // 2. Power compliance (average <= 8W, peak <= 15W)
  const powerAverage = app.powerConsumptionWatts?.average ?? 0;
  const powerPeak = app.powerConsumptionWatts?.peak ?? 0;
  const powerCompliant = powerAverage > 0 && powerAverage <= 8 && powerPeak <= 15;
  if (!powerCompliant) {
    if (powerPeak > 15) {
      issues.push(
        `Пиковое потребление (${powerPeak} Вт) превышает допустимое для шины питания (15 Вт)`,
      );
    } else {
      issues.push('Проверьте бюджет энергопотребления полезной нагрузки');
    }
  }

  // 3. Open radio / SONIKS compliance (Mandatory for Space-π)
  const soniksChannelOpen = Boolean(
    app.soniksIntegration?.enabled &&
    app.soniksIntegration?.openBeaconDesc &&
    app.soniksIntegration.openBeaconDesc.trim().length > 15,
  );
  if (!soniksChannelOpen) {
    issues.push(
      'Обязательное требование Space-π: открытый канал передачи данных через сеть станций «СОНИКС»',
    );
  }

  // 4. Sensor or camera included
  const cameraOrSensorIncluded = Boolean(
    app.payloadDescription && app.payloadDescription.trim().length > 30,
  );
  if (!cameraOrSensorIncluded) {
    issues.push('Необходимо детальное техническое описание сенсорного или оптического прибора');
  }

  // 5. School engagement plan
  const schoolEngagementDefined = Boolean(
    app.schoolInvolvementPlan && app.schoolInvolvementPlan.trim().length > 30,
  );
  if (!schoolEngagementDefined) {
    issues.push('Опишите сценарий работы других школьников РФ с научными данными аппарата');
  }

  // 6. Scientific novelty
  const scientificNoveltyDefined = Boolean(
    app.scientificNovelty && app.scientificNovelty.trim().length > 25,
  );
  if (!scientificNoveltyDefined) {
    issues.push('Укажите научную новизну и актуальность эксперимента');
  }

  // 7. Curator confirmed
  const curatorConfirmed = Boolean(app.mentorSummary && app.mentorSummary.trim().length > 10);
  if (!curatorConfirmed) {
    issues.push('Укажите научного руководителя/куратора школьной команды');
  }

  const checklist: SpacePiChecklist = {
    massCompliant,
    powerCompliant,
    soniksChannelOpen,
    cameraOrSensorIncluded,
    schoolEngagementDefined,
    scientificNoveltyDefined,
    curatorConfirmed,
  };

  const trueCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const score = Math.round((trueCount / totalCount) * 100);

  return { score, checklist, issues };
}

export function generateSpacePiRegistrationCode(city: string, _teamName?: string): string {
  const cityCode =
    city
      .slice(0, 4)
      .toUpperCase()
      .replace(/[^A-ZА-Я0-9]/gi, '') || 'RUSSIA';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SPACEPI-2026-${cityCode}-${randomNum}`;
}

export function syncApplicationFromChampionship(
  team: Team,
  submissions: Submission[],
): Partial<SpacePiApplication> {
  const stage1Sub = submissions.find((s) => s.stageId === 'stage_1' && s.teamId === team.id);
  const stage2Sub = submissions.find((s) => s.stageId === 'stage_2' && s.teamId === team.id);
  const stage3Sub = submissions.find((s) => s.stageId === 'stage_3' && s.teamId === team.id);
  const stage4Sub = submissions.find((s) => s.stageId === 'stage_4' && s.teamId === team.id);
  const stage5Sub = submissions.find((s) => s.stageId === 'stage_5' && s.teamId === team.id);

  const membersSummary = team.members.map((m) => `${m.name} (${m.role}, ${m.grade})`).join(', ');

  const powerBudget = stage2Sub?.calculations?.powerGenerationW
    ? Math.min(stage2Sub.calculations.powerGenerationW * 0.4, 6.5)
    : team.cubesatSpecs.powerBudgetWatts * 0.35;

  const orbitContext = stage1Sub
    ? ` Орбита ССО h=${team.cubesatSpecs.orbitAltitudeKm} км, i=${team.cubesatSpecs.inclinationDeg}°.`
    : '';
  const radioContext = stage4Sub?.calculations?.linkMarginDb
    ? ` Запас радиолинии Link Margin = ${stage4Sub.calculations.linkMarginDb} дБ.`
    : '';
  const leopContext = stage5Sub ? ' Программа предстартовой квалификации и LEOP подготовлена.' : '';

  return {
    projectName: stage3Sub?.title || `Орбитальная полезная нагрузка «${team.name}»`,
    satelliteName: `${team.name}-3U (${team.city})`,
    missionGoal:
      (stage3Sub?.summary ||
        `Проведение орбитального физического эксперимента силами школьной команды «${team.name}» лицея/школы ${team.school}.`) +
      orbitContext,
    scientificNovelty:
      (stage3Sub?.details?.slice(0, 240) ||
        'Исследование околоземного космического пространства на высоте 500-550 км с передачей открытых данных в сеть СОНИКС.') +
      leopContext,
    payloadDescription:
      stage3Sub?.details ||
      team.cubesatSpecs.payloadType ||
      'Узкополосный научный сенсорный блок с первичной цифровой фильтрацией данных.',
    platformFormat: 'CubeSat 3U',
    payloadMassGrams: Math.round(team.cubesatSpecs.massKg * 200), // ~680-800g
    payloadDimensionsMm: { x: 85, y: 85, z: 80 },
    powerConsumptionWatts: {
      average: Number(powerBudget.toFixed(1)),
      peak: Number((powerBudget * 1.6).toFixed(1)),
    },
    supplyVoltage: '5V',
    dataInterface: 'I2C',
    dailyDataVolumeMb: 18,
    radioFrequencyMhz: team.cubesatSpecs.radioFreqMhz || 437.425,
    soniksIntegration: {
      enabled: true,
      openBeaconDesc: `Открытый телеметрический маяк команды «${team.name}» на частоте ${team.cubesatSpecs.radioFreqMhz} МГц с протоколом USP / AX.25 для открытой сети станций СОНИКС.${radioContext}`,
      amateurCallsign: 'RS51S',
      telemetryFormat: 'USP SPUTNIX / AX.25',
    },
    schoolInvolvementPlan: `Учащиеся школ ${team.city} и других регионов России смогут принимать пакеты спутника через открытую сеть СОНИКС (sonik.space) и использовать данные в школьных исследовательских проектах.`,
    teamMembersSummary: membersSummary,
    mentorSummary: `${team.mentorName}, ${team.mentorTitle}`,
  };
}
