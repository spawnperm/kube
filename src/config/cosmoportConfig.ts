import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { CosmoportAppConfig, PartialCosmoportConfig, LogLevel } from './types';

export const DEFAULT_COSMOPORT_CONFIG: CosmoportAppConfig = {
  environment: 'development',
  stationName: 'Cosmoport Primary Ground Station (Perm-Space)',
  ports: {
    server: 3000,
    telemetryDownlink: 8080,
    commandUplink: 8081,
    groundStationRadio: 14580,
    dockingTelemetry: 9000,
  },
  connections: {
    timeoutMs: 5000,
    keepAliveIntervalMs: 30000,
    handshakeTimeoutMs: 3000,
    maxReconnectAttempts: 5,
    reconnectBackoffMs: 1000,
  },
  credentials: {
    apiKey: '',
    satelliteAuthToken: '',
    groundStationId: 'GS-01-PERM',
    groundStationSecret: '',
    encryptionKey: '',
  },
  logging: {
    level: 'info',
    destination: 'both',
    maskCredentials: true,
  },
  dataTransformation: {
    enableCrcCheck: true,
    compressionEnabled: false,
    maxPacketSizeBytes: 4096,
    dopplerCompensation: true,
  },
};

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`[CosmoportConfig] Validation Error: ${message}`);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigParseError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(`[CosmoportConfig] Parse Error: ${message}`);
    this.name = 'ConfigParseError';
  }
}

export class CosmoportConfigManager {
  private config: CosmoportAppConfig;

  constructor(initialOverrides?: PartialCosmoportConfig) {
    this.config = structuredClone(DEFAULT_COSMOPORT_CONFIG);
    if (initialOverrides) {
      this.mergeConfig(initialOverrides);
    }
  }

  /**
   * Returns current active configuration (immutable copy)
   */
  public getConfig(): CosmoportAppConfig {
    return structuredClone(this.config);
  }

  /**
   * Returns configuration with sensitive credentials masked with '***'
   */
  public getMaskedConfig(): CosmoportAppConfig {
    const copy = structuredClone(this.config);
    if (copy.credentials.apiKey) {
      copy.credentials.apiKey = this.maskSecret(copy.credentials.apiKey);
    }
    if (copy.credentials.satelliteAuthToken) {
      copy.credentials.satelliteAuthToken = this.maskSecret(copy.credentials.satelliteAuthToken);
    }
    if (copy.credentials.groundStationSecret) {
      copy.credentials.groundStationSecret = this.maskSecret(copy.credentials.groundStationSecret);
    }
    if (copy.credentials.encryptionKey) {
      copy.credentials.encryptionKey = this.maskSecret(copy.credentials.encryptionKey);
    }
    return copy;
  }

  private maskSecret(secret: string): string {
    if (!secret || secret.length <= 4) return '***';
    return `${secret.slice(0, 2)}***${secret.slice(-2)}`;
  }

  /**
   * Resets configuration back to defaults
   */
  public resetToDefaults(): CosmoportAppConfig {
    this.config = structuredClone(DEFAULT_COSMOPORT_CONFIG);
    return this.getConfig();
  }

  /**
   * Validates configuration values
   */
  public validate(configToValidate: CosmoportAppConfig = this.config): void {
    // Validate ports
    const portEntries = Object.entries(configToValidate.ports);
    for (const [key, port] of portEntries) {
      if (typeof port !== 'number' || !Number.isInteger(port)) {
        throw new ConfigValidationError(`Port '${key}' must be an integer, received: ${port}`);
      }
      if (port < 1 || port > 65535) {
        throw new ConfigValidationError(
          `Port '${key}' must be in range 1-65535, received: ${port}`,
        );
      }
    }

    // Validate timeouts
    const connEntries = Object.entries(configToValidate.connections);
    for (const [key, val] of connEntries) {
      if (typeof val !== 'number' || val < 0 || !Number.isFinite(val)) {
        throw new ConfigValidationError(
          `Connection setting '${key}' must be a non-negative number, received: ${val}`,
        );
      }
    }

    if (configToValidate.connections.timeoutMs <= 0) {
      throw new ConfigValidationError('Connection timeoutMs must be greater than 0');
    }

    // Validate logging level
    const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(configToValidate.logging.level)) {
      throw new ConfigValidationError(
        `Invalid log level '${configToValidate.logging.level}'. Must be one of: ${validLevels.join(', ')}`,
      );
    }

