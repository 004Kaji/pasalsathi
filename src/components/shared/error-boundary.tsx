'use client'
import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children:  ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Wire a monitoring service here when ready (e.g. Sentry)
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-lg font-bold text-[#1C1917] mb-2">Something went wrong</p>
          <p className="text-sm text-[#6B6560] mb-6 max-w-xs">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-6 py-3 bg-[#C84B2F] text-white rounded-xl font-semibold text-sm active:scale-95"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
