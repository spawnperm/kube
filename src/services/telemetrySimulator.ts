import type { TelemetryPacket } from '../types';

export type TelemetryMode = TelemetryPacket['mode'];

export interface GroundStation {
  name: string;
  city: string;
  lat: number;
  lon: number;
  active: boolean;
}

export const GROUND_STATIONS: GroundStation[] = [
  { name: 'GS-01 Пермь-Лицей', city: 'Пермь', lat: 58.01, lon: 56.25, active: true },
  { name: 'GS-02 Москва-МГТУ', city: 'Москва', lat: 55.75, lon: 37.61, active: true },
  {
    name: 'GS-03 Восток-Амур',
    city: 'Циолковский / Восточный',
    lat: 51.81,
    lon: 128.33,
    active: true,
  },
  { name: 'GS-04 Байконур-Спутник', city: 'Байконур', lat: 45.96, lon: 63.3, active: true },
  { name: 'GS-05 Новосибирск-РАН', city: 'Новосибирск', lat: 55.01, lon: 82.93, active: true },
];

const R_EARTH = 6371; // km
const MU_EARTH = 398600.4418; // km^3 / s^2
const NOMINAL_ALTITUDE = 525; // km
const INCLINATION_RAD = (97.4 * Math.PI) / 180;
const EARTH_ROTATION_DEG_PER_SEC = 360 / 86164;
const GROUND_STATION_FOOTPRINT_KM = 1400;

export interface OrbitPoint {
  lat: number;
  lon: number;
}

export function generateOrbitGroundTrack(pointsCount = 72): OrbitPoint[] {
  const points: OrbitPoint[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const theta = (i / pointsCount) * 2 * Math.PI;
    const lat = Math.asin(Math.sin(INCLINATION_RAD) * Math.sin(theta)) * (180 / Math.PI);

    const elapsedSec = (i * 95.12 * 60) / pointsCount;
    let lon =
      (Math.atan2(Math.cos(INCLINATION_RAD) * Math.sin(theta), Math.cos(theta)) * (180 / Math.PI) -
        EARTH_ROTATION_DEG_PER_SEC * elapsedSec) %
      360;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;

    points.push({ lat: +lat.toFixed(2), lon: +lon.toFixed(2) });
  }

  return points;
}

export class TelemetrySimulator {
  private simTime = Date.now();
  private orbitAngle = 1.25;
  private packetCounter = 48291;
  private attitudeRoll = 1.2;
  private attitudePitch = -0.8;
  private attitudeYaw = 42.5;

  generateInitialPacket(): TelemetryPacket {
    return this.calculatePacketAtAngle(this.orbitAngle, 'NORMAL', 0);
  }

  getNextPacket(
    _prev: TelemetryPacket,
    timeStepSeconds = 1,
    forceMode?: TelemetryMode,
  ): TelemetryPacket {
    this.simTime += timeStepSeconds * 1000;
    this.packetCounter++;

    const a = R_EARTH + NOMINAL_ALTITUDE;
    const meanMotion = Math.sqrt(MU_EARTH / Math.pow(a, 3));

    this.orbitAngle += meanMotion * timeStepSeconds;
    if (this.orbitAngle > 2 * Math.PI) {
      this.orbitAngle -= 2 * Math.PI;
    }

    return this.calculatePacketAtAngle(this.orbitAngle, forceMode, timeStepSeconds);
  }

