import { UserRole, RolePermissionItem, UserRoleDefinition } from '@/src/shared/types';

export const ROLE_PERMISSIONS_CATALOG: RolePermissionItem[] = [
  // 1. Screens & Navigation
  {
    id: 'access_admin',
    name: 'Доступ к терминалу Координатора ЦУП',
    description:
      'Полный доступ к экрану технического администратора (мониторинг, имперсонация, бэкапы, RBAC)',
    category: 'screens',
  },
  {
    id: 'access_mcc',
    name: 'Доступ к пульту управления полетами (ЦУП)',
    description:
      'Интерфейс организаторов, реестр 16 команд, диспетчер этапов и рассылка оповещений',
    category: 'screens',
  },
  {
    id: 'access_inspectors',
    name: 'Доступ к пульту оценивания (Жюри)',
    description: 'Инспекция кораблей, 3-минутный таймер защиты и выставление оценок по 4 критериям',
    category: 'screens',
  },
  {
    id: 'access_ship',
    name: 'Доступ к бортовому пульту CubeSat',
    description:
      'Управление спутником, 3 слайда проекта, бортовой чат и файловое хранилище экипажа',
    category: 'screens',
  },
  {
    id: 'access_starmap',
    name: 'Доступ к звездной карте и витрине',
    description:
      'Публичная звездная карта 16 кораблей, новости чемпионата, карта площадки и маршруты',
    category: 'screens',
  },
  {
    id: 'access_quiz',
    name: 'Доступ к Орбитальному экзамену и квизам',
    description: 'Прохождение тестов и квизов с Лешим, заправка баков и заработок энергокристаллов',
    category: 'screens',
  },
  {
    id: 'access_wiki',
    name: 'Доступ к базе знаний LLM-Wiki',
    description:
      'Чтение и поиск по фундаментальным статьям космической физики, баллистики и CubeSat',
    category: 'screens',
  },

  // 2. Teams, Rosters & Requests
  {
    id: 'manage_teams_crm',
    name: 'Управление реестром команд в CRM',
    description: 'Создание, редактирование реквизитов, позывных и удаление карточек команд школ',
    category: 'teams',
  },
  {
    id: 'approve_registrations',
    name: 'Модерация заявок и участников',
    description: 'Одобрение и отклонение регистрационных анкет школьников и наставников',
    category: 'teams',
  },
  {
    id: 'edit_crew_roster',
    name: 'Редактирование состава экипажа',
    description:
      'Назначение бортовых ролей (физик, конструктор, биолог), добавление и удаление членов',
    category: 'teams',
  },
  {
    id: 'edit_ship_name',
    name: 'Смена названия и позывного корабля',
    description: 'Право командира на переименование космического аппарата в реестре ЦУП',
    category: 'teams',
  },
  {
    id: 'manage_case_selection',
    name: 'Выбор и смена кейсового задания',
    description: 'Утверждение научно-инженерного кейса из каталога заданий чемпионата',
    category: 'teams',
  },

  // 3. Judging & Protocols
  {
    id: 'evaluate_ships',
    name: 'Оценивание защит и выставление баллов',
    description:
      'Заполнение экспертного листа по 4 критериям регламента (актуальность, конструкция, софт, защита)',
    category: 'judging',
  },
  {
    id: 'start_evaluation_timer',
    name: 'Управление таймером защиты (3:00)',
    description: 'Запуск, пауза и сброс регламентного таймера питча перед комиссией',
    category: 'judging',
  },
  {
    id: 'view_expert_sheets',
    name: 'Просмотр сводных ведомостей оценок',
    description: 'Доступ к рейтинговой таблице и протоколам всех экспертных групп',
    category: 'judging',
  },
  {
    id: 'sign_evaluation_protocol',
    name: 'Электронное подписание протоколов',
    description: 'Утверждение финального распределения мест и номинаций чемпионата',
    category: 'judging',
  },

  // 4. Comms, News & Files
  {
    id: 'publish_news',
    name: 'Публикация официальных новостей',
    description: 'Создание постов в ленту чемпионата с фотографиями и тегами',
    category: 'comms',
  },
  {
    id: 'broadcast_alerts',
    name: 'Экстренные оповещения экипажей (ЦУП Alerts)',
    description: 'Мгновенная рассылка уведомлений на экраны всех 16 космических аппаратов',
    category: 'comms',
  },
  {
    id: 'post_team_chat',
    name: 'Отправка сообщений в бортовой чат',
    description: 'Публикация текстовых и голосовых заметок в бортовой журнал полета',
    category: 'comms',
  },
  {
    id: 'upload_documents',
    name: 'Загрузка проектных файлов и фото',
    description: 'Прикрепление чертежей, презентаций DOCX/PDF и фотоотчетов сборки спутника',
    category: 'comms',
  },

  // 5. System Config & AI
  {
    id: 'manage_roles',
    name: 'Управление ролями и матрицей прав (RBAC)',
    description: 'Редактирование названий ролей, описаний и назначение прав доступа',
    category: 'system',
  },
  {
    id: 'configure_ai_models',
    name: 'Настройка AI-штурмана и моделей Gemini',
    description: 'Выбор нейросетевых моделей, лимитов памяти и параметров генерации',
    category: 'system',
  },
  {
    id: 'export_database_dumps',
    name: 'Экспорт дампов базы данных',
    description: 'Выгрузка полного JSON-снимка состояния портала для архивации',
    category: 'system',
  },
  {
    id: 'impersonate_users',
    name: 'Имперсонация пользователей (Вход под аккаунтом)',
    description: 'Переключение в режим инкогнито под профилем любого наставника или эксперта',
    category: 'system',
  },
];