    // Validate maxPacketSizeBytes
    if (
      typeof configToValidate.dataTransformation.maxPacketSizeBytes !== 'number' ||
      configToValidate.dataTransformation.maxPacketSizeBytes <= 0
    ) {
      throw new ConfigValidationError('maxPacketSizeBytes must be a positive number');
    }
  }

  /**
   * Deep merges partial configuration into current state
   */
  public mergeConfig(partial: PartialCosmoportConfig): CosmoportAppConfig {
    const next: CosmoportAppConfig = {
      environment: partial.environment ?? this.config.environment,
      stationName: partial.stationName ?? this.config.stationName,
      ports: {
        ...this.config.ports,
        ...(partial.ports || {}),
      },
      connections: {
        ...this.config.connections,
        ...(partial.connections || {}),
      },
      credentials: {
        ...this.config.credentials,
        ...(partial.credentials || {}),
      },
      logging: {
        ...this.config.logging,
        ...(partial.logging || {}),
      },
      dataTransformation: {
        ...this.config.dataTransformation,
        ...(partial.dataTransformation || {}),
      },
    };

    this.validate(next);
    this.config = next;
    return this.getConfig();
  }

  /**
   * Loads configuration from a JSON string
   */
  public loadFromJson(jsonString: string): CosmoportAppConfig {
    try {
      const parsed = JSON.parse(jsonString) as PartialCosmoportConfig;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new ConfigParseError('JSON configuration root must be an object');
      }
      return this.mergeConfig(parsed);
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        throw err;
      }
      throw new ConfigParseError(
        err instanceof Error ? err.message : 'Failed to parse JSON configuration',
        err,
      );
    }
  }

  /**
   * Loads configuration from a YAML string
   */
  public loadFromYaml(yamlString: string): CosmoportAppConfig {
    try {
      const parsed = parseYaml(yamlString) as PartialCosmoportConfig;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new ConfigParseError('YAML configuration root must be an object');
      }
      return this.mergeConfig(parsed);
    } catch (err) {
      if (err instanceof ConfigValidationError) {
        throw err;
      }
      throw new ConfigParseError(
        err instanceof Error ? err.message : 'Failed to parse YAML configuration',
        err,
      );
    }
  }

  /**
   * Loads configuration from an environment variable map
   */
  public loadFromEnv(
    env: Record<string, string | undefined> = this.getSystemEnv(),
  ): CosmoportAppConfig {
    const partial: PartialCosmoportConfig = {};

    // Station and Environment
    if (env.COSMOPORT_ENV || env.NODE_ENV) {
      const envVal = (env.COSMOPORT_ENV || env.NODE_ENV)?.toLowerCase();
      if (envVal === 'production' || envVal === 'test' || envVal === 'development') {
        partial.environment = envVal;
      }
    }
    if (env.COSMOPORT_STATION_NAME || env.VITE_COSMOPORT_STATION_NAME) {
      partial.stationName = env.COSMOPORT_STATION_NAME || env.VITE_COSMOPORT_STATION_NAME;
    }

    // Ports
    const ports: Partial<CosmoportAppConfig['ports']> = {};
    if (env.COSMOPORT_PORT || env.PORT || env.VITE_COSMOPORT_PORT) {
      ports.server = Number.parseInt(
        env.COSMOPORT_PORT || env.PORT || env.VITE_COSMOPORT_PORT || '3000',
        10,
      );
    }
    if (env.COSMOPORT_TELEMETRY_PORT || env.VITE_COSMOPORT_TELEMETRY_PORT) {
      ports.telemetryDownlink = Number.parseInt(
        env.COSMOPORT_TELEMETRY_PORT || env.VITE_COSMOPORT_TELEMETRY_PORT || '8080',
        10,
      );
    }
    if (env.COSMOPORT_UPLINK_PORT || env.VITE_COSMOPORT_UPLINK_PORT) {
      ports.commandUplink = Number.parseInt(
        env.COSMOPORT_UPLINK_PORT || env.VITE_COSMOPORT_UPLINK_PORT || '8081',
        10,
      );
    }
    if (env.COSMOPORT_RADIO_PORT || env.VITE_COSMOPORT_RADIO_PORT) {
      ports.groundStationRadio = Number.parseInt(
        env.COSMOPORT_RADIO_PORT || env.VITE_COSMOPORT_RADIO_PORT || '14580',
        10,
      );
    }
    if (env.COSMOPORT_DOCKING_PORT || env.VITE_COSMOPORT_DOCKING_PORT) {
      ports.dockingTelemetry = Number.parseInt(
        env.COSMOPORT_DOCKING_PORT || env.VITE_COSMOPORT_DOCKING_PORT || '9000',
        10,
      );
    }
    if (Object.keys(ports).length > 0) {
      partial.ports = ports;
    }

    // Connections
    const connections: Partial<CosmoportAppConfig['connections']> = {};
    if (env.COSMOPORT_TIMEOUT_MS || env.VITE_COSMOPORT_TIMEOUT_MS) {
      connections.timeoutMs = Number.parseInt(
        env.COSMOPORT_TIMEOUT_MS || env.VITE_COSMOPORT_TIMEOUT_MS || '5000',
        10,
      );
    }
    if (env.COSMOPORT_HANDSHAKE_TIMEOUT_MS || env.VITE_COSMOPORT_HANDSHAKE_TIMEOUT_MS) {
      connections.handshakeTimeoutMs = Number.parseInt(
        env.COSMOPORT_HANDSHAKE_TIMEOUT_MS || env.VITE_COSMOPORT_HANDSHAKE_TIMEOUT_MS || '3000',
        10,
      );
    }
    if (env.COSMOPORT_KEEPALIVE_MS || env.VITE_COSMOPORT_KEEPALIVE_MS) {
      connections.keepAliveIntervalMs = Number.parseInt(
        env.COSMOPORT_KEEPALIVE_MS || env.VITE_COSMOPORT_KEEPALIVE_MS || '30000',
        10,
      );
    }
    if (env.COSMOPORT_RECONNECT_ATTEMPTS || env.VITE_COSMOPORT_RECONNECT_ATTEMPTS) {
      connections.maxReconnectAttempts = Number.parseInt(
        env.COSMOPORT_RECONNECT_ATTEMPTS || env.VITE_COSMOPORT_RECONNECT_ATTEMPTS || '5',
        10,
      );
    }
    if (Object.keys(connections).length > 0) {
      partial.connections = connections;
    }

    // Credentials
    const credentials: Partial<CosmoportAppConfig['credentials']> = {};
    if (env.COSMOPORT_API_KEY || env.VITE_COSMOPORT_API_KEY) {
      credentials.apiKey = env.COSMOPORT_API_KEY || env.VITE_COSMOPORT_API_KEY;
    }
    if (env.COSMOPORT_SATELLITE_AUTH_TOKEN || env.VITE_COSMOPORT_SATELLITE_AUTH_TOKEN) {
      credentials.satelliteAuthToken =
        env.COSMOPORT_SATELLITE_AUTH_TOKEN || env.VITE_COSMOPORT_SATELLITE_AUTH_TOKEN;
    }
    if (env.COSMOPORT_GROUND_STATION_ID || env.VITE_COSMOPORT_GROUND_STATION_ID) {
      credentials.groundStationId =
        env.COSMOPORT_GROUND_STATION_ID || env.VITE_COSMOPORT_GROUND_STATION_ID;
    }
    if (env.COSMOPORT_GROUND_STATION_SECRET || env.VITE_COSMOPORT_GROUND_STATION_SECRET) {
      credentials.groundStationSecret =
        env.COSMOPORT_GROUND_STATION_SECRET || env.VITE_COSMOPORT_GROUND_STATION_SECRET;
    }
    if (env.COSMOPORT_ENCRYPTION_KEY || env.VITE_COSMOPORT_ENCRYPTION_KEY) {
      credentials.encryptionKey = env.COSMOPORT_ENCRYPTION_KEY || env.VITE_COSMOPORT_ENCRYPTION_KEY;
    }
    if (Object.keys(credentials).length > 0) {
      partial.credentials = credentials;
    }

    // Logging
    const logging: Partial<CosmoportAppConfig['logging']> = {};
    if (env.COSMOPORT_LOG_LEVEL || env.VITE_COSMOPORT_LOG_LEVEL) {
      const lvl = (env.COSMOPORT_LOG_LEVEL || env.VITE_COSMOPORT_LOG_LEVEL)?.toLowerCase();
      if (lvl === 'debug' || lvl === 'info' || lvl === 'warn' || lvl === 'error') {
        logging.level = lvl;
      }
    }
    if (Object.keys(logging).length > 0) {
      partial.logging = logging;
    }

    // Data Transformation
    const dataTransformation: Partial<CosmoportAppConfig['dataTransformation']> = {};
    if (env.COSMOPORT_ENABLE_CRC !== undefined) {
      dataTransformation.enableCrcCheck =
        env.COSMOPORT_ENABLE_CRC === 'true' || env.COSMOPORT_ENABLE_CRC === '1';
    }
    if (env.COSMOPORT_MAX_PACKET_SIZE !== undefined) {
      dataTransformation.maxPacketSizeBytes = Number.parseInt(env.COSMOPORT_MAX_PACKET_SIZE, 10);
    }
    if (Object.keys(dataTransformation).length > 0) {
      partial.dataTransformation = dataTransformation;
    }

    return this.mergeConfig(partial);
  }

  /**
   * Serializes current configuration to YAML
   */
  public toYaml(masked = false): string {
    return stringifyYaml(masked ? this.getMaskedConfig() : this.getConfig());
  }

  /**
   * Serializes current configuration to JSON
   */
  public toJson(masked = false, indent = 2): string {
    return JSON.stringify(masked ? this.getMaskedConfig() : this.getConfig(), null, indent);
  }

  private getSystemEnv(): Record<string, string | undefined> {
    if (typeof process !== 'undefined' && process.env) {
      return process.env;
    }
    // Browser Vite environment
    try {
      const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
      if (meta && meta.env) {
        return meta.env;
      }
    } catch {
      // ignore
    }
    return {};
  }
}

// Global Singleton Instance
export const cosmoportConfig = new CosmoportConfigManager();
// Automatically attempt loading from system environment on init
try {
  cosmoportConfig.loadFromEnv();
} catch {
  // If env has invalid variables, fallback gracefully to default
}
