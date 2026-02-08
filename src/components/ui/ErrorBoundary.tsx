import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-red-500 p-8 font-mono overflow-auto z-50 relative">
                    <h1 className="text-2xl font-bold mb-4">⚠️ Application Crashed</h1>
                    <div className="mb-4">
                        <h2 className="text-xl text-white mb-2">Error:</h2>
                        <pre className="bg-gray-900 p-4 rounded border border-red-900 whitespace-pre-wrap">
                            {this.state.error?.toString()}
                        </pre>
                    </div>
                    <div>
                        <h2 className="text-xl text-white mb-2">Component Stack:</h2>
                        <pre className="bg-gray-900 p-4 rounded border border-gray-800 text-sm opacity-80 whitespace-pre-wrap">
                            {this.state.errorInfo?.componentStack || 'No stack trace available'}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
