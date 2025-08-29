import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

class ErrorBoundary extends React.Component<Props, State> {
  public readonly state: State = { hasError: false };
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Generate a unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error details for debugging
    console.group('🚨 Error Boundary Details');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  private handleRetry = (): void => {
    this.retryCount++;
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleRefresh = (): void => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.retryCount < this.maxRetries;
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';

      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
          <div className="text-center max-w-lg mx-auto">
            <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-text-primary mb-4">Oops! Something went wrong</h2>
            
            <p className="text-text-secondary text-lg mb-6 leading-relaxed">
              {canRetry 
                ? "Don't worry - this happens sometimes. Try continuing without refreshing the page."
                : "The application encountered a persistent error. A page refresh may help resolve the issue."
              }
            </p>

            {/* Error details (collapsible) */}
            <details className="mb-6 text-left">
              <summary className="text-text-secondary text-xs cursor-pointer hover:text-text-primary transition-colors">
                🔍 Error Details (for debugging)
              </summary>
              <div className="mt-2 p-3 bg-bg-glass-light rounded-lg border border-border-secondary">
                <p className="text-xs font-mono text-red-400 break-all">
                  {errorMessage}
                </p>
                {this.state.errorId && (
                  <p className="text-xs text-text-secondary mt-2">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
            </details>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="px-6 py-3 rounded-xl bg-gradient-accent hover:shadow-accent-hover text-text-primary font-medium transition-all duration-200"
                >
                  🔄 Try Again
                </button>
              )}
              
              <button
                onClick={this.handleRefresh}
                className={`${canRetry ? 'px-6 py-3 rounded-xl bg-bg-glass-light hover:bg-bg-glass text-text-primary font-medium transition-all duration-200 border border-border-secondary' : 'px-6 py-3 rounded-xl bg-gradient-accent hover:shadow-accent-hover text-text-primary font-medium transition-all duration-200'}`}
              >
                🔃 Refresh Page
              </button>
            </div>

            <div className="mt-6 text-xs text-text-secondary">
              Retry attempts: {this.retryCount}/{this.maxRetries}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
