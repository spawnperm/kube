import { cosmoportConfig } from '../../config/cosmoportConfig';
import { logger } from '../logger';
import { ConnectionManager } from './connectionManager';
import { PortManager } from './portManager';

export class CosmoportHub {
  public readonly portManager: PortManager;
  public readonly connectionManager: ConnectionManager;

  constructor() {
    this.portManager = new PortManager();
    this.connectionManager = new ConnectionManager(this.portManager);
    this.initializeDefaultPorts();
  }

  public initializeDefaultPorts(): void {
    const config = cosmoportConfig.getConfig();

    this.portManager.reset();

    // 1. VHF Radio Beacon / Telemetry Port
    this.portManager.registerPort({
      id: 'port_vhf_beacon',
      portNumber: config.ports.groundStationRadio,
      name: 'VHF AX.25 Ground Beacon Port',
      protocol: 'RADIO_VHF',
      maxConnections: 12,
      baudRate: 9600,
      description: 'Primary VHF ground telemetry link port (145.800 MHz)',
    });

    // 2. UHF Telemetry Downlink Port
    this.portManager.registerPort({
      id: 'port_uhf_downlink',
      portNumber: config.ports.telemetryDownlink,
      name: 'UHF Telemetry High-Speed Downlink',
      protocol: 'RADIO_UHF',
      maxConnections: 8,
      baudRate: 19200,
      description: 'CubeSat orbital telemetry downlink packet stream',
    });

    // 3. Command Uplink Port
    this.portManager.registerPort({
      id: 'port_cmd_uplink',
      portNumber: config.ports.commandUplink,
      name: 'Ground Command Telecommand Uplink',
      protocol: 'TCP',
      maxConnections: 2,
      description: 'Secure telecommand uplink for mission payload execution',
    });

    // 4. Docking & Inter-Satellite Telemetry Port
    this.portManager.registerPort({
      id: 'port_docking_telemetry',
      portNumber: config.ports.dockingTelemetry,
      name: 'Orbital Docking Telemetry Gateway',
      protocol: 'WEBSOCKET',
      maxConnections: 16,
      description: 'Multipoint WebSocket bridge for orbital docking rendezvous',
    });
  }

  public async startup(): Promise<void> {
    logger.logStartup({
      station: cosmoportConfig.getConfig().stationName,
      portsCount: this.portManager.listPorts().length,
    });

    // Auto-open primary telemetry ports
    await this.portManager.openPort('port_vhf_beacon');
    await this.portManager.openPort('port_uhf_downlink');
  }

  public async shutdown(reason = 'System shutdown'): Promise<void> {
    this.connectionManager.reset();
    for (const port of this.portManager.listPorts()) {
      if (port.state !== 'CLOSED') {
        await this.portManager.closePort(port.id);
      }
    }
    logger.logShutdown(reason);
  }
}

export const cosmoportHub = new CosmoportHub();

export * from './types';
export * from './portManager';
export * from './connectionManager';
export * from './dataTransformer';
