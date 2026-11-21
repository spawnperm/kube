import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { commitOnSuccessfulBuild } from './useTelemetrySimulator';

describe('useTelemetrySimulator - commitOnSuccessfulBuild', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('successfully executes commitOnSuccessfulBuild and updates OBC state with simulated commit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        commitHash: 'a1b2c3d',
        message: 'feat(build): verified build commit',
      }),
    } as Response);

    const result = await commitOnSuccessfulBuild('feat(build): verified build commit');

    expect(result.success).toBe(true);
    expect(result.commitHash).toBe('a1b2c3d');
    expect(result.obcState).toBeDefined();
    expect(result.obcState.lastBuildCommit).toBe('a1b2c3d');
    expect(result.obcState.obcStatus).toBe('ONLINE_BUILD_COMMITTED');
    expect(result.obcState.mode).toBe('NORMAL');
    expect(typeof result.obcState.obcTempC).toBe('number');
  });

  it('handles offline fallback gracefully when server is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await commitOnSuccessfulBuild();

    expect(result.success).toBe(true);
    expect(result.commitHash).toMatch(/^bld-/);
    expect(result.obcState.obcStatus).toBe('ONLINE_BUILD_COMMITTED');
  });
});
