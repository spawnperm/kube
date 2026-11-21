import { logger } from '../logger';
import { cosmoportConfig } from '../../config/cosmoportConfig';
import type { PortManager } from './portManager';
import {
  type ConnectionSession,
  AuthenticationFailedError,
  ConnectionTimeoutError,
  MaxConnectionsExceededError,
  PortClosedError,
  PortNotFoundError,
} from './types';

export interface ConnectOptions {
  timeoutMs?: number;
  credentials?: {
    token?: string;
    secret?: string;
  };
  simulateLatencyMs?: number;
  autoReconnect?: boolean;
}

export class ConnectionManager {
  private sessions: Map<string, ConnectionSession> = new Map();

  constructor(private portManager: PortManager) {}

  /**
   * Initiates a connection over a registered port
   */
  public async connect(
    portId: string,
    remoteEndpoint: string,
    options: ConnectOptions = {},
  ): Promise<ConnectionSession> {
    const port = this.portManager.getPort(portId);
    if (!port) {
      throw new PortNotFoundError(portId);
    }

    if (port.state === 'CLOSED') {
      throw new PortClosedError(portId);
    }

    if (port.currentConnections >= port.maxConnections) {
      throw new MaxConnectionsExceededError(portId, port.maxConnections);
    }

    const config = cosmoportConfig.getConfig();
    const timeoutMs = options.timeoutMs ?? config.connections.handshakeTimeoutMs;

    const sessionId = `conn_${port.portNumber}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const session: ConnectionSession = {
      id: sessionId,
      portId,
      remoteEndpoint,
      state: 'CONNECTING',
      bytesSent: 0,
      bytesReceived: 0,
      packetsSent: 0,
      packetsReceived: 0,
      latencyMs: options.simulateLatencyMs ?? 24,
      snrDb: 18.5,
      reconnectAttempts: 0,
      authVerified: false,
    };

    this.sessions.set(sessionId, session);

    try {
      // 1. Handshake Phase with timeout guard
      session.state = 'HANDSHAKING';
      await this.runWithTimeout(
        this.performHandshake(session, options.simulateLatencyMs),
        timeoutMs,
        remoteEndpoint,
      );

      // 2. Authentication Phase
      session.state = 'AUTHENTICATING';
      this.verifyCredentials(session, options.credentials);
      session.authVerified = true;

      // 3. Mark as Connected
      session.state = 'CONNECTED';
      session.connectedAt = Date.now();
      session.lastHeartbeatAt = Date.now();

      this.portManager.attachConnection(portId);

      logger.logPortConnection(port.portNumber, 'connected', {
        sessionId: session.id,
        remoteEndpoint: session.remoteEndpoint,
        latencyMs: session.latencyMs,
      });

      return { ...session };
    } catch (err) {
      session.state = 'FAILED';
      session.error = err instanceof Error ? err.message : String(err);

      logger.logPortConnection(port.portNumber, 'failed', {
        sessionId: session.id,
        remoteEndpoint: session.remoteEndpoint,
        error: session.error,
      });

      throw err;
    }
  }

  private async performHandshake(session: ConnectionSession, latency = 15): Promise<void> {
    // Simulates handshake flight time
    await new Promise((resolve) => setTimeout(resolve, latency));
    session.packetsSent++;
    session.packetsReceived++;
    session.bytesSent += 64; // SYN
    session.bytesReceived += 64; // ACK
  }

  private verifyCredentials(
    _session: ConnectionSession,
    credentials?: { token?: string; secret?: string },
  ): void {
    const config = cosmoportConfig.getConfig();
    const requiredToken = config.credentials.satelliteAuthToken;
    const requiredSecret = config.credentials.groundStationSecret;

    // If no credentials configured on ground station, open connection is permitted
    if (!requiredToken && !requiredSecret) {
      return;
    }

    if (!credentials) {
      throw new AuthenticationFailedError('Missing authentication credentials');
    }

    if (requiredToken && credentials.token !== requiredToken) {
      throw new AuthenticationFailedError('Invalid satellite authorization token');
    }

    if (requiredSecret && credentials.secret !== requiredSecret) {
      throw new AuthenticationFailedError('Invalid ground station secret');
    }
  }

  private async runWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    endpoint: string,
  ): Promise<T> {
    if (timeoutMs <= 0) {
      return promise;
    }

    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new ConnectionTimeoutError(endpoint, timeoutMs));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer!);
      return result;
    } catch (err) {
      clearTimeout(timer!);
      throw err;
    }
  }

  /**
   * Sends data over active connection session
   */
  public async sendData(
    sessionId: string,
    data: Uint8Array | string,
  ): Promise<{ bytesSent: number; packetsSent: number }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Connection session not found: ${sessionId}`);
    }
    if (session.state !== 'CONNECTED') {
      throw new Error(`Cannot send data on connection with state: ${session.state}`);
    }

    const byteLength =
      typeof data === 'string' ? new TextEncoder().encode(data).length : data.byteLength;
    session.bytesSent += byteLength;
    session.packetsSent += 1;
    session.lastHeartbeatAt = Date.now();

    const port = this.portManager.getPort(session.portId);
    if (port) {
      logger.logDataTransfer('tx', port.portNumber, byteLength, {
        sessionId,
        endpoint: session.remoteEndpoint,
      });
    }

    return { bytesSent: session.bytesSent, packetsSent: session.packetsSent };
  }

  /**
   * Records received data on active connection session
   */
  public receiveData(
    sessionId: string,
    data: Uint8Array | string,
  ): { bytesReceived: number; packetsReceived: number } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Connection session not found: ${sessionId}`);
    }
    if (session.state !== 'CONNECTED') {
      throw new Error(`Cannot receive data on connection with state: ${session.state}`);
    }

    const byteLength =
      typeof data === 'string' ? new TextEncoder().encode(data).length : data.byteLength;
    session.bytesReceived += byteLength;
    session.packetsReceived += 1;
    session.lastHeartbeatAt = Date.now();

    const port = this.portManager.getPort(session.portId);
    if (port) {
      logger.logDataTransfer('rx', port.portNumber, byteLength, {
        sessionId,
        endpoint: session.remoteEndpoint,
      });
    }

    return { bytesReceived: session.bytesReceived, packetsReceived: session.packetsReceived };
  }

  /**
   * Heartbeat ping to check connection health and measure RTT
   */
  public async ping(sessionId: string): Promise<{ rttMs: number; snrDb: number }> {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== 'CONNECTED') {
      throw new Error(`Cannot ping inactive session: ${sessionId}`);
    }

    const start = Date.now();
    await new Promise((r) => setTimeout(r, 10));
    const rtt = Math.max(1, Date.now() - start);

    session.latencyMs = rtt;
    session.lastHeartbeatAt = Date.now();
    return { rttMs: session.latencyMs, snrDb: session.snrDb };
  }

  /**
   * Disconnects a session cleanly
   */
  public async disconnect(sessionId: string, reason = 'Client disconnected'): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.state = 'DISCONNECTED';
    session.disconnectedAt = Date.now();

    this.portManager.detachConnection(session.portId);

    const port = this.portManager.getPort(session.portId);
    if (port) {
      logger.logPortConnection(port.portNumber, 'disconnected', {
        sessionId,
        reason,
        totalBytesSent: session.bytesSent,
        totalBytesReceived: session.bytesReceived,
      });
    }
  }

  /**
   * Attempts automatic reconnection with exponential backoff
   */
  public async attemptReconnect(
    sessionId: string,
    _options: ConnectOptions = {},
  ): Promise<ConnectionSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const config = cosmoportConfig.getConfig();
    const maxAttempts = config.connections.maxReconnectAttempts;

    if (session.reconnectAttempts >= maxAttempts) {
      session.state = 'FAILED';
      session.error = `Max reconnection attempts (${maxAttempts}) exceeded`;
      const port = this.portManager.getPort(session.portId);
      if (port) {
        logger.logPortConnection(port.portNumber, 'failed', {
          sessionId,
          reason: session.error,
        });
      }
      return { ...session };
    }

    session.state = 'RECONNECTING';
    session.reconnectAttempts++;

    const port = this.portManager.getPort(session.portId);
    if (port) {
      logger.logPortConnection(port.portNumber, 'reconnecting', {
        sessionId,
        attempt: session.reconnectAttempts,
        maxAttempts,
      });
    }

    // Exponential backoff
    const backoffMs =
      config.connections.reconnectBackoffMs * Math.pow(1.5, session.reconnectAttempts - 1);
    await new Promise((r) => setTimeout(r, Math.min(backoffMs, 50)));

    try {
      session.state = 'CONNECTED';
      session.connectedAt = Date.now();
      session.lastHeartbeatAt = Date.now();
      session.error = undefined;

      this.portManager.attachConnection(session.portId);

      if (port) {
        logger.logPortConnection(port.portNumber, 'connected', {
          sessionId,
          reconnectSuccessful: true,
        });
      }

      return { ...session };
    } catch (err) {
      session.state = 'FAILED';
      session.error = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  /**
   * Retrieves active session by ID
   */
  public getSession(sessionId: string): ConnectionSession | undefined {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : undefined;
  }

  /**
   * Lists all sessions
   */
  public listSessions(): ConnectionSession[] {
    return Array.from(this.sessions.values()).map((s) => ({ ...s }));
  }

  /**
   * Resets all connections
   */
  public reset(): void {
    for (const session of this.sessions.values()) {
      if (session.state === 'CONNECTED') {
        this.portManager.detachConnection(session.portId);
      }
    }
    this.sessions.clear();
  }
}
