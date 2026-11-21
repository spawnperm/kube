import { describe, it, expect, beforeEach } from 'vitest';
import { logger, type StructuredLogEntry } from './logger';

describe('Cosmoport Structured Logger Service (Pino)', () => {
  beforeEach(() => {
    logger.clearBuffer();
  });

  describe('Basic Logging & Levels', () => {
    it('records logs with correct levels: debug, info, warn, error', () => {
      logger.debug('Testing debug message', { subsystem: 'ADCS' });
      logger.info('Testing info message', { subsystem: 'EPS' });
      logger.warn('Testing warning message', { subsystem: 'OBC' });
      logger.error('Testing error message', new Error('Payload communication drop'));

      const logs = logger.getLogs();
      expect(logs.length).toBe(4);
      expect(logs[0].level).toBe('debug');
      expect(logs[1].level).toBe('info');
      expect(logs[2].level).toBe('warn');
      expect(logs[3].level).toBe('error');
    });

    it('supports changing log level dynamically at runtime', () => {
      expect(() => {
        logger.setLevel('debug');
        logger.setLevel('warn');
        logger.setLevel('info');
      }).not.toThrow();
    });
  });

  describe('Application Lifecycle Logging', () => {
    it('logs application startup with station and environment metadata', () => {
      logger.logStartup({ customField: 'orbital-test-run' });

      const logs = logger.getLogs();
      const startupLog = logs.find((l) => l.event === 'app.startup');
      expect(startupLog).toBeDefined();
      expect(startupLog?.level).toBe('info');
      expect(startupLog?.message).toContain('Cosmoport space ground station initialization');
      expect(startupLog?.details?.customField).toBe('orbital-test-run');
    });

    it('logs application shutdown with termination reason', () => {
      logger.logShutdown('Maintenance cycle required', { operator: 'Flight-Dir-01' });

      const logs = logger.getLogs();
      const shutdownLog = logs.find((l) => l.event === 'app.shutdown');
      expect(shutdownLog).toBeDefined();
      expect(shutdownLog?.level).toBe('warn');
      expect(shutdownLog?.message).toContain('Maintenance cycle required');
      expect(shutdownLog?.details?.operator).toBe('Flight-Dir-01');
    });
  });

  describe('Port Connection Events', () => {
    it('logs successful port connection at INFO level', () => {
      logger.logPortConnection(8080, 'connected', { endpoint: '192.168.1.50' });

      const logs = logger.getLogs();
      const connLog = logs.find((l) => l.event === 'port.connected');
      expect(connLog).toBeDefined();
      expect(connLog?.level).toBe('info');
      expect(connLog?.message).toContain('CONNECTED');
      expect(connLog?.details?.portId).toBe(8080);
    });

    it('logs listening port status at INFO level', () => {
      logger.logPortConnection('port_uhf', 'listening', { protocol: 'RADIO_UHF' });

      const log = logger.getLogs().find((l) => l.event === 'port.listening');
      expect(log).toBeDefined();
      expect(log?.level).toBe('info');
    });

    it('logs port disconnect and reconnecting at WARN level', () => {
      logger.logPortConnection(8080, 'disconnected', { reason: 'Antenna pass ended' });
      logger.logPortConnection(8080, 'reconnecting', { attempt: 2 });

      const logs = logger.getLogs();
      expect(logs[0].level).toBe('warn');
      expect(logs[0].event).toBe('port.disconnected');
      expect(logs[1].level).toBe('warn');
      expect(logs[1].event).toBe('port.reconnecting');
    });

    it('logs connection failures and timeouts at ERROR level', () => {
      logger.logPortConnection(8080, 'failed', { error: 'Handshake timeout' });
      logger.logPortConnection(8081, 'timeout', { timeoutMs: 3000 });

      const logs = logger.getLogs();
      expect(logs[0].level).toBe('error');
      expect(logs[0].event).toBe('port.failed');
      expect(logs[1].level).toBe('error');
      expect(logs[1].event).toBe('port.timeout');
    });
  });

  describe('Data Transfer Logging', () => {
    it('logs TX and RX data transfers with byte counts and direction', () => {
      logger.logDataTransfer('tx', 8080, 256, { packetType: 'TELECOMMAND' });
      logger.logDataTransfer('rx', 8080, 1024, { packetType: 'TELEMETRY' });

      const logs = logger.getLogs();
      expect(logs.length).toBe(2);
      expect(logs[0].event).toBe('data.transmitted');
      expect(logs[0].details?.direction).toBe('tx');
      expect(logs[0].details?.bytes).toBe(256);

      expect(logs[1].event).toBe('data.received');
      expect(logs[1].details?.direction).toBe('rx');
      expect(logs[1].details?.bytes).toBe(1024);
    });
  });

  describe('Error Logging', () => {
    it('logs errors with contextual tags and stack trace information', () => {
      const err = new Error('Doppler carrier tracking lost');
      logger.logError(err, 'orbital.carrier_lock', { frequencyMhz: 437.425 });

      const logs = logger.getLogs();
      const errLog = logs[0];
      expect(errLog.level).toBe('error');
      expect(errLog.event).toBe('error.orbital.carrier_lock');
      expect(errLog.error?.name).toBe('Error');
      expect(errLog.error?.message).toBe('Doppler carrier tracking lost');
      expect(errLog.error?.stack).toBeDefined();
      expect(errLog.details?.frequencyMhz).toBe(437.425);
    });
  });

  describe('Security: Credentials Redaction', () => {
    it('automatically sanitizes sensitive tokens and passwords in log details', () => {
      logger.info('Authenticating ground station uplink', {
        stationId: 'GS-01',
        apiKey: 'super-secret-key',
        satelliteAuthToken: 'secret-token-xyz',
        nested: {
          password: 'plain-password-123',
        },
      });

      const entry = logger.getLogs()[0];
      expect(entry.details?.stationId).toBe('GS-01');
      expect(entry.details?.apiKey).toBe('***REDACTED***');
      expect(entry.details?.satelliteAuthToken).toBe('***REDACTED***');
      expect((entry.details?.nested as Record<string, unknown>).password).toBe('***REDACTED***');
    });
  });

  describe('Subscriber Listeners & Buffer Management', () => {
    it('dispatches log events to subscribed listeners and supports unsubscription', () => {
      const captured: StructuredLogEntry[] = [];
      const unsubscribe = logger.subscribe((entry) => {
        captured.push(entry);
      });

      logger.info('Message 1');
      logger.warn('Message 2');
      expect(captured.length).toBe(2);

      unsubscribe();
      logger.info('Message 3 after unsubscribing');
      expect(captured.length).toBe(2);
    });

    it('supports retrieving limited log window and clearing buffer', () => {
      for (let i = 0; i < 10; i++) {
        logger.debug(`Batch log entry ${i}`);
      }

      const recentFive = logger.getLogs(5);
      expect(recentFive.length).toBe(5);
      expect(recentFive[4].message).toBe('Batch log entry 9');

      logger.clearBuffer();
      expect(logger.getLogs().length).toBe(0);
    });
  });
});
