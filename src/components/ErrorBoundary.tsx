import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  private getFriendlyMessage(error: Error): string {
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string };
      if (parsed?.error?.includes('Quota exceeded')) {
        return 'Daily Firestore quota has been reached. Quota resets tomorrow.';
      }
      if (parsed?.error?.includes('Missing or insufficient permissions')) {
        return 'Your session does not have permission for this action. Try signing out and signing back in.';
      }
      if (parsed?.error) {
        return parsed.error;
      }
    } catch {
      // Standard non-JSON error
    }
    return error.message || 'An unexpected error occurred while loading your habits.';
  }

  render() {
    if (this.state.error) {
      const message = this.getFriendlyMessage(this.state.error);
      return (
        <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-[#E6E8F2] rounded-2xl p-8 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#0F172A] mb-2">Something interrupted your sync</h1>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">{message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl bg-[#4F46E5] text-white text-sm font-semibold hover:bg-[#4338CA] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