export const DEFAULT_ROLE_DEFINITIONS: Record<UserRole, UserRoleDefinition> = {
  admin: {
    id: 'admin',
    name: 'Координатор ЦУП (Технический администратор)',
    badgeTitle: 'Администратор',
    description:
      'Полный доступ ко всей инфраструктуре, серверам, реестрам, правке ролей и шлюзу Gemini AI.',
    colorScheme: 'rose',
    icon: '🛡️',
    isSystemRoot: true,
    permissions: ROLE_PERMISSIONS_CATALOG.map((p) => p.id), // All permissions
  },
  organizer: {
    id: 'organizer',
    name: 'Организатор чемпионата (Оператор ЦУП)',
    badgeTitle: 'Организатор',
    description:
      'Управление регламентом, CRM команд, модерация заявок, публикация новостей и рассылка оповещений.',
    colorScheme: 'amber',
    icon: '🛰️',
    permissions: [
      'access_mcc',
      'access_inspectors',
      'access_ship',
      'access_starmap',
      'access_quiz',
      'access_wiki',
      'manage_teams_crm',
      'approve_registrations',
      'view_expert_sheets',
      'publish_news',
      'broadcast_alerts',
      'post_team_chat',
      'upload_documents',
    ],
  },
  expert: {
    id: 'expert',
    name: 'Эксперт комиссии (Член жюри)',
    badgeTitle: 'Эксперт / Жюри',
    description:
      'Инспекция инженерных решений спутников, таймер защит, оценка критериев и выставление баллов.',
    colorScheme: 'purple',
    icon: '⚖️',
    permissions: [
      'access_inspectors',
      'access_starmap',
      'access_quiz',
      'access_wiki',
      'evaluate_ships',
      'start_evaluation_timer',
      'view_expert_sheets',
      'sign_evaluation_protocol',
    ],
  },
  mentor: {
    id: 'mentor',
    name: 'Наставник команды (Капитан корабля)',
    badgeTitle: 'Капитан / Наставник',
    description:
      'Куратор школьного экипажа: подготовка презентации из 3 слайдов, загрузка файлов, выбор кейса.',
    colorScheme: 'indigo',
    icon: '👨‍✈️',
    permissions: [
      'access_ship',
      'access_starmap',
      'access_quiz',
      'access_wiki',
      'edit_crew_roster',
      'edit_ship_name',
      'manage_case_selection',
      'post_team_chat',
      'upload_documents',
    ],
  },
  participant: {
    id: 'participant',
    name: 'Член экипажа (Участник чемпионата)',
    badgeTitle: 'Экипаж',
    description:
      'Школьник-участник: разработка CubeSat, участие в орбитальном квизе, бортовой чат с Лешим.',
    colorScheme: 'cyan',
    icon: '🚀',
    permissions: [
      'access_ship',
      'access_starmap',
      'access_quiz',
      'access_wiki',
      'post_team_chat',
      'upload_documents',
    ],
  },
  guest: {
    id: 'guest',
    name: 'Гость чемпионата (Зритель)',
    badgeTitle: 'Гость / Зритель',
    description:
      'Пассажир Космопорта: просмотр интерактивной звездной карты, расписания зон и участие в открытых квизах.',
    colorScheme: 'slate',
    icon: '🌐',
    permissions: ['access_starmap', 'access_quiz', 'access_wiki'],
  },
};

