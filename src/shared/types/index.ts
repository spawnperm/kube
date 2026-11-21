export type RoleAgent = 'registrar' | 'professor' | 'engineer' | 'biochem';

export type UserRole = 'admin' | 'organizer' | 'expert' | 'mentor' | 'participant' | 'guest';

export interface RolePermissionItem {
  id: string;
  name: string;
  description: string;
  category: 'screens' | 'teams' | 'judging' | 'comms' | 'system';
}

export interface UserRoleDefinition {
  id: UserRole;
  name: string; // Название роли, редактируемое администратором
  badgeTitle: string; // Короткое обозначение для бейджей
  description: string;
  colorScheme: 'rose' | 'amber' | 'purple' | 'indigo' | 'cyan' | 'slate';
  icon: string;
  permissions: string[]; // Список id прав
  userCount?: number;
  isSystemRoot?: boolean;
  updatedAt?: string;
}

export interface VoiceMessageData {
  audioUrl?: string;
  durationSec: number;
  transcript: string;
  waveform?: number[];
  recordedAt?: string;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  teamId?: string;
  teamName?: string;
  content: string;
  createdAt: string;
  likes: number;
  likedByMe?: boolean;
  tags?: string[];
  voiceMessage?: VoiceMessageData;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  school: string;
  city: string;
  phone?: string;
  photoConsent: boolean;
  avatarUrl?: string;
  bio?: string;
  statusMessage?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  xp: number;
  level: number;
  rankTitle: string;
  energyCrystals: number;
  streakDays: number;
  lastDailyClaimDate?: string;
  badges: string[];
  socialPosts: SocialPost[];
  socialLinks?: {
    telegram?: string;
    vk?: string;
    github?: string;
    website?: string;
  };
}

export type CrewRoleType =
  | 'captain'
  | 'commander'
  | 'navigator'
  | 'medic'
  | 'biologist'
  | 'translator'
  | 'marketer'
  | 'physicist'
  | 'chemist'
  | 'engineer'
  | 'flight_mechanic'
  | 'mathematician'
  | 'designer'
  | (string & {});

export interface CrewRoleDefinition {
  id: string;
  key: string;
  title: string;
  category:
    | 'command'
    | 'exact_sciences'
    | 'humanities'
    | 'medicine'
    | 'commercial'
    | 'engineering'
    | 'custom';
  categoryLabel: string;
  shortDesc: string;
  defaultDiscipline: string;
  isPredefined: boolean;
}

export interface RoleSubtask {
  id: string;
  role: CrewRoleType;
  roleTitle: string;
  title: string;
  description: string;
  discipline: string;
  wikiQuery?: string;
  completed: boolean;
  assignedStudentName?: string;
}

export interface MemberReflection {
  memberName: string;
  role: CrewRoleType;
  roleTitle: string;
  text: string;
}

export interface TeamMember {
  id: string;
  name: string;
  grade: number;
  gradeText?: string;
  email: string;
  role: CrewRoleType;
  assignedRole?: CrewRoleType;
  roleTitle?: string;
  discipline?:
    | 'Физика'
    | 'Химия'
    | 'Биология'
    | 'Космонавтика'
    | 'Математика'
    | 'Дизайн'
    | 'Медицина'
    | 'Инженерия';
  status: 'active' | 'pending_approval' | 'rejected';
  registeredByMentorId?: string;
  approvedByOrganizerId?: string;
  registeredAt?: string;
}

export type ScienceDiscipline = 'physics' | 'chemistry' | 'biology' | 'ballistics' | 'electronics';

export interface CubeSatBlueprint {
  id: string;
  title: string;
  discipline: ScienceDiscipline;
  disciplineLabel: string;
  viewType: 'isometric' | 'external' | 'cross_section' | 'exploded';
  description: string;
  dimensions: string;
  specifications: string[];
  systemType: 'chassis' | 'payload_sensor' | 'solar_deploy' | 'optical_tube' | 'battery_pack';
}

export interface CubeSatFlowchart {
  id: string;
  title: string;
  discipline: ScienceDiscipline;
  disciplineLabel: string;
  description: string;
  steps: { label: string; subtext: string }[];
}

export interface CubeSatDiagram {
  id: string;
  title: string;
  discipline: ScienceDiscipline;
  disciplineLabel: string;
  description: string;
  chartType: 'orbit_cyclogram' | 'thermal_gradient' | 'solar_flux' | 'mass_breakdown';
  keyValues: { label: string; value: string; unit: string }[];
}

export interface CubeSatFormula {
  id: string;
  title: string;
  discipline: ScienceDiscipline;
  disciplineLabel: string;
  latex: string;
  description: string;
  calculationResult: string;
}

