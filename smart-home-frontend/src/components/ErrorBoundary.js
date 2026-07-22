import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <div className="bg-white dark:bg-[var(--bg-card)] border border-red-200 dark:border-red-500/20 rounded-2xl p-8 shadow-sm text-center max-w-md">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Something went wrong</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
              >
                <RotateCcw size={14} /> Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
