import { describe, it, expect } from 'vitest';
import { generateRequestId, createTraceHeaders } from './requestId';

describe('requestId utility', () => {
  it('генерирует уникальный непустой ID запроса', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('формирует корректные заголовки трассировки', () => {
    const headers = createTraceHeaders();

    expect(headers['X-Request-ID']).toBeDefined();
    expect(headers['X-Client-Timestamp']).toBeDefined();
    expect(new Date(headers['X-Client-Timestamp']).getTime()).toBeGreaterThan(0);
  });

  it('сохраняет переданный correlation ID', () => {
    const customId = 'custom-trace-12345';
    const headers = createTraceHeaders(customId);

    expect(headers['X-Request-ID']).toBe(customId);
  });
});
