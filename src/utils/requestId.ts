/**
 * Утилита генерации сквозных Request ID (Correlation ID) для трассировки операций.
 */

export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'req-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

export function createTraceHeaders(existingId?: string): Record<string, string> {
  const id = existingId || generateRequestId();
  return {
    'X-Request-ID': id,
    'X-Client-Timestamp': new Date().toISOString(),
  };
}
