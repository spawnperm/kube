import pino, { Logger as PinoLogger } from 'pino';
import { cosmoportConfig } from '../config/cosmoportConfig';
import type { LogLevel } from '../config/types';

export interface StructuredLogEntry {
  id: string;
  time: string;
  level: LogLevel;
  event: string;
  message: string;
  details?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export type LogListener = (entry: StructuredLogEntry) => void;

class CosmoportLoggerService {
  private pinoInstance: PinoLogger;
  private memoryBuffer: StructuredLogEntry[] = [];
  private readonly maxBufferSize = 300;
  private listeners: Set<LogListener> = new Set();

  constructor() {
    const config = cosmoportConfig.getConfig();
    this.pinoInstance = this.createPinoInstance(config.logging.level);
  }

  private createPinoInstance(level: LogLevel): PinoLogger {
    return pino({
      level,
      browser: {
        asObject: true,
      },
      redact: {
        paths: [
          'apiKey',
          'token',
          'satelliteAuthToken',
          'groundStationSecret',
          'secret',
          'password',
          'authorization',
          'encryptionKey',
          'credentials.apiKey',
          'credentials.satelliteAuthToken',
          'credentials.groundStationSecret',
        ],
        censor: '***REDACTED***',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  /**
   * Reconfigures logger log level at runtime
   */
  public setLevel(level: LogLevel): void {
    this.pinoInstance.level = level;
  }

  /**
   * Subscribes to new structured log entries
   */
  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Returns copy of recent in-memory log buffer
   */
  public getLogs(limit?: number): StructuredLogEntry[] {
    if (limit && limit > 0) {
      return this.memoryBuffer.slice(-limit);
    }
    return [...this.memoryBuffer];
  }

  /**
   * Clears the in-memory log buffer
   */
  public clearBuffer(): void {
    this.memoryBuffer = [];
  }

  private emitEntry(
    level: LogLevel,
    event: string,
    message: string,
    details?: Record<string, unknown>,
    errorObj?: Error,
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      time: new Date().toISOString(),
      level,
      event,
      message,
      details: details ? this.sanitizeDetails(details) : undefined,
      error: errorObj
        ? {
            name: errorObj.name,
            message: errorObj.message,
            stack: errorObj.stack,
          }
        : undefined,
    };

    // Append to circular buffer
    this.memoryBuffer.push(entry);
    if (this.memoryBuffer.length > this.maxBufferSize) {
      this.memoryBuffer.shift();
    }

    // Call subscribers
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch (err) {
        console.error('Log listener error:', err);
      }
    }

    return entry;
  }

  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const copy: Record<string, unknown> = {};
    const sensitiveKeys = new Set([
      'apikey',
      'token',
      'satelliteauthtoken',
      'groundstationsecret',
      'secret',
      'password',
      'authorization',
      'encryptionkey',
    ]);

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        copy[key] = '***REDACTED***';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        copy[key] = this.sanitizeDetails(value as Record<string, unknown>);
      } else {
        copy[key] = value;
      }
    }
    return copy;
  }

  // --- High-level semantic logging methods ---

  public logStartup(metadata?: Record<string, unknown>): void {
    const message = `Cosmoport space ground station initialization started`;
    const details = {
      station: cosmoportConfig.getConfig().stationName,
      environment: cosmoportConfig.getConfig().environment,
      ports: cosmoportConfig.getConfig().ports,
      ...metadata,
    };
    this.pinoInstance.info({ event: 'app.startup', ...details }, message);
    this.emitEntry('info', 'app.startup', message, details);
  }

  public logShutdown(reason = 'Normal termination', metadata?: Record<string, unknown>): void {
    const message = `Cosmoport space ground station shutting down: ${reason}`;
    const details = { reason, ...metadata };
    this.pinoInstance.warn({ event: 'app.shutdown', ...details }, message);
    this.emitEntry('warn', 'app.shutdown', message, details);
  }

  public logPortConnection(
    portId: string | number,
    status: 'connected' | 'disconnected' | 'failed' | 'timeout' | 'reconnecting' | 'listening',
    details?: Record<string, unknown>,
  ): void {
    const event = `port.${status}`;
    const message = `Port [${portId}] status changed: ${status.toUpperCase()}`;
    const payload = { portId, status, ...details };

    if (status === 'connected' || status === 'listening') {
      this.pinoInstance.info({ event, ...payload }, message);
      this.emitEntry('info', event, message, payload);
    } else if (status === 'disconnected' || status === 'reconnecting') {
      this.pinoInstance.warn({ event, ...payload }, message);
      this.emitEntry('warn', event, message, payload);
    } else {
      // failed or timeout
      this.pinoInstance.error({ event, ...payload }, message);
      this.emitEntry('error', event, message, payload);
    }
  }

  public logDataTransfer(
    direction: 'tx' | 'rx',
    portId: string | number,
    bytes: number,
    details?: Record<string, unknown>,
  ): void {
    const event = `data.${direction === 'tx' ? 'transmitted' : 'received'}`;
    const message = `Data transfer [${direction.toUpperCase()}] on Port ${portId}: ${bytes} bytes`;
    const payload = { direction, portId, bytes, ...details };

    this.pinoInstance.debug({ event, ...payload }, message);
    this.emitEntry('debug', event, message, payload);
  }

  public logError(
    error: Error | string,
    context = 'general',
    metadata?: Record<string, unknown>,
  ): void {
    const errObj = typeof error === 'string' ? new Error(error) : error;
    const event = `error.${context}`;
    const message = `Error in [${context}]: ${errObj.message}`;
    const payload = { context, ...metadata };

    this.pinoInstance.error({ event, err: errObj, ...payload }, message);
    this.emitEntry('error', event, message, payload, errObj);
  }

  // --- Standard generic logging methods ---

  public debug(message: string, details?: Record<string, unknown>): void {
    this.pinoInstance.debug(details || {}, message);
    this.emitEntry('debug', 'custom.debug', message, details);
  }

  public info(message: string, details?: Record<string, unknown>): void {
    this.pinoInstance.info(details || {}, message);
    this.emitEntry('info', 'custom.info', message, details);
  }

  public warn(message: string, details?: Record<string, unknown>): void {
    this.pinoInstance.warn(details || {}, message);
    this.emitEntry('warn', 'custom.warn', message, details);
  }

  public error(message: string, error?: Error | unknown, details?: Record<string, unknown>): void {
    const errObj = error instanceof Error ? error : undefined;
    this.pinoInstance.error({ err: error, ...(details || {}) }, message);
    this.emitEntry('error', 'custom.error', message, details, errObj);
  }
}

export const logger = new CosmoportLoggerService();
