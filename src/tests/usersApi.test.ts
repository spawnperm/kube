import { describe, it, expect } from 'vitest';
import { ALLOWED_ROLES } from '@/server/contexts/users/users.router';

describe('Users REST API & PostgreSQL Schema', () => {
  it('defines the required roles in RBAC', () => {
    expect(ALLOWED_ROLES).toContain('admin');
    expect(ALLOWED_ROLES).toContain('organizer');
    expect(ALLOWED_ROLES).toContain('mentor');
    expect(ALLOWED_ROLES).toContain('participant');
    expect(ALLOWED_ROLES).toContain('expert');
    expect(ALLOWED_ROLES).toContain('guest');
  });

  it('validates role values correctly', () => {
    const isValid = (r: string) => ALLOWED_ROLES.includes(r as any);
    expect(isValid('participant')).toBe(true);
    expect(isValid('mentor')).toBe(true);
    expect(isValid('invalid_role')).toBe(false);
  });
});
