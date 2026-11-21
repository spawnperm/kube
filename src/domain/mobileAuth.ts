/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConnectedMobileDevice, MobileAuthPayload, Team, UserRole } from '../types';

export const DEFAULT_AUTH_TTL_SECONDS = 300; // 5 minutes

/**
 * Generates an alphanumeric verification code for manual mobile sync
 * Example: CP-7492-F8
 */
export function generateAuthCode(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 2; i++) {
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CP-${segment1}-${segment2}`;
}

/**
 * Generates a mock cryptographically unique session token
 */
export function generateSessionToken(teamId: string, role: UserRole, timestamp: number): string {
  const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `sync_${teamId}_${role}_${timestamp.toString(36)}_${randomSuffix}`;
}

/**
 * Creates a mobile authorization payload for QR code encoding
 */
export function createMobileAuthPayload(
  team: Team,
  role: UserRole = 'participant',
  options: {
    ttlSeconds?: number;
    portalUrl?: string;
    now?: number;
  } = {},
): MobileAuthPayload {
  const now = options.now ?? Date.now();
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_AUTH_TTL_SECONDS;
  const expiresAt = now + ttlSeconds * 1000;
  const authCode = generateAuthCode();
  const sessionToken = generateSessionToken(team.id, role, now);
  const portalUrl =
    options.portalUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://cosmoport.space');

  return {
    version: '1.0',
    protocol: 'cosmoport-sync',
    teamId: team.id,
    teamName: team.name,
    role,
    authCode,
    sessionToken,
    issuedAt: now,
    expiresAt,
    portalUrl,
    telemetryChannel: `telem_${team.id}_channel`,
    telemetryFreqMhz: team.cubesatSpecs?.radioFreqMhz || 437.425,
  };
}

/**
 * Serializes payload into JSON string for QR encoding
 */
export function serializeMobileAuthPayload(payload: MobileAuthPayload): string {
  return JSON.stringify(payload);
}

/**
 * Creates mobile deep link scheme and web universal link
 */
export function createMobileDeepLinks(payload: MobileAuthPayload): {
  deepLink: string;
  universalLink: string;
} {
  const encoded = encodeURIComponent(serializeMobileAuthPayload(payload));
  return {
    deepLink: `cosmoport://sync?payload=${encoded}`,
    universalLink: `${payload.portalUrl}/mobile-sync?token=${encodeURIComponent(
      payload.sessionToken,
    )}&team=${encodeURIComponent(payload.teamId)}&code=${encodeURIComponent(payload.authCode)}`,
  };
}

/**
 * Checks whether an authorization payload has expired
 */
export function isPayloadExpired(payload: MobileAuthPayload, now: number = Date.now()): boolean {
  return now >= payload.expiresAt;
}

/**
 * Calculates remaining validity time in seconds
 */
export function getRemainingValiditySeconds(
  payload: MobileAuthPayload,
  now: number = Date.now(),
): number {
  const diff = payload.expiresAt - now;
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Initial connected mobile devices roster for simulation
 */
export function getInitialConnectedDevices(team: Team): ConnectedMobileDevice[] {
  const firstMember = team.members[0] || { name: 'Капитан', role: 'Капитан' };
  const secondMember = team.members[1] || { name: 'Инженер', role: 'Инженер' };

  return [
    {
      id: `dev_${team.id}_1`,
      deviceName: 'iPhone 15 Pro Max',
      platform: 'ios',
      memberName: firstMember.name,
      memberRole: firstMember.role,
      connectedAt: '12 минут назад',
      lastActiveAt: 'Только что',
      batteryLevel: 91,
      pushEnabled: true,
      ipAddress: '192.168.1.104',
    },
    {
      id: `dev_${team.id}_2`,
      deviceName: 'Google Pixel 8 Pro',
      platform: 'android',
      memberName: secondMember.name,
      memberRole: secondMember.role,
      connectedAt: '1 час назад',
      lastActiveAt: '3 мин назад',
      batteryLevel: 74,
      pushEnabled: true,
      ipAddress: '192.168.1.118',
    },
  ];
}

/**
 * Simulates connecting a new device after scanning the QR code
 */
export function createSimulatedDevice(
  team: Team,
  options: {
    deviceName?: string;
    platform?: 'ios' | 'android';
    memberName?: string;
  } = {},
): ConnectedMobileDevice {
  const candidates = [
    { name: 'Samsung Galaxy S24 Ultra', platform: 'android' as const },
    { name: 'iPhone 16 Pro', platform: 'ios' as const },
    { name: 'Xiaomi 14 Ultra', platform: 'android' as const },
    { name: 'iPad Pro 11" M4', platform: 'ios' as const },
  ];
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const randomMember = team.members[Math.floor(Math.random() * team.members.length)] || {
    name: 'Участник команды',
    role: 'Исследователь',
  };

  return {
    id: `dev_${team.id}_${Date.now()}`,
    deviceName: options.deviceName || chosen.name,
    platform: options.platform || chosen.platform,
    memberName: options.memberName || randomMember.name,
    memberRole: randomMember.role,
    connectedAt: 'Только что',
    lastActiveAt: 'В сети (активен)',
    batteryLevel: Math.floor(Math.random() * 30) + 70,
    pushEnabled: true,
    ipAddress: `192.168.1.${Math.floor(Math.random() * 150) + 50}`,
  };
}
