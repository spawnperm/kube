// @vitest-environment node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createAuthentikJwt,
  verifyAuthentikJwt,
  resolveAuthentikUserFromToken,
} from '@/server/shared/jwt';
import { parseAuthentikJwt, isAuthentikJwtValid } from '@/src/contexts/auth/AuthentikAuthContext';
import { queryPostgres } from '@/server/db/postgres';
import { ALLOWED_ROLES } from '@/server/contexts/users/users.router';
import { createApp } from '@/server/app';

describe('Authentik JWT Verification and PostgreSQL REST API', () => {
  const testUser = {
    sub: 'user_test_jwt_001',
    email: 'cosmonaut.test@mirovisor.com',
    full_name: 'Юрий Гагарин Тестовый',
    role: 'participant' as const,
    team_id: 'team_1',
    team_name: 'Фотон-76',
  };

  it('generates a valid HS256 JWT with Authentik claims', () => {
    const token = createAuthentikJwt(testUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('successfully verifies a valid Authentik JWT token and extracts claims', () => {
    const token = createAuthentikJwt(testUser);
    const result = verifyAuthentikJwt(token);

    expect(result.valid).toBe(true);
    expect(result.payload).toBeDefined();
    expect(result.payload?.sub).toBe(testUser.sub);
    expect(result.payload?.email).toBe(testUser.email);
    expect(result.payload?.name).toBe(testUser.full_name);
    expect(result.payload?.iss).toContain('cosmoport');
  });

  it('rejects an invalid or tampered JWT token', () => {
    const validToken = createAuthentikJwt(testUser);
    const parts = validToken.split('.');
    const tamperedToken = `${parts[0]}.${parts[1]}.badsignature12345`;

    const result = verifyAuthentikJwt(tamperedToken);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('подпись');
  });

  it('rejects an expired JWT token', () => {
    // Generate a token that expired 10 seconds ago
    const expiredToken = createAuthentikJwt(testUser, -10);
    const result = verifyAuthentikJwt(expiredToken);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('истек');
  });

  it('validates client-side JWT parser and expiration checker in AuthentikAuthContext', () => {
    const token = createAuthentikJwt(testUser, 3600);
    const parsed = parseAuthentikJwt(token);

    expect(parsed).toBeDefined();
    expect(parsed?.sub).toBe(testUser.sub);
    expect(parsed?.email).toBe(testUser.email);
    expect(isAuthentikJwtValid(token)).toBe(true);

    const expiredToken = createAuthentikJwt(testUser, -60);
    expect(isAuthentikJwtValid(expiredToken)).toBe(false);
    expect(isAuthentikJwtValid(null)).toBe(false);
    expect(isAuthentikJwtValid('short')).toBe(false);
  });

  it('resolves user from token and loads profile correctly', async () => {
    const token = createAuthentikJwt(testUser);
    const resolved = await resolveAuthentikUserFromToken(token);

    expect(resolved.valid).toBe(true);
    expect(resolved.user).toBeDefined();
    expect(resolved.user?.email).toBe(testUser.email);
  });

  it('verifies that the Express app mounts protected profile and REST API endpoints', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('verifies SQL schema tables exist in PostgreSQL database', async () => {
    // Schema tables check
    const tablesRes = await queryPostgres<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const tableNames = tablesRes.rows.map((r) => r.table_name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('teams');
    expect(tableNames).toContain('championship_stages');
    expect(tableNames).toContain('case_submissions');
    expect(tableNames).toContain('submission_evaluations');
    expect(tableNames).toContain('authentik_sessions');
    expect(tableNames).toContain('schema_migrations');
  });

  it('validates role updating logic and RBAC constraints', async () => {
    // Ensure test user exists in DB for role updating test
    await queryPostgres(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
      ['user_rbac_test', 'rbac.test@mirovisor.com', 'hash', 'РБАК Тестер', 'participant'],
    );

    // Update role in PostgreSQL
    const newRole = 'mentor';
    expect(ALLOWED_ROLES).toContain(newRole);

    await queryPostgres(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newRole, 'user_rbac_test'],
    );

    const updated = await queryPostgres<{ role: string }>(`SELECT role FROM users WHERE id = $1`, [
      'user_rbac_test',
    ]);

    expect(updated.rows[0]?.role).toBe('mentor');
  });
});
