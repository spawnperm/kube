import { cosmoportConfig } from '../../config/cosmoportConfig';
import type { TelemetryPacket } from '../../types';
import {
  type AdcCounts,
  type EngineeringData,
  type TelemetryFrame,
  CorruptedFrameError,
  PacketOversizedError,
} from './types';

export const TELEMETRY_SYNC_WORD = 0xeb90; // Standard CubeSat downlink sync word
export const MIN_FRAME_SIZE_BYTES = 14; // 2 sync + 2 seq + 1 sub + 1 flags + 4 ts + 2 len + 2 crc

export class DataTransformer {
  /**
   * Calculates standard CRC-16-CCITT (poly 0x1021, init 0xFFFF)
   */
  public static calculateCrc16(data: Uint8Array): number {
    let crc = 0xffff;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i] << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = ((crc << 1) ^ 0x1021) & 0xffff;
        } else {
          crc = (crc << 1) & 0xffff;
        }
      }
    }
    return crc & 0xffff;
  }

  /**
   * Encodes a TelemetryFrame into a binary byte array with CRC16
   */
  public static encodeTelemetryFrame(frame: TelemetryFrame): Uint8Array {
    const config = cosmoportConfig.getConfig();
    const maxPacketSize = config.dataTransformation.maxPacketSizeBytes;

    if (frame.payload.byteLength > maxPacketSize) {
      throw new PacketOversizedError(frame.payload.byteLength, maxPacketSize);
    }

    const payloadLength = frame.payload.byteLength;
    const totalLength = 12 + payloadLength + 2; // header(12) + payload + crc(2)
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    // Header
    view.setUint16(0, frame.syncWord || TELEMETRY_SYNC_WORD, false); // big-endian
    view.setUint16(2, frame.sequenceId & 0xffff, false);
    view.setUint8(4, frame.subsystemId & 0xff);
    view.setUint8(5, frame.flags & 0xff);
    view.setUint32(6, Math.floor(frame.timestamp / 1000), false);
    view.setUint16(10, payloadLength, false);

    // Payload
    const uint8 = new Uint8Array(buffer);
    uint8.set(frame.payload, 12);

    // CRC over header + payload
    const dataToCrc = uint8.subarray(0, 12 + payloadLength);
    const crc = DataTransformer.calculateCrc16(dataToCrc);
    view.setUint16(12 + payloadLength, crc, false);

    return uint8;
  }

  /**
   * Decodes a binary byte array into a structured TelemetryFrame
   */
  public static decodeTelemetryFrame(bytes: Uint8Array): TelemetryFrame {
    if (!bytes || bytes.byteLength < MIN_FRAME_SIZE_BYTES) {
      throw new CorruptedFrameError(
        `Frame too short (${bytes ? bytes.byteLength : 0} bytes, minimum required: ${MIN_FRAME_SIZE_BYTES})`,
      );
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    // 1. Sync Word Verification
    const syncWord = view.getUint16(0, false);
    if (syncWord !== TELEMETRY_SYNC_WORD) {
      throw new CorruptedFrameError(
        `Invalid sync word 0x${syncWord.toString(16).toUpperCase()} (expected 0x${TELEMETRY_SYNC_WORD.toString(16).toUpperCase()})`,
      );
    }

    // 2. Header parsing
    const sequenceId = view.getUint16(2, false);
    const subsystemId = view.getUint8(4);
    const flags = view.getUint8(5);
    const timestampSec = view.getUint32(6, false);
    const payloadLength = view.getUint16(10, false);

    const expectedTotalSize = 12 + payloadLength + 2;
    if (bytes.byteLength < expectedTotalSize) {
      throw new CorruptedFrameError(
        `Truncated frame: declared payload length is ${payloadLength}, but total bytes is ${bytes.byteLength}`,
      );
    }

    // 3. CRC Verification
    const config = cosmoportConfig.getConfig();
    const frameChecksum = view.getUint16(12 + payloadLength, false);

    if (config.dataTransformation.enableCrcCheck) {
      const dataToCrc = bytes.subarray(0, 12 + payloadLength);
      const computedCrc = DataTransformer.calculateCrc16(dataToCrc);

      if (frameChecksum !== computedCrc) {
        throw new CorruptedFrameError(
          `CRC-16 mismatch: frame has 0x${frameChecksum.toString(16).toUpperCase()}, computed 0x${computedCrc.toString(16).toUpperCase()}`,
        );
      }
    }

    const payload = bytes.slice(12, 12 + payloadLength);

    return {
      syncWord,
      sequenceId,
      subsystemId,
      flags,
      timestamp: timestampSec * 1000,
      payload,
      checksum: frameChecksum,
    };
  }

  /**
   * Transforms raw 12-bit ADC sensor counts (0..4095) into physical Engineering Units
   */
  public static transformAdcToEngineeringUnits(raw: AdcCounts): EngineeringData {
    const sensorFaults: string[] = [];

    // Helper for 12-bit ADC clamping and checking
    const check12Bit = (val: number, name: string) => {
      if (val < 0 || val > 4095) {
        sensorFaults.push(`${name} ADC out of range: ${val}`);
      }
    };

    check12Bit(raw.rawVoltage, 'Voltage');
    check12Bit(raw.rawCurrent, 'Current');
    check12Bit(raw.rawTemp, 'Temperature');
    check12Bit(raw.rawSolarPower, 'SolarPower');
    check12Bit(raw.rawGyroX, 'GyroX');
    check12Bit(raw.rawGyroY, 'GyroY');
    check12Bit(raw.rawGyroZ, 'GyroZ');
    check12Bit(raw.rawMagX, 'MagX');
    check12Bit(raw.rawMagY, 'MagY');
    check12Bit(raw.rawMagZ, 'MagZ');

    // Conversions
    // Voltage: 0..4095 -> 0..12.6 V (Battery pack)
    const busVoltageV = +(Math.max(0, Math.min(4095, raw.rawVoltage)) * (12.6 / 4095)).toFixed(2);

    // Current: 0..4095 -> 0..4.5 A
    const busCurrentA = +(Math.max(0, Math.min(4095, raw.rawCurrent)) * (4.5 / 4095)).toFixed(2);

    // Temp: 0..4095 -> -40 °C to +85 °C
    const batteryTempC = +(-40 + Math.max(0, Math.min(4095, raw.rawTemp)) * (125 / 4095)).toFixed(
      1,
    );

    // Solar Power: 0..4095 -> 0..28.5 W
    const solarPowerW = +(Math.max(0, Math.min(4095, raw.rawSolarPower)) * (28.5 / 4095)).toFixed(
      1,
    );

    // Gyro: 0..4095 -> -250 to +250 deg/s
    const gyroScale = (v: number) =>
      +(-250 + Math.max(0, Math.min(4095, v)) * (500 / 4095)).toFixed(2);
    const gyroRateDps: [number, number, number] = [
      gyroScale(raw.rawGyroX),
      gyroScale(raw.rawGyroY),
      gyroScale(raw.rawGyroZ),
    ];

    // Magnetometer: 0..4095 -> -60 to +60 uT
    const magScale = (v: number) =>
      +(-60 + Math.max(0, Math.min(4095, v)) * (120 / 4095)).toFixed(2);
    const magFieldUt: [number, number, number] = [
      magScale(raw.rawMagX),
      magScale(raw.rawMagY),
      magScale(raw.rawMagZ),
    ];

    // RSSI: 0..255 -> -120 dBm to -30 dBm
    const radioRssiDb = +(-120 + Math.max(0, Math.min(255, raw.rawRssi)) * (90 / 255)).toFixed(1);

    return {
      busVoltageV,
      busCurrentA,
      batteryTempC,
      solarPowerW,
      gyroRateDps,
      magFieldUt,
      radioRssiDb,
      isAntennaDeployed: busVoltageV > 6.0,
      beaconActive: true,
      lowPowerMode: busVoltageV < 6.8,
      adcsDetumbling: Math.abs(gyroRateDps[0]) > 20 || Math.abs(gyroRateDps[1]) > 20,
      payloadStatus:
        sensorFaults.length === 0 ? 'OK' : sensorFaults.length <= 2 ? 'DEGRADED' : 'FAULT',
      sensorFaults,
    };
  }

  /**
   * Unpacks a 8-bit subsystem flag register into boolean flags
   */
  public static unpackFlags(flags: number): {
    solarPanelsDeployed: boolean;
    antennaDeployed: boolean;
    beaconActive: boolean;
    lowPowerMode: boolean;
    payloadActive: boolean;
    adcsDetumbling: boolean;
    transmitterHighPower: boolean;
  } {
    return {
      solarPanelsDeployed: (flags & 0x01) !== 0,
      antennaDeployed: (flags & 0x02) !== 0,
      beaconActive: (flags & 0x04) !== 0,
      lowPowerMode: (flags & 0x08) !== 0,
      payloadActive: (flags & 0x10) !== 0,
      adcsDetumbling: (flags & 0x20) !== 0,
      transmitterHighPower: (flags & 0x40) !== 0,
    };
  }

  /**
   * Packs boolean subsystem flags into a single 8-bit register
   */
  public static packFlags(flags: {
    solarPanelsDeployed?: boolean;
    antennaDeployed?: boolean;
    beaconActive?: boolean;
    lowPowerMode?: boolean;
    payloadActive?: boolean;
    adcsDetumbling?: boolean;
    transmitterHighPower?: boolean;
  }): number {
    let byte = 0;
    if (flags.solarPanelsDeployed) byte |= 0x01;
    if (flags.antennaDeployed) byte |= 0x02;
    if (flags.beaconActive) byte |= 0x04;
    if (flags.lowPowerMode) byte |= 0x08;
    if (flags.payloadActive) byte |= 0x10;
    if (flags.adcsDetumbling) byte |= 0x20;
    if (flags.transmitterHighPower) byte |= 0x40;
    return byte;
  }

  /**
   * Calculates relativistic and orbital Doppler shift for radio frequencies
   * f_observed = f_nominal * (1 + v_radial / c)
   */
  public static calculateDopplerShift(
    nominalFreqHz: number,
    relativeRadialVelocityKmS: number,
  ): {
    observedFreqHz: number;
    shiftHz: number;
    shiftKHz: number;
  } {
    const SPEED_OF_LIGHT_KM_S = 299792.458;
    if (nominalFreqHz <= 0) {
      throw new Error(`Invalid nominal frequency: ${nominalFreqHz}`);
    }

    const shiftHz = +(nominalFreqHz * (relativeRadialVelocityKmS / SPEED_OF_LIGHT_KM_S)).toFixed(2);
    const observedFreqHz = +(nominalFreqHz + shiftHz).toFixed(2);
    const shiftKHz = +(shiftHz / 1000).toFixed(4);

    return {
      observedFreqHz,
      shiftHz,
      shiftKHz,
    };
  }

  /**
   * Run-Length compression for sparse telemetry payload buffers
   */
  public static compressPayload(data: Uint8Array): Uint8Array {
    if (data.length === 0) return new Uint8Array(0);

    const out: number[] = [];
    let count = 1;

    for (let i = 1; i <= data.length; i++) {
      if (i < data.length && data[i] === data[i - 1] && count < 255) {
        count++;
      } else {
        out.push(count);
        out.push(data[i - 1]);
        count = 1;
      }
    }

    return new Uint8Array(out);
  }

  /**
   * Run-Length decompression for telemetry payload buffers
   */
  public static decompressPayload(compressed: Uint8Array): Uint8Array {
    if (compressed.length === 0) return new Uint8Array(0);
    if (compressed.length % 2 !== 0) {
      throw new CorruptedFrameError('Invalid compressed telemetry payload: odd length byte count');
    }

    const out: number[] = [];
    for (let i = 0; i < compressed.length; i += 2) {
      const count = compressed[i];
      const val = compressed[i + 1];
      for (let c = 0; c < count; c++) {
        out.push(val);
      }
    }

    return new Uint8Array(out);
  }

  /**
   * Maps transformed EngineeringData to UI TelemetryPacket format
   */
  public static toTelemetryPacket(
    eng: EngineeringData,
    base: Partial<TelemetryPacket> = {},
  ): TelemetryPacket {
    const now = Date.now();
    return {
      id: base.id || `pkt_${now}`,
      timestamp: typeof base.timestamp === 'string' ? base.timestamp : new Date(now).toISOString(),
      epoch: base.epoch ?? now,
      satelliteName: base.satelliteName ?? 'CubeSat-3U',
      altitudeKm: base.altitudeKm ?? 524.8,
      velocityKms: base.velocityKms ?? base.velocityKmS ?? 7.61,
      velocityKmS: base.velocityKmS ?? base.velocityKms ?? 7.61,
      latitude: base.latitude ?? 58.01,
      longitude: base.longitude ?? 56.25,
      batteryVoltage: eng.busVoltageV,
      batterySocPercent: Math.round(((eng.busVoltageV - 6.0) / (8.4 - 6.0)) * 100),
      batteryLevel: Math.round(((eng.busVoltageV - 6.0) / (8.4 - 6.0)) * 100),
      batteryTempC: eng.batteryTempC,
      solarCurrentMa: Math.round((eng.solarPowerW / (eng.busVoltageV || 7.4)) * 1000),
      solarPowerW: eng.solarPowerW,
      solarGenerationWatts: eng.solarPowerW,
      solarPanelTempC: eng.batteryTempC + 12.5,
      obcTempC: +(eng.batteryTempC + 6.2).toFixed(1),
      payloadStatus: 'ON',
      radioRssiDb: eng.radioRssiDb,
      signalStrengthDbm: eng.radioRssiDb,
      downlinkSpeedKbps: 9.6,
      mode: eng.lowPowerMode ? 'SAFE' : eng.adcsDetumbling ? 'DETUMBLING' : 'NORMAL',
      gyroRates: [eng.gyroRateDps[0], eng.gyroRateDps[1], eng.gyroRateDps[2]],
      packetsDownlinked: base.packetsDownlinked ?? 4829,
      rawHex: base.rawHex ?? 'EB9042',
      orbitNumber: base.orbitNumber ?? 4829,
      currentStation: base.currentStation ?? 'GS-01 Пермь-Лицей',
      attitudeRoll: eng.gyroRateDps[0],
      attitudePitch: eng.gyroRateDps[1],
      attitudeYaw: eng.gyroRateDps[2],
      solarPanelsDeployed: !eng.lowPowerMode,
      antennaDeployed: eng.isAntennaDeployed,
      magnetometerX: eng.magFieldUt[0],
      magnetometerY: eng.magFieldUt[1],
      magnetometerZ: eng.magFieldUt[2],
      gyroscopeX: eng.gyroRateDps[0],
      gyroscopeY: eng.gyroRateDps[1],
      gyroscopeZ: eng.gyroRateDps[2],
      cpuTemperatureC: +(eng.batteryTempC + 6.2).toFixed(1),
      packetLossPercent: 0.1,
    };
  }
}
