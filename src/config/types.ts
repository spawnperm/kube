export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogDestination = 'console' | 'memory' | 'both';

export interface CosmoportPortsConfig {
  server: number;
  telemetryDownlink: number;
  commandUplink: number;
  groundStationRadio: number;
  dockingTelemetry: number;
}

export interface CosmoportConnectionsConfig {
  timeoutMs: number;
  keepAliveIntervalMs: number;
  handshakeTimeoutMs: number;
  maxReconnectAttempts: number;
  reconnectBackoffMs: number;
}

export interface CosmoportCredentialsConfig {
  apiKey: string;
  satelliteAuthToken: string;
  groundStationId: string;
  groundStationSecret: string;
  encryptionKey?: string;
}

export interface CosmoportLoggingConfig {
  level: LogLevel;
  destination: LogDestination;
  maskCredentials: boolean;
}

export interface CosmoportDataTransformationConfig {
  enableCrcCheck: boolean;
  compressionEnabled: boolean;
  maxPacketSizeBytes: number;
  dopplerCompensation: boolean;
}

export interface CosmoportAppConfig {
  environment: 'development' | 'production' | 'test';
  stationName: string;
  ports: CosmoportPortsConfig;
  connections: CosmoportConnectionsConfig;
  credentials: CosmoportCredentialsConfig;
  logging: CosmoportLoggingConfig;
  dataTransformation: CosmoportDataTransformationConfig;
}

export type PartialCosmoportConfig = {
  [K in keyof CosmoportAppConfig]?: Partial<CosmoportAppConfig[K]>;
};
