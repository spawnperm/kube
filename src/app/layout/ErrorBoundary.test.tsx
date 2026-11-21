// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '@/src/app/layout/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Бортовой модуль работает</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Бортовой модуль работает')).toBeInTheDocument();
  });

  it('shows a fallback when a child throws', () => {
    const Boom = () => {
      throw new Error('разгерметизация');
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/сбое/i)).toBeInTheDocument();
    spy.mockRestore();
  });
});
