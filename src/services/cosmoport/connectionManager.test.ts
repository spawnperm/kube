import { describe, it, expect, beforeEach } from 'vitest';
import { cosmoportConfig } from '../../config/cosmoportConfig';
import { ConnectionManager } from './connectionManager';
import { PortManager } from './portManager';
import {
  AuthenticationFailedError,
  ConnectionTimeoutError,
  MaxConnectionsExceededError,
  PortClosedError,
  PortNotFoundError,
} from './types';

describe('ConnectionManager: Cosmoport Connection Handling', () => {
  let portManager: PortManager;
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    cosmoportConfig.resetToDefaults();
    portManager = new PortManager();
    connectionManager = new ConnectionManager(portManager);

    portManager.registerPort({
      id: 'port_telemetry',
      portNumber: 8080,
      name: 'Telemetry Link Port',
      protocol: 'TCP',
      maxConnections: 2,
    });
  });

  describe('Connection Establishment & Handshake', () => {
    it('successfully connects to open port with simulated flight latency', async () => {
      await portManager.openPort('port_telemetry');

      const session = await connectionManager.connect('port_telemetry', 'cubesat-orbit-node-1', {
        simulateLatencyMs: 5,
      });

      expect(session.id).toBeDefined();
      expect(session.portId).toBe('port_telemetry');
      expect(session.remoteEndpoint).toBe('cubesat-orbit-node-1');
      expect(session.state).toBe('CONNECTED');
      expect(session.authVerified).toBe(true);
      expect(session.packetsSent).toBe(1); // SYN
      expect(session.packetsReceived).toBe(1); // ACK
      expect(session.bytesSent).toBe(64);
      expect(session.bytesReceived).toBe(64);

      // Port counter incremented
      expect(portManager.getPort('port_telemetry')?.currentConnections).toBe(1);
    });

    it('throws PortClosedError when attempting connection to CLOSED port', async () => {
      // Port is closed by default
      await expect(
        connectionManager.connect('port_telemetry', 'cubesat-orbit-node-1'),
      ).rejects.toThrow(PortClosedError);
    });

    it('throws PortNotFoundError when connecting to non-existent port', async () => {
      await expect(
        connectionManager.connect('unknown_port', 'cubesat-orbit-node-1'),
      ).rejects.toThrow(PortNotFoundError);
    });

    it('throws MaxConnectionsExceededError when port capacity is saturated', async () => {
      await portManager.openPort('port_telemetry');

      // Port maxConnections is 2
      await connectionManager.connect('port_telemetry', 'node-1', { simulateLatencyMs: 1 });
      await connectionManager.connect('port_telemetry', 'node-2', { simulateLatencyMs: 1 });

      // Third connection attempt must fail
      await expect(
        connectionManager.connect('port_telemetry', 'node-3', { simulateLatencyMs: 1 }),
      ).rejects.toThrow(MaxConnectionsExceededError);
    });

    it('throws ConnectionTimeoutError when handshake exceeds timeout threshold', async () => {
      await portManager.openPort('port_telemetry');

      // Handshake latency 50ms, timeout limit 10ms
      await expect(
        connectionManager.connect('port_telemetry', 'distant-deep-space-probe', {
          timeoutMs: 10,
          simulateLatencyMs: 50,
        }),
      ).rejects.toThrow(ConnectionTimeoutError);
    });
  });

  describe('Authentication & Security', () => {
    beforeEach(() => {
      cosmoportConfig.mergeConfig({
        credentials: {
          satelliteAuthToken: 'orbital-sat-auth-key-42',
          groundStationSecret: 'perm-gs-secret-99',
        },
      });
    });

    it('successfully connects when valid credentials are supplied', async () => {
      await portManager.openPort('port_telemetry');

      const session = await connectionManager.connect('port_telemetry', 'cubesat-authorized', {
        simulateLatencyMs: 1,
        credentials: {
          token: 'orbital-sat-auth-key-42',
          secret: 'perm-gs-secret-99',
        },
      });

      expect(session.state).toBe('CONNECTED');
      expect(session.authVerified).toBe(true);
    });

    it('throws AuthenticationFailedError when credentials are missing', async () => {
      await portManager.openPort('port_telemetry');

      await expect(
        connectionManager.connect('port_telemetry', 'cubesat-no-creds', {
          simulateLatencyMs: 1,
        }),
      ).rejects.toThrow(AuthenticationFailedError);
    });

    it('throws AuthenticationFailedError when token is incorrect', async () => {
      await portManager.openPort('port_telemetry');

      await expect(
        connectionManager.connect('port_telemetry', 'cubesat-bad-token', {
          simulateLatencyMs: 1,
          credentials: {
            token: 'wrong-token',
            secret: 'perm-gs-secret-99',
          },
        }),
      ).rejects.toThrow(AuthenticationFailedError);
    });

    it('throws AuthenticationFailedError when secret is incorrect', async () => {
      await portManager.openPort('port_telemetry');

      await expect(
        connectionManager.connect('port_telemetry', 'cubesat-bad-secret', {
          simulateLatencyMs: 1,
          credentials: {
            token: 'orbital-sat-auth-key-42',
            secret: 'invalid-secret',
          },
        }),
      ).rejects.toThrow(AuthenticationFailedError);
    });
  });

  describe('Data Transfer over Connection', () => {
    it('transmits and receives data, updating metrics on active session', async () => {
      await portManager.openPort('port_telemetry');
      const session = await connectionManager.connect('port_telemetry', 'station-alpha', {
        simulateLatencyMs: 1,
      });

      // Send payload
      const sendResult = await connectionManager.sendData(session.id, 'PING_TELECOMMAND_BEACON');
      expect(sendResult.packetsSent).toBe(2); // 1 from handshake + 1
      expect(sendResult.bytesSent).toBeGreaterThan(64);

      // Receive payload
      const rxResult = connectionManager.receiveData(
        session.id,
        new Uint8Array([0xeb, 0x90, 0x01, 0x02]),
      );
      expect(rxResult.packetsReceived).toBe(2);
      expect(rxResult.bytesReceived).toBe(68); // 64 + 4

      const updatedSession = connectionManager.getSession(session.id);
      expect(updatedSession?.packetsSent).toBe(2);
      expect(updatedSession?.packetsReceived).toBe(2);
    });

    it('throws error when trying to send data over non-existent or disconnected session', async () => {
      await expect(connectionManager.sendData('invalid_session_id', 'TEST_DATA')).rejects.toThrow(
        'Connection session not found',
      );

      await portManager.openPort('port_telemetry');
      const session = await connectionManager.connect('port_telemetry', 'node-temp', {
        simulateLatencyMs: 1,
      });
      await connectionManager.disconnect(session.id);

      await expect(connectionManager.sendData(session.id, 'TEST_DATA')).rejects.toThrow(
        /Cannot send data on connection with state: DISCONNECTED/,
      );
    });
  });

  describe('Ping Heartbeat & Disconnect', () => {
    it('measures RTT with ping and updates heartbeat timestamp', async () => {
      await portManager.openPort('port_telemetry');
      const session = await connectionManager.connect('port_telemetry', 'satellite-beacon', {
        simulateLatencyMs: 1,
      });

      const pingResult = await connectionManager.ping(session.id);
      expect(pingResult.rttMs).toBeGreaterThanOrEqual(1);
      expect(pingResult.snrDb).toBeGreaterThan(0);
    });

    it('disconnects session cleanly and decrements port connection count', async () => {
      await portManager.openPort('port_telemetry');
      const session = await connectionManager.connect('port_telemetry', 'cubesat-node', {
        simulateLatencyMs: 1,
      });

      expect(portManager.getPort('port_telemetry')?.currentConnections).toBe(1);

      await connectionManager.disconnect(session.id, 'Pass completed');
      const updated = connectionManager.getSession(session.id);
      expect(updated?.state).toBe('DISCONNECTED');
      expect(updated?.disconnectedAt).toBeDefined();

      expect(portManager.getPort('port_telemetry')?.currentConnections).toBe(0);
    });
  });

  describe('Reconnection & Exponential Backoff', () => {
    it('reconnects after disconnect and increments attempt counter', async () => {
      await portManager.openPort('port_telemetry');
      const session = await connectionManager.connect('port_telemetry', 'cubesat-reconn', {
        simulateLatencyMs: 1,
      });

      await connectionManager.disconnect(session.id);
      const reconnected = await connectionManager.attemptReconnect(session.id);

      expect(reconnected.state).toBe('CONNECTED');
      expect(reconnected.reconnectAttempts).toBe(1);
      expect(portManager.getPort('port_telemetry')?.currentConnections).toBe(1);
    });

    it('permanently marks connection as FAILED when maxReconnectAttempts is exceeded', async () => {
      cosmoportConfig.mergeConfig({
        connections: {
          maxReconnectAttempts: 2,
        },
      });

      await portManager.openPort('port_telemetry');
      const session = await connectionManager.connect('port_telemetry', 'cubesat-unstable', {
        simulateLatencyMs: 1,
      });
      await connectionManager.disconnect(session.id);

      // Attempt 1
      await connectionManager.attemptReconnect(session.id);
      await connectionManager.disconnect(session.id);

      // Attempt 2
      await connectionManager.attemptReconnect(session.id);
      await connectionManager.disconnect(session.id);

      // Attempt 3: exceeds max limit of 2
      const failed = await connectionManager.attemptReconnect(session.id);
      expect(failed.state).toBe('FAILED');
      expect(failed.error).toContain('Max reconnection attempts');
    });
  });
});
