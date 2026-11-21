import { describe, expect, it } from 'vitest';
import { createId } from './id';

describe('createId', () => {
  it('prefixes the generated identifier', () => {
    expect(createId('team').startsWith('team_')).toBe(true);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId('x')));
    expect(ids.size).toBe(100);
  });
});
