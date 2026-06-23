import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Uncaught Error in Application Boundary]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-405 mb-6">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            
            <h1 className="text-xl font-bold text-white tracking-tight">Something unexpected occurred</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              The application experienced a safe rendering boundary block. We have caught the execution cycle cleanly.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-850 text-[10px] font-mono text-left text-slate-400 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="mt-6 w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset Application Sandbox
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
