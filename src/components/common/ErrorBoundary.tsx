import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
                    <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/10 max-w-lg w-full text-center shadow-2xl backdrop-blur-xl">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} className="text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">เกิดข้อผิดพลาดบางอย่าง</h1>
                        <p className="text-slate-400 mb-6">ระบบทำงานผิดพลาด กรุณาลองโหลดหน้าจอใหม่</p>

                        <div className="bg-black/30 p-4 rounded-lg text-left text-xs font-mono text-red-300 mb-6 overflow-auto max-h-40">
                            {this.state.error?.toString()}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl font-semibold flex items-center justify-center gap-2 mx-auto transition-all"
                        >
                            <RefreshCcw size={18} />
                            โหลดหน้าจอใหม่
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
