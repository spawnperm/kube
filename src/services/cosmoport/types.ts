export type PortProtocol = 'TCP' | 'UDP' | 'WEBSOCKET' | 'SERIAL' | 'RADIO_VHF' | 'RADIO_UHF';

export type PortState =
  'CLOSED' | 'LISTENING' | 'CONNECTING' | 'CONNECTED' | 'BUSY' | 'PAUSED' | 'ERROR';

export type ConnectionState =
  | 'IDLE'
  | 'CONNECTING'
  | 'HANDSHAKING'
  | 'AUTHENTICATING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'FAILED';

export interface PortDefinition {
  id: string;
  portNumber: number;
  name: string;
  protocol: PortProtocol;
  state: PortState;
  maxConnections: number;
  currentConnections: number;
  baudRate?: number;
  description?: string;
}

export interface ConnectionSession {
  id: string;
  portId: string;
  remoteEndpoint: string;
  state: ConnectionState;
  connectedAt?: number;
  disconnectedAt?: number;
  lastHeartbeatAt?: number;
  bytesSent: number;
  bytesReceived: number;
  packetsSent: number;
  packetsReceived: number;
  latencyMs: number;
  snrDb: number;
  reconnectAttempts: number;
  authVerified: boolean;
  error?: string;
}

export interface TelemetryFrame {
  syncWord: number; // e.g. 0xEB90
  sequenceId: number;
  subsystemId: number;
  flags: number;
  timestamp: number;
  payload: Uint8Array;
  checksum: number; // CRC-16
}

export interface AdcCounts {
  rawVoltage: number; // 0..4095
  rawCurrent: number; // 0..4095
  rawTemp: number; // 0..4095
  rawSolarPower: number; // 0..4095
  rawGyroX: number; // 0..4095
  rawGyroY: number; // 0..4095
  rawGyroZ: number; // 0..4095
  rawMagX: number; // 0..4095
  rawMagY: number; // 0..4095
  rawMagZ: number; // 0..4095
  rawRssi: number; // 0..255
}

export interface EngineeringData {
  busVoltageV: number;
  busCurrentA: number;
  batteryTempC: number;
  solarPowerW: number;
  gyroRateDps: [number, number, number];
  magFieldUt: [number, number, number];
  radioRssiDb: number;
  isAntennaDeployed: boolean;
  beaconActive: boolean;
  lowPowerMode: boolean;
  adcsDetumbling: boolean;
  payloadStatus: 'OK' | 'DEGRADED' | 'FAULT';
  sensorFaults: string[];
}

// Custom Cosmoport Errors
export class PortError extends Error {
  constructor(message: string) {
    super(`[PortError] ${message}`);
    this.name = 'PortError';
  }
}

export class InvalidPortNumberError extends PortError {
  constructor(public readonly portNumber: unknown) {
    super(`Invalid port number: ${portNumber}. Port must be an integer between 1 and 65535.`);
    this.name = 'InvalidPortNumberError';
  }
}

export class PortAlreadyExistsError extends PortError {
  constructor(public readonly portIdOrNumber: string | number) {
    super(`Port identifier or number already registered: ${portIdOrNumber}`);
    this.name = 'PortAlreadyExistsError';
  }
}

export class PortNotFoundError extends PortError {
  constructor(public readonly portId: string) {
    super(`Port not found: ${portId}`);
    this.name = 'PortNotFoundError';
  }
}

export class PortClosedError extends PortError {
  constructor(public readonly portId: string) {
    super(`Port is closed and cannot accept connections: ${portId}`);
    this.name = 'PortClosedError';
  }
}

export class MaxConnectionsExceededError extends PortError {
  constructor(
    public readonly portId: string,
    public readonly max: number,
  ) {
    super(`Max connections limit (${max}) exceeded on port: ${portId}`);
    this.name = 'MaxConnectionsExceededError';
  }
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(`[ConnectionError] ${message}`);
    this.name = 'ConnectionError';
  }
}

export class ConnectionTimeoutError extends ConnectionError {
  constructor(
    public readonly endpoint: string,
    public readonly timeoutMs: number,
  ) {
    super(`Connection timed out to ${endpoint} after ${timeoutMs}ms`);
    this.name = 'ConnectionTimeoutError';
  }
}

export class AuthenticationFailedError extends ConnectionError {
  constructor(public readonly reason = 'Invalid credentials or satellite token') {
    super(`Authentication failed: ${reason}`);
    this.name = 'AuthenticationFailedError';
  }
}

export class DataTransformationError extends Error {
  constructor(message: string) {
    super(`[DataTransformationError] ${message}`);
    this.name = 'DataTransformationError';
  }
}

export class CorruptedFrameError extends DataTransformationError {
  constructor(public readonly reason: string) {
    super(`Corrupted telemetry frame: ${reason}`);
    this.name = 'CorruptedFrameError';
  }
}

export class PacketOversizedError extends DataTransformationError {
  constructor(
    public readonly size: number,
    public readonly max: number,
  ) {
    super(`Packet size ${size} bytes exceeds maximum allowed ${max} bytes`);
    this.name = 'PacketOversizedError';
  }
}
