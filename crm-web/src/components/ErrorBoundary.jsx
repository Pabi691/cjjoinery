import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white' }}>
          <h1>Component Crashed</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre style={{ fontSize: '10px' }}>{this.state.errorInfo.componentStack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;
