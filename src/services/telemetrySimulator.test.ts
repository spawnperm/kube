import { describe, expect, it } from 'vitest';
import {
  createTelemetrySimulator,
  generateOrbitGroundTrack,
  GROUND_STATIONS,
} from './telemetrySimulator';

describe('Симулятор телеметрии и орбитальной механики КубСата (TelemetrySimulator)', () => {
  describe('Инициализация и номинальные орбитальные параметры', () => {
    it('генерирует номинальный начальный пакет телеметрии на рабочей ССО орбите ~525 км', () => {
      const sim = createTelemetrySimulator();
      const packet = sim.generateInitialPacket();

      // Проверка орбитальной высоты: около 525 км
      expect(packet.altitudeKm).toBeGreaterThan(520);
      expect(packet.altitudeKm).toBeLessThan(530);

      // Проверка первой космической скорости: v = sqrt(mu / (R + h)) ~ 7.6 км/с
      expect(packet.velocityKms).toBeGreaterThan(7.55);
      expect(packet.velocityKms).toBeLessThan(7.65);

      // Проверка географических координат
      expect(packet.latitude).toBeGreaterThanOrEqual(-97.4);
      expect(packet.latitude).toBeLessThanOrEqual(97.4);
      expect(packet.longitude).toBeGreaterThanOrEqual(-180);
      expect(packet.longitude).toBeLessThanOrEqual(180);

      // Режим и статус полезной нагрузки
      expect(packet.satelliteName).toContain('ORION-3-CUBESAT');
      expect(packet.batteryVoltage).toBeGreaterThan(7.0);
      expect(packet.batteryVoltage).toBeLessThan(9.0);
      expect(packet.rawHex).toMatch(/^C0.*C0$/);
    });

    it('содержит корректный список и координаты наземных станций приема', () => {
      expect(GROUND_STATIONS).toHaveLength(5);
      const permStation = GROUND_STATIONS.find((s) => s.city === 'Пермь');
      expect(permStation).toBeDefined();
      expect(permStation?.lat).toBeCloseTo(58.01, 1);
      expect(permStation?.lon).toBeCloseTo(56.25, 1);
      expect(permStation?.active).toBe(true);

      const vostochnyStation = GROUND_STATIONS.find((s) => s.name.includes('Восток'));
      expect(vostochnyStation).toBeDefined();
      expect(vostochnyStation?.city).toContain('Восточный');
    });
  });

  describe('Динамика времени и шагов симуляции', () => {
    it('инкрементирует счетчик пакетов и отметку epoch при каждом шаге', () => {
      const sim = createTelemetrySimulator();
      const p1 = sim.generateInitialPacket();
      const p2 = sim.getNextPacket(p1, 1);

      expect(p2.packetsDownlinked).toBe(p1.packetsDownlinked + 1);
      expect(p2.epoch).toBe(p1.epoch + 1);

      const p3 = sim.getNextPacket(p2, 10);
      expect(p3.packetsDownlinked).toBe(p2.packetsDownlinked + 1);
      expect(p3.epoch).toBe(p2.epoch + 10);
    });

    it('поддерживает шаг моделирования с ускоренным временем (симуляция витка)', () => {
      const sim = createTelemetrySimulator();
      let packet = sim.generateInitialPacket();

      // Прогоняем эквивалент четверти витка (~24 минуты = 1440 секунд)
      for (let i = 0; i < 24; i++) {
        packet = sim.getNextPacket(packet, 60);
      }

      expect(packet.altitudeKm).toBeGreaterThan(520);
      expect(packet.altitudeKm).toBeLessThan(530);
      expect(packet.epoch).toBeGreaterThan(0);
    });
  });

  describe('Режимы работы CubeSat: Свет, Тень (Eclipse), Детамблинг', () => {
    it('принудительный режим ECLIPSE отключает солнечную генерацию и охлаждает панели', () => {
      const sim = createTelemetrySimulator();
      const initial = sim.generateInitialPacket();
      const eclipsePacket = sim.getNextPacket(initial, 1, 'ECLIPSE');

      expect(eclipsePacket.mode).toBe('ECLIPSE');
      expect(eclipsePacket.solarPowerW).toBe(0.0);
      expect(eclipsePacket.solarCurrentMa).toBe(0);
      expect(eclipsePacket.solarPanelTempC).toBeLessThan(0); // Отрицательная температура в тени
      expect(eclipsePacket.payloadStatus).toBe('STANDBY');
      expect(eclipsePacket.batteryVoltage).toBeLessThan(8.0); // Разряд батареи
      expect(eclipsePacket.batterySocPercent).toBe(83);
    });

    it('номинальный режим NORMAL обеспечивает выработку солнечной энергии', () => {
      const sim = createTelemetrySimulator();
      const initial = sim.generateInitialPacket();
      const normalPacket = sim.getNextPacket(initial, 1, 'NORMAL');

      expect(normalPacket.mode).toBe('NORMAL');
      expect(normalPacket.solarPowerW).toBeGreaterThan(14.0);
      expect(normalPacket.solarCurrentMa).toBeGreaterThan(500);
      expect(normalPacket.solarPanelTempC).toBeGreaterThan(30); // Нагрев на свету
      expect(normalPacket.payloadStatus).toBe('ACQUIRING_DATA');
      expect(normalPacket.batteryVoltage).toBeGreaterThan(8.1);
      expect(normalPacket.batterySocPercent).toBe(94);
    });

    it('режим детамблинга (DETUMBLING) фиксирует повышенные угловые скорости', () => {
      const sim = createTelemetrySimulator();
      const initial = sim.generateInitialPacket();
      const detumblePacket = sim.getNextPacket(initial, 1, 'DETUMBLING');

      expect(detumblePacket.mode).toBe('DETUMBLING');
      const [rateX, rateY, rateZ] = detumblePacket.gyroRates;

      // Угловые скорости при гашении вращения B-dot значительно выше нормальных (<0.1 град/с)
      expect(Math.abs(rateX)).toBeGreaterThan(1.5);
      expect(Math.abs(rateY)).toBeGreaterThan(1.0);
      expect(Math.abs(rateZ)).toBeGreaterThan(2.0);
    });
  });

  describe('Радиолиния, RSSI и наземные станции', () => {
    it('радиоканал корректно рассчитывает скорость сброса и уровень сигнала RSSI', () => {
      const sim = createTelemetrySimulator();
      const packet = sim.generateInitialPacket();

      // Уровень RSSI в дБм должен быть отрицательным
      expect(packet.radioRssiDb).toBeLessThanOrEqual(-80);
      // Скорость сброса: либо дежурная 1.2 кбит/с, либо сеансовая 9.6 кбит/с
      expect([1.2, 9.6]).toContain(packet.downlinkSpeedKbps);
    });

    it('формирует валидный AX.25 hex-пакет с позывным и контрольными байтами', () => {
      const sim = createTelemetrySimulator();
      const packet = sim.generateInitialPacket();

      // ASCII байты позывного ROSCOS: 52 4F 53 43 4F 53
      expect(packet.rawHex).toContain('52 4F 53 43 4F 53');
      expect(packet.rawHex.startsWith('C0')).toBe(true);
      expect(packet.rawHex.endsWith('C0')).toBe(true);

      const parts = packet.rawHex.split(' ');
      expect(parts.length).toBeGreaterThan(15);
    });
  });

  describe('Генератор подспутниковой трассы (Ground Track)', () => {
    it('формирует корректный массив точек заданной длины', () => {
      const points36 = generateOrbitGroundTrack(36);
      expect(points36).toHaveLength(36);

      const points72 = generateOrbitGroundTrack(72);
      expect(points72).toHaveLength(72);
    });

    it('все точки трассы укладываются в географические ограничения и наклонение орбиты', () => {
      const points = generateOrbitGroundTrack(72);

      for (const pt of points) {
        // Наклонение ССО 97.4 град (широта от -97.4 до +97.4 град)
        expect(pt.lat).toBeGreaterThanOrEqual(-97.5);
        expect(pt.lat).toBeLessThanOrEqual(97.5);
        // Долгота в пределах [-180, 180]
        expect(pt.lon).toBeGreaterThanOrEqual(-180);
        expect(pt.lon).toBeLessThanOrEqual(180);
      }
    });

    it('трасса меняет координаты и пересекает полушария', () => {
      const points = generateOrbitGroundTrack(72);
      const lats = points.map((p) => p.lat);
      const maxLat = Math.max(...lats);
      const minLat = Math.min(...lats);

      expect(maxLat).toBeGreaterThan(50);
      expect(minLat).toBeLessThan(-50);
    });
  });
});
