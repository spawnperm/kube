import { describe, it, expect, beforeEach } from 'vitest';
import { PortManager } from './portManager';
import { InvalidPortNumberError, PortAlreadyExistsError, PortNotFoundError } from './types';

describe('PortManager: Cosmoport Port Lifecycle & Handling', () => {
  let portManager: PortManager;

  beforeEach(() => {
    portManager = new PortManager();
  });

  describe('Port Number Validation', () => {
    it('accepts valid port numbers between 1 and 65535', () => {
      expect(PortManager.validatePortNumber(1)).toBe(1);
      expect(PortManager.validatePortNumber(3000)).toBe(3000);
      expect(PortManager.validatePortNumber(65535)).toBe(65535);
    });

    it('rejects port numbers out of bounds (< 1 or > 65535)', () => {
      expect(() => PortManager.validatePortNumber(0)).toThrow(InvalidPortNumberError);
      expect(() => PortManager.validatePortNumber(-80)).toThrow(InvalidPortNumberError);
      expect(() => PortManager.validatePortNumber(65536)).toThrow(InvalidPortNumberError);
      expect(() => PortManager.validatePortNumber(100000)).toThrow(InvalidPortNumberError);
    });

    it('rejects invalid types: floats, NaN, strings, null, undefined', () => {
      expect(() => PortManager.validatePortNumber(8080.5)).toThrow(InvalidPortNumberError);
      expect(() => PortManager.validatePortNumber(Number.NaN)).toThrow(InvalidPortNumberError);
      expect(() => PortManager.validatePortNumber(Number.POSITIVE_INFINITY)).toThrow(
        InvalidPortNumberError,
      );
      expect(() => PortManager.validatePortNumber('8080')).toThrow(InvalidPortNumberError);
      expect(() => PortManager.validatePortNumber(null)).toThrow(InvalidPortNumberError);
      expect(() => PortManager.validatePortNumber(undefined)).toThrow(InvalidPortNumberError);
    });
  });

  describe('Port Registration & Collision Protection', () => {
    it('registers valid communications port and initializes state to CLOSED by default', () => {
      const port = portManager.registerPort({
        id: 'port_vhf_1',
        portNumber: 14580,
        name: 'VHF AX.25 Link',
        protocol: 'RADIO_VHF',
        maxConnections: 5,
      });

      expect(port.id).toBe('port_vhf_1');
      expect(port.portNumber).toBe(14580);
      expect(port.state).toBe('CLOSED');
      expect(port.currentConnections).toBe(0);
      expect(port.maxConnections).toBe(5);

      const listed = portManager.listPorts();
      expect(listed.length).toBe(1);
      expect(listed[0].id).toBe('port_vhf_1');
    });

    it('throws PortAlreadyExistsError when registering duplicate port ID', () => {
      portManager.registerPort({
        id: 'port_uhf',
        portNumber: 43500,
        name: 'UHF Downlink',
        protocol: 'RADIO_UHF',
        maxConnections: 4,
      });

      expect(() => {
        portManager.registerPort({
          id: 'port_uhf',
          portNumber: 43501,
          name: 'Another UHF Port with same ID',
          protocol: 'RADIO_UHF',
          maxConnections: 4,
        });
      }).toThrow(PortAlreadyExistsError);
    });

    it('throws PortAlreadyExistsError when registering conflicting port number', () => {
      portManager.registerPort({
        id: 'port_primary',
        portNumber: 8080,
        name: 'Primary Telemetry',
        protocol: 'TCP',
        maxConnections: 2,
      });

      expect(() => {
        portManager.registerPort({
          id: 'port_secondary',
          portNumber: 8080, // Conflict!
          name: 'Secondary Telemetry on same port number',
          protocol: 'TCP',
          maxConnections: 2,
        });
      }).toThrow(PortAlreadyExistsError);
    });

    it('throws error when port name is empty or blank', () => {
      expect(() => {
        portManager.registerPort({
          id: 'port_invalid',
          portNumber: 9001,
          name: '   ',
          protocol: 'UDP',
          maxConnections: 1,
        });
      }).toThrow('Port name cannot be empty');
    });
  });

  describe('Port Lifecycle: Open, Close, Pause, Resume', () => {
    beforeEach(() => {
      portManager.registerPort({
        id: 'port_cmd',
        portNumber: 9050,
        name: 'Command Telecommand Port',
        protocol: 'TCP',
        maxConnections: 3,
      });
    });

    it('opens port and transitions state to LISTENING', async () => {
      const opened = await portManager.openPort('port_cmd');
      expect(opened.state).toBe('LISTENING');

      const current = portManager.getPort('port_cmd');
      expect(current?.state).toBe('LISTENING');
    });

    it('is idempotent when opening an already open port', async () => {
      await portManager.openPort('port_cmd');
      const secondOpen = await portManager.openPort('port_cmd');
      expect(secondOpen.state).toBe('LISTENING');
    });

    it('throws PortNotFoundError when opening non-existent port', async () => {
      await expect(portManager.openPort('unknown_port_xyz')).rejects.toThrow(PortNotFoundError);
    });

    it('closes port, resets active connections and transitions state to CLOSED', async () => {
      await portManager.openPort('port_cmd');
      portManager.attachConnection('port_cmd');
      expect(portManager.getPort('port_cmd')?.currentConnections).toBe(1);

      await portManager.closePort('port_cmd');
      const closed = portManager.getPort('port_cmd');
      expect(closed?.state).toBe('CLOSED');
      expect(closed?.currentConnections).toBe(0);
    });

    it('throws PortNotFoundError when closing non-existent port', async () => {
      await expect(portManager.closePort('unknown_port_xyz')).rejects.toThrow(PortNotFoundError);
    });

    it('pauses and resumes port correctly', async () => {
      await portManager.openPort('port_cmd');
      const paused = portManager.pausePort('port_cmd');
      expect(paused.state).toBe('PAUSED');

      const resumed = portManager.resumePort('port_cmd');
      expect(resumed.state).toBe('LISTENING');
    });
  });

  describe('Connection Counter & State Synchronization', () => {
    it('manages connection attachments and state transitions', async () => {
      portManager.registerPort({
        id: 'port_link',
        portNumber: 12000,
        name: 'Radio Link',
        protocol: 'UDP',
        maxConnections: 2,
      });

      await portManager.openPort('port_link');
      expect(portManager.getPort('port_link')?.state).toBe('LISTENING');

      // Attach first connection -> transitions to CONNECTED
      portManager.attachConnection('port_link');
      let port = portManager.getPort('port_link');
      expect(port?.currentConnections).toBe(1);
      expect(port?.state).toBe('CONNECTED');

      // Attach second connection
      portManager.attachConnection('port_link');
      port = portManager.getPort('port_link');
      expect(port?.currentConnections).toBe(2);

      // Detach one connection -> stays CONNECTED because 1 remains
      portManager.detachConnection('port_link');
      port = portManager.getPort('port_link');
      expect(port?.currentConnections).toBe(1);
      expect(port?.state).toBe('CONNECTED');

      // Detach last connection -> reverts back to LISTENING
      portManager.detachConnection('port_link');
      port = portManager.getPort('port_link');
      expect(port?.currentConnections).toBe(0);
      expect(port?.state).toBe('LISTENING');
    });
  });

  describe('Unregistering & Resetting', () => {
    it('unregisters port and releases port number for reuse', () => {
      portManager.registerPort({
        id: 'temp_port',
        portNumber: 7777,
        name: 'Temporary Port',
        protocol: 'TCP',
        maxConnections: 1,
      });

      expect(portManager.unregisterPort('temp_port')).toBe(true);
      expect(portManager.getPort('temp_port')).toBeUndefined();

      // Can now register another port on same portNumber 7777 without collision
      expect(() => {
        portManager.registerPort({
          id: 'new_port',
          portNumber: 7777,
          name: 'New Port on Reused Number',
          protocol: 'TCP',
          maxConnections: 1,
        });
      }).not.toThrow();
    });

    it('returns false when unregistering non-existent port', () => {
      expect(portManager.unregisterPort('non_existent')).toBe(false);
    });
  });
});
