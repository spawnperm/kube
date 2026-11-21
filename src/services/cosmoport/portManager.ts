import { logger } from '../logger';
import {
  type PortDefinition,
  type PortState,
  InvalidPortNumberError,
  PortAlreadyExistsError,
  PortNotFoundError,
} from './types';

export class PortManager {
  private ports: Map<string, PortDefinition> = new Map();
  private portNumbersInUse: Set<number> = new Set();

  constructor() {
    this.reset();
  }

  /**
   * Clears all registered ports
   */
  public reset(): void {
    this.ports.clear();
    this.portNumbersInUse.clear();
  }

  /**
   * Validates port number bounds and type
   */
  public static validatePortNumber(portNumber: unknown): number {
    if (
      typeof portNumber !== 'number' ||
      !Number.isFinite(portNumber) ||
      !Number.isInteger(portNumber)
    ) {
      throw new InvalidPortNumberError(portNumber);
    }
    if (portNumber < 1 || portNumber > 65535) {
      throw new InvalidPortNumberError(portNumber);
    }
    return portNumber;
  }

  /**
   * Registers a new communications or telemetry port
   */
  public registerPort(
    port: Omit<PortDefinition, 'currentConnections' | 'state'> & {
      state?: PortState;
      currentConnections?: number;
    },
  ): PortDefinition {
    PortManager.validatePortNumber(port.portNumber);

    if (this.ports.has(port.id)) {
      throw new PortAlreadyExistsError(port.id);
    }
    if (this.portNumbersInUse.has(port.portNumber)) {
      throw new PortAlreadyExistsError(port.portNumber);
    }

    if (!port.name || port.name.trim() === '') {
      throw new Error('Port name cannot be empty');
    }

    const newPort: PortDefinition = {
      ...port,
      state: port.state ?? 'CLOSED',
      currentConnections: port.currentConnections ?? 0,
      maxConnections: port.maxConnections > 0 ? port.maxConnections : 1,
    };

    this.ports.set(newPort.id, newPort);
    this.portNumbersInUse.add(newPort.portNumber);

    logger.debug(`Port registered: ${newPort.name} [${newPort.id}] on :${newPort.portNumber}`);
    return { ...newPort };
  }

  /**
   * Opens a port for incoming connections or listening
   */
  public async openPort(portId: string): Promise<PortDefinition> {
    const port = this.ports.get(portId);
    if (!port) {
      throw new PortNotFoundError(portId);
    }

    if (port.state === 'LISTENING' || port.state === 'CONNECTED') {
      // Idempotent return
      return { ...port };
    }

    port.state = 'LISTENING';
    logger.logPortConnection(port.portNumber, 'listening', {
      portId: port.id,
      protocol: port.protocol,
    });

    return { ...port };
  }

  /**
   * Closes an active port and sets state to CLOSED
   */
  public async closePort(portId: string): Promise<void> {
    const port = this.ports.get(portId);
    if (!port) {
      throw new PortNotFoundError(portId);
    }

    port.state = 'CLOSED';
    port.currentConnections = 0;

    logger.logPortConnection(port.portNumber, 'disconnected', {
      portId: port.id,
      reason: 'Port administratively closed',
    });
  }

  /**
   * Pauses an active port
   */
  public pausePort(portId: string): PortDefinition {
    const port = this.ports.get(portId);
    if (!port) {
      throw new PortNotFoundError(portId);
    }
    port.state = 'PAUSED';
    logger.debug(`Port [${portId}] paused`);
    return { ...port };
  }

  /**
   * Resumes a paused port
   */
  public resumePort(portId: string): PortDefinition {
    const port = this.ports.get(portId);
    if (!port) {
      throw new PortNotFoundError(portId);
    }
    port.state = 'LISTENING';
    logger.debug(`Port [${portId}] resumed`);
    return { ...port };
  }

  /**
   * Increments the connection counter for a port
   */
  public attachConnection(portId: string): void {
    const port = this.ports.get(portId);
    if (!port) {
      throw new PortNotFoundError(portId);
    }
    port.currentConnections++;
    if (port.state === 'LISTENING') {
      port.state = 'CONNECTED';
    }
  }

  /**
   * Decrements the connection counter for a port
   */
  public detachConnection(portId: string): void {
    const port = this.ports.get(portId);
    if (!port) return;
    port.currentConnections = Math.max(0, port.currentConnections - 1);
    if (port.currentConnections === 0 && port.state === 'CONNECTED') {
      port.state = 'LISTENING';
    }
  }

  /**
   * Retrieves port by ID
   */
  public getPort(portId: string): PortDefinition | undefined {
    const port = this.ports.get(portId);
    return port ? { ...port } : undefined;
  }

  /**
   * Lists all registered ports
   */
  public listPorts(): PortDefinition[] {
    return Array.from(this.ports.values()).map((p) => ({ ...p }));
  }

  /**
   * Unregisters a port completely
   */
  public unregisterPort(portId: string): boolean {
    const port = this.ports.get(portId);
    if (!port) return false;
    this.portNumbersInUse.delete(port.portNumber);
    return this.ports.delete(portId);
  }
}
