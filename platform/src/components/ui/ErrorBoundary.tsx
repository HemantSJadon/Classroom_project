'use client';

import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center text-red-400 text-xl">
          ✕
        </div>
        <div className="space-y-1">
          <p className="font-medium text-gray-200">Something went wrong</p>
          <p className="text-sm text-gray-500">{this.state.message}</p>
        </div>
        <button
          onClick={() => this.setState({ hasError: false, message: '' })}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
}
