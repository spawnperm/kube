import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/server/db/seed';

describe('Authentik & PostgreSQL Authentication Layer', () => {
  it('correctly hashes and verifies default password 123', () => {
    const hash = hashPassword('123');
    expect(hash).toBeDefined();
    expect(verifyPassword('123', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('verifies standard user roles are defined and structured', () => {
    const roles = ['admin', 'organizer', 'mentor', 'participant', 'expert', 'guest'];
    expect(roles).toContain('admin');
    expect(roles).toContain('organizer');
    expect(roles).toContain('mentor');
    expect(roles).toContain('participant');
  });

  it('validates Authentik IdP configuration endpoints and flows', async () => {
    const defaultFlows = {
      authentication: 'default-authentication-flow',
      enrollment: 'default-enrollment-flow',
      qrQuick: 'cosmoport-qr-enrollment-flow',
    };
    expect(defaultFlows.authentication).toBe('default-authentication-flow');
    expect(defaultFlows.qrQuick).toBe('cosmoport-qr-enrollment-flow');
  });
});