export interface CubeSatMissionPassport {
  cubesatName: string;
  cubesatFormat: '1U' | '2U' | '3U' | '6U';
  scientificGoal: string;
  appearanceDescription: string;
  internalStructure: string;
  purpose: string;
  disciplinesCovered: ScienceDiscipline[];
  blueprints: CubeSatBlueprint[];
  flowcharts: CubeSatFlowchart[];
  diagrams: CubeSatDiagram[];
  formulas: CubeSatFormula[];
  completedStages: {
    stageId: string;
    title: string;
    description: string;
    completed: boolean;
    approvedByEarthMCC?: boolean;
  }[];
}

export interface Team {
  id: string;
  name: string;
  shipName?: string;
  cubesatName: string;
  cubesatFormat: '1U' | '2U' | '3U' | '6U';
  shipCallsign?: string;
  school: string;
  city: string;
  mentorName: string;
  mentorEmail: string;
  members: TeamMember[];
  selectedTaskId?: string;
  selectedTaskTitle?: string;
  currentStage:
    | 'registration'
    | 'quiz_completed'
    | 'case_selected'
    | 'slides_drafted'
    | 'submitted'
    | 'evaluated'
    | 'finalist';
  submissionDeadline: string;
  slides: [ProjectSlide, ProjectSlide, ProjectSlide];
  templateData: ProjectTemplateData;
  missionPassport?: CubeSatMissionPassport;
  score?: number;
  expertCount?: number;
  groupPosts: GroupPost[];
  fuelPercent?: number; // 0-100% determined by starter quiz
  starterQuizPassed?: boolean;
  roleSubtasks?: RoleSubtask[];
  teamPhotoUrl?: string;
  memberReflections?: MemberReflection[];
}

export interface CrmNotificationEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: string;
  teamName: string;
  subject: string;
  preview: string;
  body: string;
  sentAt: string;
  senderName: string;
  senderPosition: string;
  stageTitle?: string;
  isRead: boolean;
  type: 'stage_announcement' | 'quiz_alert' | 'defense_invite' | 'system';
}

export interface KubikDeadlineAlert {
  id: string;
  stageId: string;
  stageNumber: number;
  stageTitle: string;
  deadlineTime: string;
  alertLevel: 'info' | 'reminder' | 'warning' | 'urgent';
  kubikRole: 'registrar' | 'professor' | 'engineer';
  title: string;
  message: string;
  actionHint: string;
  timestamp: string;
  isRead: boolean;
  soundToPlay?: 'alert' | 'success' | 'warning';
}

export interface CrmChampionshipStage {
  id: string;
  number: number;
  title: string;
  dates: string;
  status: 'past' | 'current' | 'future' | 'urgent';
  deadlineTime: string;
  isoDeadline?: string;
  description: string;
  requiredDeliverables: string[];
  notificationSent?: boolean;
  responsibleMCC?: string;
  progressPercent?: number;
  kubikAutoAlertsEnabled?: boolean;
  alertCount?: number;
}

export interface ProjectSlide {
  slideNumber: 1 | 2 | 3;
  title: string;
  subtitle: string;
  content: string;
  formulaLatex?: string;
  calculations?: string;
  diagramType?: 'orbit' | 'cubesat_subsystems' | 'thermal_balance' | 'power_budget';
  subsystemsData?: { name: string; power: string; mass: string; status: string }[];
  updatedAt: string;
}

export interface ProjectTemplateData {
  scientificGoal: string;
  orbitParameters: {
    altitudeKm: number;
    inclinationDeg: number;
    eccentricity: number;
    periodMin: number;
  };
  physicalModel: string;
  formulaeDerivation: string;
  payloadDescription: string;
  powerBudgetWatts: number;
  batteryCapacityWattHours: number;
  radioFrequencyMhz: number;
  conclusions: string;
}

export interface CaseTaskRoleDetail {
  role: CrewRoleType;
  roleTitle: string;
  taskTitle: string;
  taskDescription: string;
  scientificDeliverable: string;
  socialCommunityPostRequirement: string;
}

export interface CaseTaskTheoreticalPart {
  formulas: { title: string; latex: string; description: string }[];
  diagramDescription: string;
  phenomenaDescription: string;
}

export interface CaseTaskPracticalPart {
  missionGoal: string;
  socialCommunityGoal: string;
  requiredPostType: string;
  experimentsProtocol: string;
}

export interface CaseTaskCubesatSpecs {
  format: '1U' | '2U' | '3U' | '6U' | '12U';
  orbitType: string;
  altitudeKm: number;
  inclinationDeg: number;
  primaryPayload: string;
  powerConsumptionWatts: number;
}

