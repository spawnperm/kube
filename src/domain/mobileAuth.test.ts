import { describe, it, expect } from 'vitest';
import {
  generateAuthCode,
  generateSessionToken,
  createMobileAuthPayload,
  serializeMobileAuthPayload,
  createMobileDeepLinks,
  isPayloadExpired,
  getRemainingValiditySeconds,
  getInitialConnectedDevices,
  createSimulatedDevice,
  DEFAULT_AUTH_TTL_SECONDS,
} from './mobileAuth';
import { INITIAL_TEAMS } from '../data/mockData';

describe('mobileAuth domain service', () => {
  const mockTeam = INITIAL_TEAMS[0];

  it('generateAuthCode returns CP-XXXX-XX pattern', () => {
    const code = generateAuthCode();
    expect(code).toMatch(/^CP-[0-9A-Z]{4}-[0-9A-Z]{2}$/);
  });

  it('generateSessionToken includes teamId and role', () => {
    const token = generateSessionToken(mockTeam.id, 'participant', 1700000000000);
    expect(token).toContain(mockTeam.id);
    expect(token).toContain('participant');
  });

  it('createMobileAuthPayload creates valid payload structure', () => {
    const now = 1700000000000;
    const payload = createMobileAuthPayload(mockTeam, 'participant', {
      now,
      ttlSeconds: DEFAULT_AUTH_TTL_SECONDS,
    });

    expect(payload.version).toBe('1.0');
    expect(payload.protocol).toBe('cosmoport-sync');
    expect(payload.teamId).toBe(mockTeam.id);
    expect(payload.teamName).toBe(mockTeam.name);
    expect(payload.role).toBe('participant');
    expect(payload.issuedAt).toBe(now);
    expect(payload.expiresAt).toBe(now + DEFAULT_AUTH_TTL_SECONDS * 1000);
    expect(payload.authCode).toMatch(/^CP-/);
  });

  it('serializes and parses payload correctly', () => {
    const payload = createMobileAuthPayload(mockTeam);
    const serialized = serializeMobileAuthPayload(payload);
    const parsed = JSON.parse(serialized);

    expect(parsed.teamId).toBe(mockTeam.id);
    expect(parsed.sessionToken).toBe(payload.sessionToken);
  });

  it('creates deep link and universal link', () => {
    const payload = createMobileAuthPayload(mockTeam, 'participant', {
      portalUrl: 'https://test.cosmoport.space',
    });
    const links = createMobileDeepLinks(payload);

    expect(links.deepLink).toContain('cosmoport://sync?payload=');
    expect(links.universalLink).toContain('https://test.cosmoport.space/mobile-sync');
    expect(links.universalLink).toContain(encodeURIComponent(payload.authCode));
  });

  it('correctly detects expiration', () => {
    const now = 1700000000000;
    const payload = createMobileAuthPayload(mockTeam, 'participant', {
      now,
      ttlSeconds: 60,
    });

    expect(isPayloadExpired(payload, now + 30 * 1000)).toBe(false);
    expect(isPayloadExpired(payload, now + 60 * 1000)).toBe(true);
    expect(isPayloadExpired(payload, now + 100 * 1000)).toBe(true);

    expect(getRemainingValiditySeconds(payload, now)).toBe(60);
    expect(getRemainingValiditySeconds(payload, now + 25 * 1000)).toBe(35);
    expect(getRemainingValiditySeconds(payload, now + 70 * 1000)).toBe(0);
  });

  it('generates initial mock devices for team', () => {
    const devices = getInitialConnectedDevices(mockTeam);
    expect(devices.length).toBeGreaterThan(0);
    expect(devices[0].deviceName).toBeTruthy();
    expect(['ios', 'android']).toContain(devices[0].platform);
  });

  it('creates simulated device when user tests scan', () => {
    const newDevice = createSimulatedDevice(mockTeam, {
      deviceName: 'Custom Test Phone',
      platform: 'android',
    });
    expect(newDevice.deviceName).toBe('Custom Test Phone');
    expect(newDevice.platform).toBe('android');
    expect(newDevice.pushEnabled).toBe(true);
  });
});
