import { Component } from 'react';
import { PALETTE } from '../constants/palette.js';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[NKart] Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: PALETTE.UI_SECONDARY, color: '#F5F5F5',
          fontFamily: "'Rajdhani', sans-serif",
        }}>
          <h1 style={{ fontSize: 48, fontWeight: 700, color: PALETTE.UI_ACCENT, marginBottom: 16 }}>
            CRASH!
          </h1>
          <p style={{ fontSize: 18, color: '#AAA', marginBottom: 24, maxWidth: 500, textAlign: 'center' }}>
            Something went wrong. The kart hit a wall it couldn't recover from.
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
          >
            RETURN TO MENU
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