  private calculatePacketAtAngle(
    theta: number,
    forceMode?: TelemetryMode,
    timeStepSeconds = 1,
  ): TelemetryPacket {
    const altitude = 524.8 + Math.sin(theta * 2) * 4.2;
    const velocity = Math.sqrt(MU_EARTH / (R_EARTH + altitude));

    const lat = Math.asin(Math.sin(INCLINATION_RAD) * Math.sin(theta)) * (180 / Math.PI);

    const elapsedSec = (this.simTime / 1000) % 86164;
    let lon =
      (Math.atan2(Math.cos(INCLINATION_RAD) * Math.sin(theta), Math.cos(theta)) * (180 / Math.PI) -
        EARTH_ROTATION_DEG_PER_SEC * elapsedSec) %
      360;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;

    const inEclipseCalc = Math.sin(theta) < -0.3;
    const isEclipse =
      forceMode === 'ECLIPSE' ? true : forceMode === 'NORMAL' ? false : inEclipseCalc;

    const solarPower = isEclipse ? 0.0 : +(16.4 + Math.sin(theta) * 2.2).toFixed(1);
    const solarCurrent = isEclipse ? 0 : Math.round(solarPower * 58.2);
    const batteryVoltage = isEclipse
      ? +(7.78 + Math.random() * 0.05).toFixed(2)
      : +(8.24 + Math.random() * 0.08).toFixed(2);
    const batterySoc = isEclipse ? 83 : 94;

    const solarPanelTemp = isEclipse
      ? Math.round(-18 + Math.random() * 2)
      : Math.round(42 + Math.random() * 3);
    const batteryTemp = isEclipse ? 14 : 19;
    const obcTemp = Math.round(23.5 + Math.random() * 1.5);

    let minStationDist = Number.POSITIVE_INFINITY;
    for (const gs of GROUND_STATIONS) {
      const dLat = ((lat - gs.lat) * Math.PI) / 180;
      const dLon = ((lon - gs.lon) * Math.PI) / 180;
      const aSin =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((gs.lat * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const cDist = 2 * Math.atan2(Math.sqrt(aSin), Math.sqrt(1 - aSin));
      const distKm = R_EARTH * cDist;
      if (distKm < minStationDist) minStationDist = distKm;
    }

    const inRadioContact = minStationDist < GROUND_STATION_FOOTPRINT_KM;
    const mode: TelemetryMode =
      forceMode || (isEclipse ? 'ECLIPSE' : inRadioContact ? 'TRANSMITTING' : 'NORMAL');
    const radioRssi = inRadioContact
      ? Math.round(-85 - (minStationDist / GROUND_STATION_FOOTPRINT_KM) * 25)
      : -128;
    const downlinkSpeed = inRadioContact ? 9.6 : 1.2;

    const gyroRates: [number, number, number] =
      mode === 'DETUMBLING'
        ? [
            +(2.4 + Math.random() * 0.5).toFixed(2),
            +(-1.8 + Math.random() * 0.4).toFixed(2),
            +(3.1 + Math.random() * 0.6).toFixed(2),
          ]
        : [
            +(0.03 + Math.random() * 0.02).toFixed(3),
            +(-0.02 + Math.random() * 0.01).toFixed(3),
            +(0.05 + Math.random() * 0.02).toFixed(3),
          ];

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU');

    // Integrate attitude angles based on gyro rates and flight mode
    let adcsStatus: 'STABILIZED' | 'DETUMBLING' | 'SUN_POINTING' | 'TARGET_TRACKING' = 'STABILIZED';
    if (mode === 'DETUMBLING') {
      adcsStatus = 'DETUMBLING';
      this.attitudeRoll = ((this.attitudeRoll + gyroRates[0] * timeStepSeconds + 180) % 360) - 180;
      this.attitudePitch = Math.max(
        -85,
        Math.min(85, this.attitudePitch + gyroRates[1] * timeStepSeconds),
      );
      this.attitudeYaw = (this.attitudeYaw + gyroRates[2] * timeStepSeconds + 360) % 360;
    } else if (mode === 'TRANSMITTING') {
      adcsStatus = 'TARGET_TRACKING';
      this.attitudeRoll = +(Math.sin(theta * 3) * 1.5).toFixed(2);
      this.attitudePitch = +(12.0 + Math.cos(theta * 2) * 2.0).toFixed(2);
      this.attitudeYaw = +((this.attitudeYaw + 0.1 * timeStepSeconds) % 360).toFixed(2);
    } else if (mode === 'ECLIPSE') {
      adcsStatus = 'STABILIZED';
      this.attitudeRoll = +(Math.sin(theta) * 0.8).toFixed(2);
      this.attitudePitch = +(-2.5 + Math.cos(theta) * 0.5).toFixed(2);
      this.attitudeYaw = +((this.attitudeYaw + 0.05 * timeStepSeconds) % 360).toFixed(2);
    } else {
      adcsStatus = 'SUN_POINTING';
      this.attitudeRoll = +(Math.sin(theta * 1.2) * 2.1).toFixed(2);
      this.attitudePitch = +(3.4 + Math.sin(theta * 0.8) * 1.6).toFixed(2);
      this.attitudeYaw = +((this.attitudeYaw + 0.08 * timeStepSeconds) % 360).toFixed(2);
    }

    const angVelMag = Math.sqrt(
      gyroRates[0] * gyroRates[0] + gyroRates[1] * gyroRates[1] + gyroRates[2] * gyroRates[2],
    );

    // Quaternion calculation (ZYX convention)
    const cy = Math.cos(((this.attitudeYaw * Math.PI) / 180) * 0.5);
    const sy = Math.sin(((this.attitudeYaw * Math.PI) / 180) * 0.5);
    const cp = Math.cos(((this.attitudePitch * Math.PI) / 180) * 0.5);
    const sp = Math.sin(((this.attitudePitch * Math.PI) / 180) * 0.5);
    const cr = Math.cos(((this.attitudeRoll * Math.PI) / 180) * 0.5);
    const sr = Math.sin(((this.attitudeRoll * Math.PI) / 180) * 0.5);

    const qx = +(sr * cp * cy - cr * sp * sy).toFixed(4);
    const qy = +(cr * sp * cy + sr * cp * sy).toFixed(4);
    const qz = +(cr * cp * sy - sr * sp * cy).toFixed(4);
    const qw = +(cr * cp * cy + sr * sp * sy).toFixed(4);

    const hexVoltage = Math.round(batteryVoltage * 100)
      .toString(16)
      .padStart(4, '0')
      .toUpperCase();
    const hexTemp = (solarPanelTemp + 50).toString(16).padStart(2, '0').toUpperCase();
    const hexCounter = (this.packetCounter % 65535).toString(16).padStart(4, '0').toUpperCase();
    const rawHex = `C0 00 A0 82 86 52 4F 53 43 4F 53 60 61 ${hexCounter} ${hexVoltage} ${hexTemp} 01 5F 8B 2A C0`;

    return {
      timestamp: timeStr,
      epoch: Math.floor(this.simTime / 1000),
      satelliteName: 'ORION-3-CUBESAT (RS42S)',
      altitudeKm: +altitude.toFixed(2),
      velocityKms: +velocity.toFixed(3),
      latitude: +lat.toFixed(2),
      longitude: +lon.toFixed(2),
      batteryVoltage,
      batterySocPercent: batterySoc,
      batteryTempC: batteryTemp,
      solarCurrentMa: solarCurrent,
      solarPowerW: solarPower,
      solarPanelTempC: solarPanelTemp,
      obcTempC: obcTemp,
      payloadStatus: isEclipse ? 'STANDBY' : 'ACQUIRING_DATA',
      radioRssiDb: radioRssi,
      downlinkSpeedKbps: downlinkSpeed,
      mode,
      gyroRates,
      orientation: {
        roll: +this.attitudeRoll.toFixed(2),
        pitch: +this.attitudePitch.toFixed(2),
        yaw: +this.attitudeYaw.toFixed(2),
        quaternion: [qx, qy, qz, qw],
        angularVelocity: +angVelMag.toFixed(3),
        adcsStatus,
      },
      packetsDownlinked: this.packetCounter,
      rawHex,
    };
  }
}

export function createTelemetrySimulator(): TelemetrySimulator {
  return new TelemetrySimulator();
}