const STORAGE_KEY = 'kosmoport_role_definitions_v1';

export class RoleService {
  private static instance: RoleService;
  private rolesCache: Record<UserRole, UserRoleDefinition> | null = null;
  private listeners: Array<() => void> = [];

  public static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.rolesCache = null;
          this.notify();
        }
      });
    }
  }

  public getRoles(): Record<UserRole, UserRoleDefinition> {
    if (this.rolesCache) {
      return this.rolesCache;
    }

    if (typeof window === 'undefined') {
      return DEFAULT_ROLE_DEFINITIONS;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all 6 roles exist
        const result: Record<UserRole, UserRoleDefinition> = { ...DEFAULT_ROLE_DEFINITIONS };
        (Object.keys(DEFAULT_ROLE_DEFINITIONS) as UserRole[]).forEach((roleKey) => {
          if (parsed[roleKey]) {
            result[roleKey] = {
              ...DEFAULT_ROLE_DEFINITIONS[roleKey],
              ...parsed[roleKey],
              id: roleKey,
              // Keep admin system root protection
              permissions:
                roleKey === 'admin'
                  ? Array.isArray(parsed[roleKey].permissions)
                    ? parsed[roleKey].permissions
                    : DEFAULT_ROLE_DEFINITIONS.admin.permissions
                  : Array.isArray(parsed[roleKey].permissions)
                    ? parsed[roleKey].permissions
                    : DEFAULT_ROLE_DEFINITIONS[roleKey].permissions,
            };
          }
        });
        this.rolesCache = result;
        return result;
      }
    } catch (e) {
      console.warn('Failed to parse saved role definitions:', e);
    }

    this.rolesCache = { ...DEFAULT_ROLE_DEFINITIONS };
    return this.rolesCache;
  }

  public getRole(role: UserRole): UserRoleDefinition {
    const roles = this.getRoles();
    return roles[role] || DEFAULT_ROLE_DEFINITIONS[role] || DEFAULT_ROLE_DEFINITIONS.guest;
  }

  public getRoleTitle(role: UserRole): string {
    return this.getRole(role).name;
  }

  public getRoleBadge(role: UserRole): string {
    return this.getRole(role).badgeTitle;
  }

  public hasPermission(role: UserRole, permissionId: string): boolean {
    const roleDef = this.getRole(role);
    if (!roleDef) return false;
    return roleDef.permissions.includes(permissionId);
  }

  public saveRoles(updatedRoles: Record<UserRole, UserRoleDefinition>): void {
    this.rolesCache = { ...updatedRoles };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoles));
      } catch (e) {
        console.error('Failed to save role definitions to localStorage:', e);
      }
    }
    this.notify();
  }

  public updateRole(roleKey: UserRole, partial: Partial<UserRoleDefinition>): void {
    const current = this.getRoles();
    const updated = {
      ...current,
      [roleKey]: {
        ...current[roleKey],
        ...partial,
        updatedAt: new Date().toISOString(),
      },
    };
    this.saveRoles(updated);
  }

  public resetToDefaults(): Record<UserRole, UserRoleDefinition> {
    this.rolesCache = { ...DEFAULT_ROLE_DEFINITIONS };
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
    }
    this.notify();
    return this.rolesCache;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    });
  }
}

export const roleService = RoleService.getInstance();
