import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Optional fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    try {
      const { supabase } = require('@/integrations/supabase/client');
      supabase.from('system_errors').insert({
        service: 'frontend',
        error_type: 'react_crash',
        payload: {
          message: error.message,
          stack: error.stack?.slice(0, 500),
          component: errorInfo.componentStack?.slice(0, 300),
        },
      }).then(() => {});
    } catch {}
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/8 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold mb-2 text-foreground">Something went wrong</h1>
              <p className="text-body-sm text-muted-foreground">
                An unexpected error occurred. Our team has been notified.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 rounded-lg bg-muted text-left" role="alert">
                <p className="text-[11px] font-mono text-muted-foreground truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry} className="gap-2" aria-label="Retry loading the page">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2" aria-label="Go to homepage">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