export interface CaseTask {
  id: string;
  cardNumber: string;
  title: string;
  category:
    | 'ballistics'
    | 'thermodynamics'
    | 'power'
    | 'payload'
    | 'biochem'
    | 'navigation'
    | 'optics'
    | 'propulsion'
    | 'telecom'
    | 'biology'
    | string;
  categoryLabel: string;
  difficulty: 'Базовый' | 'Продвинутый' | 'Олимпиадный';
  description: string;
  physicsKeywords: string[];
  keyFormulas: string[];
  approved: boolean;
  takenByTeamId?: string;
  takenByTeamName?: string;
  schoolGradeRange: string;
  grandMissionGoal?: string;
  cubesatSpecs?: CaseTaskCubesatSpecs;
  theoreticalPart?: CaseTaskTheoreticalPart;
  practicalPart?: CaseTaskPracticalPart;
  roleAssignments?: Record<string, CaseTaskRoleDetail>;
  practicalCommunityMission?: string;
}

export interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  formulaReference?: string;
}

export interface QuizAttempt {
  taskId: string;
  answers: Record<string, number>;
  score: number;
  total: number;
  completedAt: string;
}

export interface WikiArticle {
  id: string;
  slug: string;
  title: string;
  subject: 'Физика' | 'Химия' | 'Биология' | 'Инженерия CubeSat';
  schoolGrade: '8-9 класс' | '10-11 класс' | '9-11 класс' | 'Углубленный';
  readingTimeMin: number;
  summary: string;
  markdownContent: string;
  mediaUrls: { title: string; type: 'scheme' | 'chart' | 'photo'; url: string }[];
  keyFormulas: string[];
  sourceReference: string;
}

export interface GroupPost {
  id: string;
  authorName: string;
  authorRole: string;
  type: 'update' | 'question' | 'file' | 'slide' | 'result' | 'voice';
  title: string;
  content: string;
  createdAt: string;
  likes: number;
  commentsCount: number;
  voiceMessage?: VoiceMessageData;
}

export interface PhotoItem {
  id: string;
  teamId?: string;
  teamName?: string;
  uploaderName: string;
  uploaderRole: 'mentor' | 'organizer' | 'admin';
  url: string;
  caption: string;
  takenAt: string;
  status: 'published' | 'draft' | 'pending';
}

export interface WaitlistEntry {
  id: string;
  teamName: string;
  mentorName: string;
  mentorEmail: string;
  school: string;
  position: number;
  status: 'waiting' | 'invited' | 'accepted' | 'expired';
  expiresAt: string;
}

export interface ExpertEvaluation {
  id: string;
  teamId: string;
  shipName?: string;
  expertId: string;
  expertName: string;
  organization?: string;
  stageId?: string;
  stageTitle?: string;
  criteriaScores: {
    physicsRigor: number; // 1-5
    engineeringFeasibility: number; // 1-5
    presentationClarity: number; // 1-5
    defenseQuality: number; // 1-5
    roleDistributionScore?: number; // 1-5
  };
  totalAverage: number;
  totalScore?: number;
  comment: string;
  timestamp: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardCrystals: number;
  completed: boolean;
}

export interface ChampionshipStage {
  id: string;
  number: number;
  title: string;
  dates: string;
  status: 'past' | 'current' | 'future';
  deadlineTime: string;
  description: string;
}

export interface ChampionshipNews {
  id: string;
  title: string;
  content: string;
  category: 'announcement' | 'event' | 'navigation' | 'deadline' | 'results';
  categoryLabel?: string;
  publishedAt: string;
  authorName: string;
  authorRole: string;
  locationBadge?: string;
  pinned?: boolean;
  attachmentName?: string;
  targetStageId?: string;
}

export interface VenueMapZone {
  id: string;
  name: string;
  shortName: string;
  floor: string;
  room: string;
  description: string;
  status: 'open' | 'active_now' | 'restricted';
  curator: string;
  curatorContact?: string;
  coordinates: { x: number; y: number }; // percentage on map (0-100)
  color: string;
  features: string[];
}

export interface RouteSheetItem {
  id: string;
  stepNumber: number;
  title: string;
  timeSlot: string;
  location: string;
  zoneId: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  checkRequirements: string[];
}

export interface OfficeFileAttachment {
  id: string;
  name: string;
  sizeKb: number;
  extension: 'docx' | 'xlsx' | 'pdf' | 'pptx' | 'txt' | 'csv';
  uploadedAt: string;
  uploaderName: string;
  uploaderRole: string;
  teamId: string;
  url?: string;
  category: 'calculations' | 'report' | 'presentation' | 'specs';
}

export interface MediaAttachment {
  id: string;
  title: string;
  type: 'photo' | 'video';
  url: string;
  uploadedAt: string;
  uploaderName: string;
  teamId: string;
  caption?: string;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent';
  senderName: string;
  targetTeamId?: string; // undefined = broadcast to all
  targetTeamName?: string;
  sentAt: string;
  stageName?: string;
}
