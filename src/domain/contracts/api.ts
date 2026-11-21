/**
 * Канонические контракты API и DTO для платформы «МИРОВИЗОР».
 * Синхронизировано со спецификацией docs/openapi.yaml.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'maintenance';
  timestamp: string;
  uptimeSec: number;
  activeConnections: number;
  version: string;
}

export interface TeamDto {
  id: string;
  name: string;
  city: string;
  school: string;
  totalScore: number;
  rank: number;
  captainName: string;
  mentorName?: string;
  membersCount: number;
}

export interface SubmissionDto {
  id: string;
  teamId: string;
  stageId: string;
  title: string;
  status: 'draft' | 'submitted' | 'under_review' | 'evaluated';
  totalScore?: number;
  submittedAt: string;
}

export interface TelemetrySnapshotDto {
  timestamp: number;
  altitudeKm: number;
  velocityKmS: number;
  batteryPct: number;
  solarVoltageV: number;
  tempInternalC: number;
  radiationUsvH: number;
}
