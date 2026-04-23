import React from 'react'

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'hsl(260 87% 3%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'monospace',
        }}>
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: '0.875rem',
            padding: '2rem',
            maxWidth: 640,
            width: '100%',
          }}>
            <h2 style={{ color: '#f87171', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              ⚠ Render Error
            </h2>
            <p style={{ color: 'hsl(40 6% 75%)', fontSize: 13, marginBottom: '1rem' }}>
              {this.state.error.message}
            </p>
            <pre style={{
              color: 'hsl(240 5% 60%)',
              fontSize: 11,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
            }}>
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              style={{
                marginTop: '1.25rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '0.5rem',
                background: 'rgba(248,113,113,0.15)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
