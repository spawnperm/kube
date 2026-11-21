export type UserRole = 'participant' | 'jury' | 'mentor' | 'organizer' | 'admin' | 'expert';

export type StageId = 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4' | 'stage_5';

export type SubmissionStatus =
  'not_started' | 'draft' | 'submitted' | 'under_review' | 'approved' | 'needs_revision';

export interface TeamMember {
  id: string;
  name: string;
  role:
    | 'Капитан'
    | 'Баллистик'
    | 'Инженер-конструктор'
    | 'Радиоинженер'
    | 'Разработчик ПН'
    | 'Программист бортового ПО'
    | 'Исследователь'
    | 'Инженер'
    | 'Биолог'
    | 'Навигатор'
    | 'Астрофизик'
    | 'Военный'
    | 'Картограф'
    | 'Историк'
    | 'Архивариус'
    | 'Переводчик'
    | 'Журналист'
    | 'Программист'
    | 'Метеоролог'
    | 'Химик'
    | 'Эколог'
    | 'Аналитик'
    | string;
  grade: string;
  avatar?: string;
  email?: string;
  phone?: string;
}

export interface CubesatSpecs {
  format: '1U' | '2U' | '3U';
  payloadType: string;
  orbitAltitudeKm: number;
  inclinationDeg: number;
  powerBudgetWatts: number;
  radioFreqMhz: number;
  massKg: number;
  satelliteName?: string;
}

export interface ChampionshipTrack {
  id: string;
  title: string;
  shortTitle: string;
  category: string;
  description: string;
  icon: string;
  recommendedSpecs: string;
}

export interface Team {
  id: string;
  name: string;
  school: string;
  city: string;
  league: 'Старшая лига (10-11 классы)' | 'Юниорская лига (8-9 классы)';
  track?: string;
  trackTitle?: string;
  mentorName: string;
  mentorTitle: string;
  mentorAvatar?: string;
  logo: string;
  description: string;
  members: TeamMember[];
  cubesatSpecs: CubesatSpecs;
  stageStatuses: Record<StageId, SubmissionStatus>;
  totalScore: number;
  stageScores: Record<StageId, number>;
  rank: number;
  badges: string[];
  launchReadinessPercent: number;
  scores?: Record<string, number>;
  status?: string;
}

export interface StageInfo {
  id: StageId;
  number: number;
  title: string;
  subtitle: string;
  deadline: string;
  description: string;
  deliverables: string[];
  physicsFormulas: string[];
  maxPoints: number;
}

export interface SubmissionFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export interface Submission {
  id: string;
  teamId: string;
  stageId: StageId;
  title: string;
  summary: string;
  details: string;
  calculations: {
    deltaV?: number;
    orbitPeriodMin?: number;
    powerGenerationW?: number;
    batteryMarginWh?: number;
    linkMarginDb?: number;
  };
  files: SubmissionFile[];
  repoUrl?: string;
  status: SubmissionStatus;
  submittedAt: string;
  updatedAt: string;
  juryFeedback?: {
    juryId: string;
    juryName: string;
    juryTitle: string;
    scores: {
      physicsAccuracy: number; // max 25
      engineeringRealism: number; // max 25
      scientificValue: number; // max 20
      documentationQuality: number; // max 15
      presentationClarity: number; // max 15
    };
    totalScore: number;
    comment: string;
    suggestions: string[];
    reviewedAt: string;
  };
}

export interface MentorMessage {
  id: string;
  teamId: string;
  senderRole: 'team' | 'mentor';
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  stageReference?: StageId;
  isImportantAdvice?: boolean;
}

export interface SatelliteAttitude {
  roll: number; // deg [-180..180]
  pitch: number; // deg [-90..90]
  yaw: number; // deg [0..360]
  quaternion?: [number, number, number, number]; // [x, y, z, w]
  angularVelocity: number; // deg/sec (total magnitude)
  adcsStatus: 'STABILIZED' | 'DETUMBLING' | 'SUN_POINTING' | 'TARGET_TRACKING';
}

export type FlightEventCategory = 'deployment' | 'orbit' | 'subsystem' | 'radio' | 'payload';
export type FlightEventStatus = 'completed' | 'active' | 'scheduled' | 'warning';

