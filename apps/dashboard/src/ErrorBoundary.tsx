/**
 * ErrorBoundary — Catches JavaScript errors anywhere in the child component tree,
 * displays a styled error page with retry functionality.
 */
import React from 'react';
import { Shield, RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo: errorInfo.componentStack || '' });
    console.error('[CrowdShield Error]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050505',
          color: '#e8e4dd',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          padding: 24,
          textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(197, 0, 34, 0.1)',
            border: '1px solid rgba(197, 0, 34, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
            boxShadow: '0 4px 24px rgba(197, 0, 34, 0.15)',
          }}>
            <AlertTriangle size={36} color="#C50022" />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28, fontWeight: 800,
            color: '#e8e4dd',
            marginBottom: 8,
          }}>
            Something went wrong
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 14, color: '#9a9588',
            maxWidth: 400, lineHeight: 1.6,
            marginBottom: 32,
          }}>
            An unexpected error occurred while rendering this page. Our team has been notified.
          </p>

          {/* Error details (collapsible) */}
          {this.state.error && (
            <details style={{
              width: '100%', maxWidth: 500,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(181,172,138,0.12)',
              borderRadius: 12,
              padding: 16, marginBottom: 24,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}>
              <summary style={{
                cursor: 'pointer', fontSize: 12,
                color: '#B5AC8A', fontWeight: 600,
                listStyle: 'none',
              }}>
                Technical Details
              </summary>
              <pre style={{
                marginTop: 12, fontSize: 11,
                color: '#C50022', fontFamily: 'monospace',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                lineHeight: 1.5, overflow: 'auto',
                maxHeight: 200,
              }}>
                {this.state.error.message}
                {this.state.errorInfo && '\n\n' + this.state.errorInfo}
              </pre>
            </details>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 10,
                background: '#C50022', border: 'none',
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                boxShadow: '0 2px 12px rgba(197,0,34,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(197,0,34,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(197,0,34,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(181,172,138,0.18)',
                color: '#B5AC8A', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif",
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(181,172,138,0.35)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(181,172,138,0.18)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Home size={16} /> Go Home
            </button>
          </div>

          {/* Branding */}
          <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="#C50022" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6b6760' }}>CROWDSHIELD</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
