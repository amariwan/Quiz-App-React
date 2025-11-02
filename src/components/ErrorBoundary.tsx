'use client';

import React from 'react';

type State = {
  hasError: boolean;
  error?: Error | null;
};

export default class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2>Etwas ist schiefgelaufen.</h2>
          <p>Die Anwendung hat einen unerwarteten Fehler festgestellt.</p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#900' }}>{this.state.error?.message}</pre>
          <button onClick={() => window.location.reload()}>Seite neu laden</button>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