export interface TelemetryEvidenceItem {
  key: string;
  label: string;
  value: string;
  status: 'nominal' | 'warning' | 'active';
}

export interface FlightTimelineEvent {
  id: string;
  timestamp: string; // e.g. T+00:00, T+15:00
  relativeMinutes: number;
  title: string;
  category: FlightEventCategory;
  status: FlightEventStatus;
  description: string;
  iconName: string;
  evidence: TelemetryEvidenceItem[];
  criticality: 'critical' | 'high' | 'normal';
}

export interface TelemetryPacket {
  timestamp: string;
  epoch: number;
  satelliteName: string;
  altitudeKm: number;
  velocityKms: number;
  velocityKmS?: number;
  latitude: number;
  longitude: number;
  batteryVoltage: number; // V
  batterySocPercent: number; // %
  batteryLevel?: number;
  batteryTempC: number; // °C
  solarCurrentMa: number; // mA
  solarPowerW: number; // W
  solarGenerationWatts?: number;
  solarPanelTempC: number; // °C
  obcTempC: number; // °C
  payloadStatus: 'ON' | 'STANDBY' | 'ACQUIRING_DATA';
  radioRssiDb: number; // dBm
  signalStrengthDbm?: number;
  downlinkSpeedKbps: number;
  mode: 'NORMAL' | 'ECLIPSE' | 'DETUMBLING' | 'TRANSMITTING' | 'SAFE';
  gyroRates: [number, number, number]; // deg/sec (X, Y, Z)
  orientation?: SatelliteAttitude;
  packetsDownlinked: number;
  rawHex: string;
  id?: string;
  orbitNumber?: number;
  currentStation?: string;
  attitudeRoll?: number;
  attitudePitch?: number;
  attitudeYaw?: number;
  solarPanelsDeployed?: boolean;
  antennaDeployed?: boolean;
  magnetometerX?: number;
  magnetometerY?: number;
  magnetometerZ?: number;
  gyroscopeX?: number;
  gyroscopeY?: number;
  gyroscopeZ?: number;
  cpuTemperatureC?: number;
  packetLossPercent?: number;
  obcStatus?: string;
  lastBuildCommit?: string;
  buildCommitTimestamp?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  type: 'submission' | 'review' | 'mentor' | 'telemetry' | 'system';
}

export interface AppNotification {
  id: string;
  type: 'review' | 'mentor' | 'telemetry' | 'deadline' | 'achievement';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTab?: string;
  statusBadge?: string;
  submissionStatus?: SubmissionStatus;
  stageId?: StageId;
}

export type WidgetId =
  | 'telemetry_gauge'
  | 'orbit_map'
  | 'stage_pipeline'
  | 'power_budget'
  | 'mentor_feed'
  | 'launch_countdown'
  | 'physics_calc'
  | 'productivity_stats'
  | 'team_live_chat';

export type ChatChannel = 'team' | 'organizers' | 'announcements';

export interface ChatAttachment {
  name: string;
  size: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  channel: ChatChannel;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  createdAtIso: string;
  isOrganizer?: boolean;
  isPinned?: boolean;
  reactions?: Record<string, number>;
  attachment?: ChatAttachment;
}

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  visible: boolean;
  order: number;
  category: 'flight' | 'academic' | 'management';
}

export type SpaceObjectType =
  'satellite' | 'observation_zone' | 'radiation_belt' | 'ground_station' | 'separation_point';

export interface SpaceMapObject {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  type: SpaceObjectType;
  coordinates: {
    raHours: number; // Right Ascension 0..24h
    decDeg: number; // Declination -90..+90°
    altitudeKm?: number;
  };
  description: string;
  specs: string;
  createdAt: string;
  icon?: string;
  color?: string;
}

export type ForumCategory =
  'ballistics' | 'hardware' | 'electronics' | 'payload' | 'radio' | 'general';

export interface ForumReply {
  id: string;
  topicId: string;
  authorName: string;
  authorRole: string;
  authorTeam?: string;
  createdAt: string;
  content: string;
  attachments: Array<{ name: string; size: string; type: string }>;
  likes: number;
}

export interface ForumTopic {
  id: string;
  title: string;
  category: ForumCategory;
  authorName: string;
  authorRole: string;
  authorTeam?: string;
  createdAt: string;
  content: string;
  attachments: Array<{ name: string; size: string; type: string }>;
  pinned: boolean;
  closed: boolean;
  views: number;
  replies: ForumReply[];
}

