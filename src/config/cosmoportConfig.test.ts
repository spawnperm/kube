import { describe, it, expect, beforeEach } from 'vitest';
import {
  CosmoportConfigManager,
  ConfigValidationError,
  ConfigParseError,
  DEFAULT_COSMOPORT_CONFIG,
} from './cosmoportConfig';

describe('CosmoportConfigManager: Configuration Management System', () => {
  let configManager: CosmoportConfigManager;

  beforeEach(() => {
    configManager = new CosmoportConfigManager();
  });

  describe('Default Configuration & Immutability', () => {
    it('initializes with production-ready default values', () => {
      const config = configManager.getConfig();
      expect(config.environment).toBe('development');
      expect(config.ports.server).toBe(3000);
      expect(config.ports.telemetryDownlink).toBe(8080);
      expect(config.ports.commandUplink).toBe(8081);
      expect(config.ports.groundStationRadio).toBe(14580);
      expect(config.connections.timeoutMs).toBe(5000);
      expect(config.connections.handshakeTimeoutMs).toBe(3000);
      expect(config.connections.maxReconnectAttempts).toBe(5);
      expect(config.logging.level).toBe('info');
      expect(config.dataTransformation.enableCrcCheck).toBe(true);
    });

    it('returns immutable clones so mutating returned config does not alter internal state', () => {
      const config1 = configManager.getConfig();
      config1.ports.server = 9999;
      const config2 = configManager.getConfig();
      expect(config2.ports.server).toBe(3000);
    });

    it('resets configuration back to default values', () => {
      configManager.mergeConfig({
        ports: { server: 4000 },
        connections: { timeoutMs: 12000 },
      });
      expect(configManager.getConfig().ports.server).toBe(4000);

      configManager.resetToDefaults();
      expect(configManager.getConfig().ports.server).toBe(DEFAULT_COSMOPORT_CONFIG.ports.server);
      expect(configManager.getConfig().connections.timeoutMs).toBe(
        DEFAULT_COSMOPORT_CONFIG.connections.timeoutMs,
      );
    });
  });

  describe('Loading from JSON', () => {
    it('successfully loads and merges configuration from valid JSON string', () => {
      const json = JSON.stringify({
        stationName: 'Cosmoport Baikonur Gateway',
        ports: {
          server: 3500,
          telemetryDownlink: 9020,
        },
        connections: {
          timeoutMs: 8000,
        },
        logging: {
          level: 'debug',
        },
      });

      const updated = configManager.loadFromJson(json);
      expect(updated.stationName).toBe('Cosmoport Baikonur Gateway');
      expect(updated.ports.server).toBe(3500);
      expect(updated.ports.telemetryDownlink).toBe(9020);
      // Keeps other defaults
      expect(updated.ports.commandUplink).toBe(8081);
      expect(updated.connections.timeoutMs).toBe(8000);
      expect(updated.logging.level).toBe('debug');
    });

    it('throws ConfigParseError on malformed JSON string', () => {
      const malformedJson = '{ stationName: "invalid-json without quotes", }';
      expect(() => configManager.loadFromJson(malformedJson)).toThrow(ConfigParseError);
    });

    it('throws ConfigParseError when JSON root is not an object (e.g. array or primitive)', () => {
      expect(() => configManager.loadFromJson('[1, 2, 3]')).toThrow(ConfigParseError);
      expect(() => configManager.loadFromJson('"just a string"')).toThrow(ConfigParseError);
    });
  });

  describe('Loading from YAML', () => {
    it('successfully loads and parses YAML configuration', () => {
      const yaml = `
stationName: Cosmoport Vostochny Launch Site
ports:
  server: 3200
  telemetryDownlink: 8400
connections:
  handshakeTimeoutMs: 4500
  maxReconnectAttempts: 10
credentials:
  groundStationId: GS-03-VOSTOK
logging:
  level: warn
`;
      const config = configManager.loadFromYaml(yaml);
      expect(config.stationName).toBe('Cosmoport Vostochny Launch Site');
      expect(config.ports.server).toBe(3200);
      expect(config.ports.telemetryDownlink).toBe(8400);
      expect(config.connections.handshakeTimeoutMs).toBe(4500);
      expect(config.connections.maxReconnectAttempts).toBe(10);
      expect(config.credentials.groundStationId).toBe('GS-03-VOSTOK');
      expect(config.logging.level).toBe('warn');
    });

    it('throws ConfigParseError on non-object YAML or parse errors', () => {
      expect(() => configManager.loadFromYaml('- item1\n- item2')).toThrow(ConfigParseError);
    });
  });

  describe('Loading from Environment Variables', () => {
    it('loads and converts environment variables with high priority', () => {
      const envMock: Record<string, string> = {
        COSMOPORT_PORT: '4200',
        COSMOPORT_TELEMETRY_PORT: '9100',
        COSMOPORT_UPLINK_PORT: '9200',
        COSMOPORT_RADIO_PORT: '14595',
        COSMOPORT_TIMEOUT_MS: '7500',
        COSMOPORT_HANDSHAKE_TIMEOUT_MS: '2500',
        COSMOPORT_RECONNECT_ATTEMPTS: '8',
        COSMOPORT_API_KEY: 'secret-api-key-99',
        COSMOPORT_SATELLITE_AUTH_TOKEN: 'sat-token-orbit-1',
        COSMOPORT_LOG_LEVEL: 'error',
        COSMOPORT_ENABLE_CRC: 'false',
        COSMOPORT_MAX_PACKET_SIZE: '8192',
      };

      const loaded = configManager.loadFromEnv(envMock);
      expect(loaded.ports.server).toBe(4200);
      expect(loaded.ports.telemetryDownlink).toBe(9100);
      expect(loaded.ports.commandUplink).toBe(9200);
      expect(loaded.ports.groundStationRadio).toBe(14595);
      expect(loaded.connections.timeoutMs).toBe(7500);
      expect(loaded.connections.handshakeTimeoutMs).toBe(2500);
      expect(loaded.connections.maxReconnectAttempts).toBe(8);
      expect(loaded.credentials.apiKey).toBe('secret-api-key-99');
      expect(loaded.credentials.satelliteAuthToken).toBe('sat-token-orbit-1');
      expect(loaded.logging.level).toBe('error');
      expect(loaded.dataTransformation.enableCrcCheck).toBe(false);
      expect(loaded.dataTransformation.maxPacketSizeBytes).toBe(8192);
    });

    it('supports Vite prefixed VITE_COSMOPORT_* variables', () => {
      const viteEnv: Record<string, string> = {
        VITE_COSMOPORT_PORT: '3100',
        VITE_COSMOPORT_API_KEY: 'vite-client-key',
        VITE_COSMOPORT_LOG_LEVEL: 'debug',
      };

      const loaded = configManager.loadFromEnv(viteEnv);
      expect(loaded.ports.server).toBe(3100);
      expect(loaded.credentials.apiKey).toBe('vite-client-key');
      expect(loaded.logging.level).toBe('debug');
    });
  });

  describe('Validation & Edge Cases', () => {
    it('rejects port numbers below 1', () => {
      expect(() => {
        configManager.mergeConfig({ ports: { server: 0 } });
      }).toThrow(ConfigValidationError);

      expect(() => {
        configManager.mergeConfig({ ports: { server: -80 } });
      }).toThrow(ConfigValidationError);
    });

    it('rejects port numbers above 65535', () => {
      expect(() => {
        configManager.mergeConfig({ ports: { telemetryDownlink: 65536 } });
      }).toThrow(ConfigValidationError);

      expect(() => {
        configManager.mergeConfig({ ports: { server: 999999 } });
      }).toThrow(ConfigValidationError);
    });

    it('rejects non-integer port numbers', () => {
      expect(() => {
        // @ts-expect-error testing invalid type
        configManager.mergeConfig({ ports: { server: 3000.5 } });
      }).toThrow(ConfigValidationError);

      expect(() => {
        // @ts-expect-error testing invalid type
        configManager.mergeConfig({ ports: { server: Number.NaN } });
      }).toThrow(ConfigValidationError);
    });

    it('rejects zero or negative connection timeouts', () => {
      expect(() => {
        configManager.mergeConfig({ connections: { timeoutMs: 0 } });
      }).toThrow(ConfigValidationError);

      expect(() => {
        configManager.mergeConfig({ connections: { timeoutMs: -100 } });
      }).toThrow(ConfigValidationError);
    });

    it('rejects invalid log levels', () => {
      expect(() => {
        // @ts-expect-error testing invalid level
        configManager.mergeConfig({ logging: { level: 'verbose' } });
      }).toThrow(ConfigValidationError);
    });

    it('rejects non-positive maxPacketSizeBytes', () => {
      expect(() => {
        configManager.mergeConfig({ dataTransformation: { maxPacketSizeBytes: 0 } });
      }).toThrow(ConfigValidationError);
    });
  });

  describe('Credentials Masking & Serialization', () => {
    it('masks sensitive credentials when getMaskedConfig() is called', () => {
      configManager.mergeConfig({
        credentials: {
          apiKey: 'super-secret-key-12345',
          satelliteAuthToken: 'token_alpha_omega_99',
          groundStationSecret: 'orbital_passphrase_xyz',
        },
      });

      const masked = configManager.getMaskedConfig();
      expect(masked.credentials.apiKey).toContain('***');
      expect(masked.credentials.apiKey).not.toBe('super-secret-key-12345');
      expect(masked.credentials.satelliteAuthToken).toContain('***');
      expect(masked.credentials.groundStationSecret).toContain('***');

      // Original unmasked remains intact in internal state
      const actual = configManager.getConfig();
      expect(actual.credentials.apiKey).toBe('super-secret-key-12345');
    });

    it('exports masked or unmasked YAML and JSON configurations', () => {
      configManager.mergeConfig({
        credentials: { apiKey: 'secret123' },
      });

      const maskedYaml = configManager.toYaml(true);
      expect(maskedYaml).toContain('***');
      expect(maskedYaml).not.toContain('secret123');

      const fullJson = configManager.toJson(false);
      expect(fullJson).toContain('secret123');
    });
  });
});
