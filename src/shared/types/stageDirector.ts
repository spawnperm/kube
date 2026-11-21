export type EventStageId = 'start_ships' | 'prep_blueprints' | 'defense_pitch';

export interface EventStageTimer {
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  mode: 'pitch' | 'qa' | 'paused';
}

export interface EventStageState {
  currentStage: EventStageId;
  presentingTeamId: string;
  activeSlideIndex: number; // 0, 1, 2
  orbitSpeed: number;
  orbitViewMode: 'global' | 'follow' | 'ground';
  focusedSubsystem: string;
  timer: EventStageTimer;
  announcement: string;
  tickerText: string;
  updatedAt: number;
  updatedBy: string;
}

export interface SystemPortInfo {
  port: number;
  protocol: string;
  host: string;
  status: string;
  service: string;
}

export interface SystemMemoryInfo {
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
  systemTotalMb: number;
  systemFreeMb: number;
  percentHeapUsed: number;
}

export interface SystemServiceStatus {
  id: string;
  name: string;
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED' | 'FALLBACK_SIMULATOR';
  details: string;
}

export interface SystemStatsResponse {
  timestamp: string;
  uptimeSeconds: number;
  nodeVersion: string;
  platform: string;
  ports: SystemPortInfo[];
  memory: SystemMemoryInfo;
  cpu: {
    cores: number;
    model: string;
    loadAvg: number[];
    percentUsed?: number;
  };
  websocket?: {
    activeConnections: number;
    activeRooms?: number;
    port?: number;
    protocol?: string;
  };
  errors: {
    totalCount: number;
    lastErrors: Array<{ timestamp: string; message: string; status: number }>;
  };
  services: SystemServiceStatus[];
}

export interface HealthCheckResponse {
  status: string;
  uptimeSec: number;
  timestamp: string;
  activeRooms: number;
  geminiEnabled: boolean;
  nodeEnv: string;
  resources?: {
    cpu: {
      cores: number;
      model: string;
      loadAvg: number[];
      percentUsed: number;
    };
    ram: {
      heapUsedMb: number;
      heapTotalMb: number;
      rssMb: number;
      externalMb: number;
      systemTotalMb: number;
      systemFreeMb: number;
      systemUsedMb: number;
      systemPercentUsed: number;
      percentHeapUsed: number;
    };
    websocket: {
      activeConnections: number;
      status: string;
      port: number;
      protocol: string;
      path: string;
    };
  };
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'audit';
  subsystem: 'STAGE_CTRL' | 'CRM' | 'TELEMETRY' | 'JURY' | 'SYS' | 'AUTH';
  message: string;
  details?: Record<string, unknown>;
}