export interface MaterialChapter {
  timeSeconds: number;
  timeFormatted: string;
  title: string;
}

export interface EducationalMaterial {
  id: string;
  title: string;
  category: 'tour_360' | 'lecture' | 'workshop' | 'masterclass';
  author: string;
  organization: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  description: string;
  keyTopics: string[];
  externalResources: Array<{
    title: string;
    url: string;
    type: 'pdf' | 'link' | 'code' | 'dataset';
  }>;
  publishedAt: string;
  chapters?: MaterialChapter[];
  isUploadedFile?: boolean;
  fileSize?: string;
}

export interface ConnectedMobileDevice {
  id: string;
  deviceName: string;
  platform: 'ios' | 'android';
  memberName: string;
  memberRole: string;
  connectedAt: string;
  lastActiveAt: string;
  batteryLevel?: number;
  pushEnabled: boolean;
  ipAddress?: string;
}

export interface MobileAuthPayload {
  version: '1.0';
  protocol: 'cosmoport-sync';
  teamId: string;
  teamName: string;
  role: UserRole;
  authCode: string;
  sessionToken: string;
  issuedAt: number;
  expiresAt: number;
  portalUrl: string;
  telemetryChannel: string;
  telemetryFreqMhz: number;
}

export type SpacePiMissionCategory =
  | 'remote_sensing'
  | 'space_weather'
  | 'astrophysics'
  | 'biology'
  | 'amateur_radio'
  | 'iot_ais'
  | 'materials_propulsion';

export interface SpacePiChecklist {
  massCompliant: boolean;
  powerCompliant: boolean;
  soniksChannelOpen: boolean;
  cameraOrSensorIncluded: boolean;
  schoolEngagementDefined: boolean;
  scientificNoveltyDefined: boolean;
  curatorConfirmed: boolean;
}

export interface SpacePiApplication {
  id: string;
  teamId: string;
  teamName: string;
  projectName: string;
  satelliteName: string;
  missionCategory: SpacePiMissionCategory;
  missionGoal: string;
  scientificNovelty: string;
  payloadDescription: string;
  platformFormat: 'CubeSat 3U';
  payloadMassGrams: number;
  payloadDimensionsMm: { x: number; y: number; z: number };
  powerConsumptionWatts: { average: number; peak: number };
  supplyVoltage: '3.3V' | '5V' | '12V';
  dataInterface: 'I2C' | 'SPI' | 'UART' | 'CAN';
  dailyDataVolumeMb: number;
  radioFrequencyMhz: number;
  soniksIntegration: {
    enabled: boolean;
    openBeaconDesc: string;
    amateurCallsign?: string;
    telemetryFormat: string;
  };
  schoolInvolvementPlan: string;
  teamMembersSummary: string;
  mentorSummary: string;
  status: 'draft' | 'ready_for_review' | 'jury_approved' | 'submitted_to_spacepi';
  spacePiRegistrationCode?: string;
  submittedAt?: string;
  complianceScore: number;
  checklist: SpacePiChecklist;
  juryNotes?: string[];
  attachedFiles?: Array<{ name: string; size: string; type: string }>;
}

export interface SpacePiIdea {
  id: string;
  title: string;
  category: SpacePiMissionCategory;
  categoryLabel: string;
  badge: string;
  difficulty: 'Базовый' | 'Продвинутый' | 'Экспертный';
  summary: string;
  scientificValue: string;
  payloadComponents: string[];
  specs: {
    massG: number;
    powerW: number;
    volumeU: string;
    dataRate: string;
  };
  realSpacePiPrecedents: string[];
  soniksExperiment: string;
  templateData: Partial<SpacePiApplication>;
}

export interface SpacePiConstellationSatellite {
  id: string;
  name: string;
  slug: string;
  organization: string;
  schoolPartner?: string;
  city: string;
  year: number;
  platform: string;
  format: 'CubeSat 3U' | 'CubeSat 1U' | 'CubeSat 6U';
  noradId?: number;
  callsign?: string;
  frequenciesMhz: string;
  payloadDescription: string;
  missionType: string;
  status: 'orbit' | 'completed' | 'launch_prep';
  soniksUrl?: string;
  description: string;
}
