import { describe, it, expect, beforeEach } from 'vitest';
import { cosmoportConfig } from '../../config/cosmoportConfig';
import { DataTransformer, TELEMETRY_SYNC_WORD } from './dataTransformer';
import {
  type AdcCounts,
  type TelemetryFrame,
  CorruptedFrameError,
  PacketOversizedError,
} from './types';

describe('DataTransformer: Cosmoport Telemetry Data Transformations', () => {
  beforeEach(() => {
    cosmoportConfig.resetToDefaults();
  });

  describe('CRC-16-CCITT Verification', () => {
    it('calculates deterministic 16-bit checksums', () => {
      const data1 = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const data2 = new Uint8Array([0x01, 0x02, 0x03, 0x05]); // 1 bit flip

      const crc1 = DataTransformer.calculateCrc16(data1);
      const crc2 = DataTransformer.calculateCrc16(data2);

      expect(typeof crc1).toBe('number');
      expect(crc1).toBeGreaterThanOrEqual(0);
      expect(crc1).toBeLessThanOrEqual(0xffff);
      expect(crc1).not.toBe(crc2);
    });
  });

  describe('Telemetry Frame Encoding & Decoding', () => {
    it('encodes a structured frame into binary bytes and decodes it back faithfully', () => {
      const payload = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
      const originalFrame: TelemetryFrame = {
        syncWord: TELEMETRY_SYNC_WORD,
        sequenceId: 1042,
        subsystemId: 0x03, // EPS
        flags: 0x07, // Beacon + Panels + Antenna
        timestamp: 1720000000000,
        payload,
        checksum: 0,
      };

      const encoded = DataTransformer.encodeTelemetryFrame(originalFrame);
      expect(encoded.byteLength).toBe(12 + payload.byteLength + 2); // 22 bytes

      const decoded = DataTransformer.decodeTelemetryFrame(encoded);
      expect(decoded.syncWord).toBe(TELEMETRY_SYNC_WORD);
      expect(decoded.sequenceId).toBe(1042);
      expect(decoded.subsystemId).toBe(0x03);
      expect(decoded.flags).toBe(0x07);
      expect(decoded.timestamp).toBe(1720000000000);
      expect(Array.from(decoded.payload)).toEqual(Array.from(payload));
      expect(decoded.checksum).toBeGreaterThan(0);
    });

    it('throws PacketOversizedError when payload exceeds maxPacketSizeBytes', () => {
      cosmoportConfig.mergeConfig({
        dataTransformation: { maxPacketSizeBytes: 100 },
      });

      const oversizedPayload = new Uint8Array(150);
      const frame: TelemetryFrame = {
        syncWord: TELEMETRY_SYNC_WORD,
        sequenceId: 1,
        subsystemId: 1,
        flags: 0,
        timestamp: Date.now(),
        payload: oversizedPayload,
        checksum: 0,
      };

      expect(() => DataTransformer.encodeTelemetryFrame(frame)).toThrow(PacketOversizedError);
    });

    it('throws CorruptedFrameError when frame bytes are shorter than minimum size', () => {
      const tooShort = new Uint8Array([0xeb, 0x90, 0x00]);
      expect(() => DataTransformer.decodeTelemetryFrame(tooShort)).toThrow(CorruptedFrameError);
    });

    it('throws CorruptedFrameError when sync word is invalid', () => {
      const payload = new Uint8Array([1, 2, 3]);
      const frame: TelemetryFrame = {
        syncWord: 0x1234, // Invalid!
        sequenceId: 1,
        subsystemId: 1,
        flags: 0,
        timestamp: Date.now(),
        payload,
        checksum: 0,
      };
      const encoded = DataTransformer.encodeTelemetryFrame(frame);

      expect(() => DataTransformer.decodeTelemetryFrame(encoded)).toThrow(/Invalid sync word/);
    });

    it('throws CorruptedFrameError when CRC check fails due to bit alteration in transit', () => {
      const payload = new Uint8Array([1, 2, 3, 4]);
      const frame: TelemetryFrame = {
        syncWord: TELEMETRY_SYNC_WORD,
        sequenceId: 1,
        subsystemId: 1,
        flags: 0,
        timestamp: Date.now(),
        payload,
        checksum: 0,
      };
      const encoded = DataTransformer.encodeTelemetryFrame(frame);

      // Corrupt a byte in payload
      encoded[13] = encoded[13] ^ 0xff;

      expect(() => DataTransformer.decodeTelemetryFrame(encoded)).toThrow(/CRC-16 mismatch/);
    });

    it('throws CorruptedFrameError when frame is truncated mid-payload', () => {
      const payload = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const frame: TelemetryFrame = {
        syncWord: TELEMETRY_SYNC_WORD,
        sequenceId: 1,
        subsystemId: 1,
        flags: 0,
        timestamp: Date.now(),
        payload,
        checksum: 0,
      };
      const encoded = DataTransformer.encodeTelemetryFrame(frame);

      // Truncate last 4 bytes
      const truncated = encoded.subarray(0, encoded.length - 4);
      expect(() => DataTransformer.decodeTelemetryFrame(truncated)).toThrow(/Truncated frame/);
    });
  });

  describe('12-bit ADC to Physical Engineering Units Transformation', () => {
    it('converts nominal mid-range and full-scale ADC counts to engineering units', () => {
      const midScaleAdc: AdcCounts = {
        rawVoltage: 2730, // ~8.4V
        rawCurrent: 1365, // ~1.5A
        rawTemp: 2047, // ~22.5°C
        rawSolarPower: 2047, // ~14.2W
        rawGyroX: 2047, // ~0 deg/s
        rawGyroY: 2047,
        rawGyroZ: 2047,
        rawMagX: 2047, // ~0 uT
        rawMagY: 2047,
        rawMagZ: 2047,
        rawRssi: 128, // ~-75 dBm
      };

      const eng = DataTransformer.transformAdcToEngineeringUnits(midScaleAdc);
      expect(eng.busVoltageV).toBeCloseTo(8.4, 1);
      expect(eng.busCurrentA).toBeCloseTo(1.5, 1);
      expect(eng.batteryTempC).toBeGreaterThan(15);
      expect(eng.batteryTempC).toBeLessThan(30);
      expect(eng.solarPowerW).toBeGreaterThan(10);
      expect(eng.gyroRateDps[0]).toBeCloseTo(0, 0);
      expect(eng.magFieldUt[0]).toBeCloseTo(0, 0);
      expect(eng.radioRssiDb).toBeGreaterThan(-90);
      expect(eng.isAntennaDeployed).toBe(true);
      expect(eng.payloadStatus).toBe('OK');
      expect(eng.sensorFaults.length).toBe(0);
    });

    it('detects out-of-range ADC sensor readings and flags faults', () => {
      const faultAdc: AdcCounts = {
        rawVoltage: 5000, // Out of bounds (> 4095)
        rawCurrent: -10, // Out of bounds (< 0)
        rawTemp: 6000, // Out of bounds
        rawSolarPower: 2047,
        rawGyroX: 2047,
        rawGyroY: 2047,
        rawGyroZ: 2047,
        rawMagX: 2047,
        rawMagY: 2047,
        rawMagZ: 2047,
        rawRssi: 128,
      };

      const eng = DataTransformer.transformAdcToEngineeringUnits(faultAdc);
      expect(eng.sensorFaults.length).toBeGreaterThan(0);
      expect(eng.payloadStatus).toBe('FAULT');
      expect(eng.sensorFaults[0]).toContain('Voltage ADC out of range');
    });
  });

  describe('Subsystem Flag Register Packing & Unpacking', () => {
    it('packs and unpacks boolean flags using bitmasks', () => {
      const flags = {
        solarPanelsDeployed: true,
        antennaDeployed: true,
        beaconActive: true,
        lowPowerMode: false,
        payloadActive: true,
        adcsDetumbling: false,
        transmitterHighPower: true,
      };

      const packed = DataTransformer.packFlags(flags);
      expect(packed).toBe(0x01 | 0x02 | 0x04 | 0x10 | 0x40);

      const unpacked = DataTransformer.unpackFlags(packed);
      expect(unpacked.solarPanelsDeployed).toBe(true);
      expect(unpacked.antennaDeployed).toBe(true);
      expect(unpacked.beaconActive).toBe(true);
      expect(unpacked.lowPowerMode).toBe(false);
      expect(unpacked.payloadActive).toBe(true);
      expect(unpacked.adcsDetumbling).toBe(false);
      expect(unpacked.transmitterHighPower).toBe(true);
    });
  });

  describe('Doppler Frequency Shift Calculations', () => {
    it('calculates Doppler shift for approaching CubeSat (+velocity)', () => {
      const nominalFreqHz = 437425000; // 437.425 MHz
      const radialVelocity = 7.5; // km/s approaching ground station

      const doppler = DataTransformer.calculateDopplerShift(nominalFreqHz, radialVelocity);
      expect(doppler.shiftHz).toBeGreaterThan(0);
      expect(doppler.shiftKHz).toBeCloseTo(10.94, 1);
      expect(doppler.observedFreqHz).toBeGreaterThan(nominalFreqHz);
    });

    it('calculates negative Doppler shift for receding CubeSat (-velocity)', () => {
      const nominalFreqHz = 437425000;
      const radialVelocity = -7.5; // km/s receding

      const doppler = DataTransformer.calculateDopplerShift(nominalFreqHz, radialVelocity);
      expect(doppler.shiftHz).toBeLessThan(0);
      expect(doppler.observedFreqHz).toBeLessThan(nominalFreqHz);
    });

    it('produces zero Doppler shift when radial velocity is zero', () => {
      const nominalFreqHz = 145800000;
      const doppler = DataTransformer.calculateDopplerShift(nominalFreqHz, 0);
      expect(doppler.shiftHz).toBe(0);
      expect(doppler.observedFreqHz).toBe(nominalFreqHz);
    });

    it('throws error when nominal frequency is invalid (<= 0)', () => {
      expect(() => DataTransformer.calculateDopplerShift(0, 5)).toThrow(
        /Invalid nominal frequency/,
      );
      expect(() => DataTransformer.calculateDopplerShift(-100, 5)).toThrow(
        /Invalid nominal frequency/,
      );
    });
  });

  describe('Telemetry Payload Compression & Decompression', () => {
    it('compresses repetitive telemetry buffers and decompresses back to original', () => {
      const raw = new Uint8Array([0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 3, 3, 3]);
      const compressed = DataTransformer.compressPayload(raw);

      expect(compressed.length).toBeLessThan(raw.length);

      const decompressed = DataTransformer.decompressPayload(compressed);
      expect(Array.from(decompressed)).toEqual(Array.from(raw));
    });

    it('handles empty payload gracefully', () => {
      const empty = new Uint8Array(0);
      expect(DataTransformer.compressPayload(empty).length).toBe(0);
      expect(DataTransformer.decompressPayload(empty).length).toBe(0);
    });

    it('throws CorruptedFrameError on odd length compressed byte sequence', () => {
      const odd = new Uint8Array([1, 2, 3]);
      expect(() => DataTransformer.decompressPayload(odd)).toThrow(CorruptedFrameError);
    });
  });

  describe('Mapping to Domain TelemetryPacket', () => {
    it('converts EngineeringData into UI TelemetryPacket model', () => {
      const raw: AdcCounts = {
        rawVoltage: 2730,
        rawCurrent: 1365,
        rawTemp: 2047,
        rawSolarPower: 2047,
        rawGyroX: 2047,
        rawGyroY: 2047,
        rawGyroZ: 2047,
        rawMagX: 2047,
        rawMagY: 2047,
        rawMagZ: 2047,
        rawRssi: 128,
      };

      const eng = DataTransformer.transformAdcToEngineeringUnits(raw);
      const packet = DataTransformer.toTelemetryPacket(eng, {
        altitudeKm: 525.4,
        orbitNumber: 5012,
      });

      expect(packet.altitudeKm).toBe(525.4);
      expect(packet.orbitNumber).toBe(5012);
      expect(packet.batteryLevel).toBeGreaterThan(0);
      expect(packet.mode).toBe('NORMAL');
      expect(packet.antennaDeployed).toBe(true);
    });
  });
});
