import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught an error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-5xl">🛰️</div>
            <h1 className="text-lg font-bold text-white">Бортовой модуль сообщает о сбое</h1>
            <p className="text-sm text-slate-400 break-words">
              {this.state.message || 'Произошла непредвиденная ошибка интерфейса.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, message: undefined });
                this.props.onReset?.();
              }}
              className="min-h-[44px] px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
            >
              Перезагрузить интерфейс
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
