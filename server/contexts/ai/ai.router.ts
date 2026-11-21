import { Router } from 'express';
import { chatWithGemini } from './gemini.client';
import { AGENT_SYSTEM_PROMPTS, fallbackFor, generateQuizForKnowledge } from './knowledge';
import { chatSchema, quizGenerateSchema } from '../../shared/validation/schemas';
import { aiRateLimit } from '../../shared/middleware/rateLimiter';
import { logger } from '../../logger';

export function assistantRouter(): Router {
  const router = Router();

  router.post('/api/assistant/chat', aiRateLimit, async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request' });
    }

    const { message, roleAgent = 'professor', teamContext } = parsed.data;
    const selectedRole = AGENT_SYSTEM_PROMPTS[roleAgent] ? roleAgent : 'professor';
    const systemInstruction = AGENT_SYSTEM_PROMPTS[selectedRole];

    try {
      const promptContext = teamContext
        ? `\n[Контекст команды: Задача "${teamContext.taskTitle || 'не выбрана'}", Проект "${teamContext.projectName || 'Без названия'}", Шаг: ${teamContext.step || 'Подготовка'}]\nВопрос участника: ${message}`
        : message;

      const replyText = await chatWithGemini({
        message: promptContext,
        systemInstruction,
        temperature: 0.7,
      });

      return res.json({
        reply: replyText,
        roleAgent: selectedRole,
        source: 'gemini-ai',
      });
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : err, roleAgent },
        'Gemini API call failed, falling back to local orchestrator',
      );
    }

    return res.json({
      reply: fallbackFor(message, selectedRole),
      roleAgent: selectedRole,
      source: 'local-knowledge',
    });
  });

  router.post('/api/assistant/quiz', aiRateLimit, async (req, res) => {
    const parsed = quizGenerateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request' });
    }

    const {
      topic = '',
      articleSlug = '',
      grade = '10-11 класс',
      roleAgent = 'professor',
      count = 5,
    } = parsed.data;
    const selectedRole = AGENT_SYSTEM_PROMPTS[roleAgent] ? roleAgent : 'professor';

    try {
      const systemInstruction = `${AGENT_SYSTEM_PROMPTS[selectedRole]}
Ты генерируешь качественный космический физический тест-квиз для школьников (${grade}) по материалам LLM-Wiki КОСМОПОРТ.
Требования:
1. Выведи СТРОГО JSON-массив без markdown-оберток (без \`\`\`json).
2. Ровно ${count} вопросов.
3. Каждый элемент имеет структуру:
{
  "id": "ai-q-1",
  "category": "physics",
  "topicTitle": "${topic || 'Космическая физика'}",
  "articleSlug": "${articleSlug || 'gravity-and-cosmic-velocities'}",
  "question": "текст вопроса с LaTeX формулами $...$",
  "options": ["вариант 1", "вариант 2", "вариант 3", "вариант 4"],
  "correctIndex": 0,
  "explanation": "подробный физический разбор с формулами",
  "formulaReference": "ключевая формула в LaTeX",
  "mascotHint": "короткая ободряющая подсказка от Кубика",
  "difficulty": "intermediate"
}`;

      const prompt = `Сгенерируй ${count} тестовых вопросов по теме: "${topic || articleSlug || 'Космическая физика и баллистика'}". Уровень сложности: ${grade}. Вариант ответа с индексом correctIndex должен быть строго правильным.`;

      const replyText = await chatWithGemini({
        message: prompt,
        systemInstruction,
        temperature: 0.4,
      });

      const cleaned = replyText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const parsedQuestions = JSON.parse(cleaned);

      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        return res.json({
          questions: parsedQuestions,
          source: 'gemini-ai',
          roleAgent: selectedRole,
          topic: topic || articleSlug,
        });
      }
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : err },
        'Gemini quiz generation failed, using local knowledge bank',
      );
    }

    const fallbackQuestions = generateQuizForKnowledge({
      topic,
      articleSlug,
      grade,
      count,
    });

    return res.json({
      questions: fallbackQuestions,
      source: 'local-knowledge',
      roleAgent: selectedRole,
      topic: topic || articleSlug,
    });
  });

  router.post('/api/cubesat/generate-assembly-scheme', aiRateLimit, async (req, res) => {
    const {
      format = '3U',
      payloadType = 'Оптический сенсор дистанционного зондирования Земли',
      missionGoal = 'Мониторинг атмосферы и радиомаяк',
    } = req.body;

    const validatedFormat = (['1U', '2U', '3U'].includes(format) ? format : '3U') as
      '1U' | '2U' | '3U';

    const systemInstruction = `Ты — ведущий инженер-конструктор малых космических аппаратов CubeSat формата 1U, 2U, 3U.
Сгенерируй детальную сборочную схему внутреннего устройства CubeSat на русском языке в строгом JSON-формате (без markdown, без \`\`\`json).
Структура JSON:
{
  "format": "${validatedFormat}",
  "title": "Сборочная схема CubeSat ${validatedFormat}",
  "missionGoal": "${missionGoal}",
  "totalMassG": число,
  "maxAllowedMassG": число,
  "totalPowerW": число,
  "solarGenerationW": число,
  "centerOfMass": {"x": 0, "y": число, "z": 0},
  "subsystems": [
    {
      "id": "payload",
      "name": "Название отсека полезной нагрузки",
      "category": "Научная аппаратура",
      "massG": число,
      "powerW": число,
      "specs": "Описание компонентов и размещения",
      "positionLayer": 1,
      "status": "nominal"
    },
    ...
  ],
  "assemblySteps": [
    "Шаг 1: Монтаж нижнего фланца и батарейного отсека EPS",
    ...
  ],
  "aiRecommendations": [
    "Рекомендация по термобалансу и теплоотводу",
    "Рекомендация по балансировке центра масс",
    "Рекомендация по ЭМС и развязке радиочастот"
  ]
}`;

    try {
      const prompt = `Сгенерируй инженерную схему сборки CubeSat ${validatedFormat} с целевой нагрузкой: "${payloadType}". Учти габариты стандарта CalPoly CubeSat Design Specification (CDS), лимит массы (1U <= 1330г, 2U <= 2660г, 3U <= 4000г), требования к шине PC/104 и тепловому балансу на ССО.`;

      const replyText = await chatWithGemini({
        message: prompt,
        systemInstruction,
        temperature: 0.3,
      });

      const cleaned = replyText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const scheme = JSON.parse(cleaned);

      if (scheme && scheme.subsystems && Array.isArray(scheme.subsystems)) {
        return res.json({
          scheme,
          source: 'gemini-ai',
        });
      }
    } catch (err) {
      logger.warn(
        { err: err instanceof Error ? err.message : err },
        'Gemini assembly scheme generation failed, using local engineering engine',
      );
    }

    // High fidelity fallback scheme
    const is1U = validatedFormat === '1U';
    const is2U = validatedFormat === '2U';

    const fallbackScheme = {
      format: validatedFormat,
      title: `Инженерная схема сборки CubeSat ${validatedFormat}`,
      missionGoal: missionGoal || 'Научно-образовательная миссия на солнечно-синхронной орбите',
      totalMassG: is1U ? 1120 : is2U ? 2280 : 3410,
      maxAllowedMassG: is1U ? 1330 : is2U ? 2660 : 4000,
      totalPowerW: is1U ? 6.2 : is2U ? 11.8 : 17.5,
      solarGenerationW: is1U ? 7.5 : is2U ? 14.2 : 22.0,
      centerOfMass: { x: 0, y: is1U ? 0.02 : is2U ? 0.05 : 0.08, z: 0 },
      subsystems: [
        {
          id: 'payload',
          name: `Отсек полезной нагрузки (${payloadType})`,
          category: 'Научная аппаратура',
          massG: is1U ? 340 : is2U ? 780 : 1150,
          powerW: is1U ? 2.4 : is2U ? 3.8 : 4.8,
          specs: `${payloadType} в виброзащищенном модуле верхней секции +Z с прецизионной оптической юстировкой`,
          positionLayer: 1,
          status: 'nominal',
        },
        {
          id: 'obc',
          name: 'Бортовой вычислительный комплекс (OBC)',
          category: 'Вычислительная система',
          massG: 140,
          powerW: 0.8,
          specs:
            'Двухъядерный процессор Cortex-M7 480 МГц, радиационно-стойкая MRAM, интерфейсы CAN 2.0B / SPI / SpaceWire',
          positionLayer: 2,
          status: 'nominal',
        },
        {
          id: 'com',
          name: 'Радиопередающий модуль & Антенна (COM/RF)',
          category: 'Космическая связь',
          massG: 190,
          powerW: 2.2,
          specs:
            'Трансивер AX.25 / GFSK 437.425 МГц, развертываемая рулеточная 4-элементная антенна Cu-Be',
          positionLayer: 3,
          status: 'nominal',
        },
        {
          id: 'adcs',
          name: 'Система ориентации и стабилизации (ADCS)',
          category: 'Навигация и ориентация',
          massG: is1U ? 180 : is2U ? 320 : 420,
          powerW: is1U ? 1.4 : is2U ? 2.6 : 3.4,
          specs:
            '3-осевой блок маховиков с магнитными катушками (магнеторкерами) и звездным датчиком',
          positionLayer: 4,
          status: 'nominal',
        },
        {
          id: 'eps',
          name: 'Система электропитания и батарейный блок (EPS)',
          category: 'Энергоснабжение',
          massG: is1U ? 270 : is2U ? 480 : 780,
          powerW: is1U ? 0.6 : is2U ? 1.0 : 1.5,
          specs:
            'Контроллер MPPT, LiFePO4 аккумуляторы (4S), резервированная шина питания 3.3В, 5В и батарейная шина',
          positionLayer: 5,
          status: 'nominal',
        },
        {
          id: 'chassis',
          name: 'Силовое несущее шасси (Structure Rails)',
          category: 'Конструкция',
          massG: is1U ? 240 : is2U ? 380 : 540,
          powerW: 0.0,
          specs:
            'Фрезерованный каркас из сплава Al 6061-T6 с твердым анодированием, стандарт пускового контейнера P-POD',
          positionLayer: 6,
          status: 'nominal',
        },
      ],
      assemblySteps: [
        'Шаг 1: Установка базовых направляющих рельсов шасси и донного шпангоута',
        'Шаг 2: Монтаж батарейного модуля EPS и подключение интерфейсной шины PC/104',
        'Шаг 3: Интеграция 3-осевого блока маховиков и магнеторкеров системы ADCS',
        'Шаг 4: Установка бортового компьютера OBC и калибровка датчиков телеметрии',
        'Шаг 5: Монтаж УКВ трансивера COM и укладка механизма сброса антенн',
        'Шаг 6: Интеграция целевой полезной нагрузки в верхний отсек +Z',
        'Шаг 7: Установка боковых фотоэлектрических панелей GaAs и финальная центровка аппарата',
      ],
      aiRecommendations: [
        `Запас по массе составляет ${Math.round(((is1U ? 1330 - 1120 : is2U ? 2660 - 2280 : 4000 - 3410) / (is1U ? 1330 : is2U ? 2660 : 4000)) * 100)}%, что соответствует жестким требованиям РКК «Энергия» и Роскосмос`,
        'Центр масс смещен вдоль строительной оси Y в пределах допустимого коридора ±15 мм от геометрического центра',
        'Рекомендуется тепловая развязка между горячим блоком передатчика COM и оптическим сенсором полезной нагрузки',
      ],
    };

    return res.json({
      scheme: fallbackScheme,
      source: 'local-knowledge',
    });
  });

  return router;
}
