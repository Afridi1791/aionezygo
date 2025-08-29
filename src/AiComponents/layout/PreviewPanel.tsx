import React from 'react';
import { WebContainerState } from '../types';

// Professional SVG Icons
const SpinnerIcon = ({ className = "w-3 h-3" }) => (
  <svg className={`${className} animate-spin`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const BrowserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const RefreshIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FullscreenIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const ExitFullscreenIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ErrorIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface PreviewPanelProps {
  url: string | null;
  status: WebContainerState['status'];
  onRuntimeError?: (error: string) => void;
}

const StatusIndicator: React.FC<{ status: WebContainerState['status'] }> = ({ status }) => {
    let text = 'Initializing...';
    if (status === 'booting') text = 'Booting WebContainer...';
    if (status === 'installing') text = 'Installing Dependencies...';
    if (status === 'running') text = 'Server is Running';
    if (status === 'error') text = 'Error State';

    const color = status === 'error' ? 'text-red-400' : 'text-text-secondary';

    return (
        <div className="flex items-center space-x-2">
            {(status === 'booting' || status === 'installing') && <SpinnerIcon className="text-accent-primary" />}
            <span className={`text-sm ${color}`}>{text}</span>
        </div>
    );
};

const PreviewPanel: React.FC<PreviewPanelProps> = ({ url, status, onRuntimeError }) => {
    const iframeRef = React.useRef<HTMLIFrameElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    
    const handleRefresh = () => {
        if (iframeRef.current) {
            iframeRef.current.src = url || 'about:blank';
        }
    };
    const handleEnterFullscreen = async () => {
        try {
            if (containerRef.current && containerRef.current.requestFullscreen) {
                await containerRef.current.requestFullscreen();
            }
        } catch {}
        setIsFullscreen(true);
    };
    const handleExitFullscreen = async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch {}
        setIsFullscreen(false);
    };

    // Browser error capture
    React.useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !url || status !== 'running') return;

        const handleIframeLoad = () => {
            try {
                const iframeWindow = iframe.contentWindow;
                if (!iframeWindow) return;

                // Listen for JavaScript errors in the iframe
                const originalConsoleError = iframeWindow.console.error;
                iframeWindow.console.error = (...args: any[]) => {
                    // Call original console.error
                    originalConsoleError.apply(iframeWindow.console, args);
                    
                    // Capture the error for our error card
                    const errorMessage = args.map(arg => 
                        typeof arg === 'string' ? arg : 
                        arg instanceof Error ? arg.message : 
                        JSON.stringify(arg)
                    ).join(' ');
                    
                    if (onRuntimeError && errorMessage) {
                        onRuntimeError(`Runtime Error: ${errorMessage}`);
                    }
                };

                // Listen for unhandled errors
                iframeWindow.addEventListener('error', (event) => {
                    const errorMessage = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
                    if (onRuntimeError) {
                        onRuntimeError(`JavaScript Error: ${errorMessage}`);
                    }
                });

                // Listen for unhandled promise rejections
                iframeWindow.addEventListener('unhandledrejection', (event) => {
                    const errorMessage = event.reason instanceof Error ? 
                        event.reason.message : 
                        String(event.reason);
                    if (onRuntimeError) {
                        onRuntimeError(`Unhandled Promise Rejection: ${errorMessage}`);
                    }
                });

            } catch (error) {
                // Cross-origin restrictions might prevent access
                console.log('Cannot access iframe content (likely cross-origin):', error);
            }
        };

        iframe.addEventListener('load', handleIframeLoad);
        return () => {
            iframe.removeEventListener('load', handleIframeLoad);
        };
    }, [url, status, onRuntimeError]);

    React.useEffect(() => {
        const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);
    
    const displayUrl = url || '...';

    return (
                <div 
            ref={containerRef}
            className={`${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen' : 'flex-1'} flex flex-col bg-bg-primary border-r border-border-primary min-w-[300px]`}
        >
            <div className="flex items-center justify-between p-3 border-b border-border-primary flex-shrink-0 h-[50px] glass">
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <BrowserIcon className="w-4 h-4" />
                    <span className="font-medium">Preview</span>
                </div>
                <div className="flex-1 flex justify-center">
                    <a
                      href={url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      title={displayUrl}
                      className="bg-bg-glass-light px-3 py-1.5 rounded-lg text-xs text-text-primary font-mono w-full max-w-[360px] truncate text-center hover:bg-bg-glass transition-all duration-200 border border-border-secondary"
                    >
                      {displayUrl}
                    </a>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handleRefresh} disabled={!url} className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-50 transition-all duration-200 rounded-lg hover:bg-bg-glass">
                        <RefreshIcon className="w-4 h-4" />
                    </button>
                    {!isFullscreen ? (
                        <button onClick={handleEnterFullscreen} disabled={!url} className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-50 transition-all duration-200 rounded-lg hover:bg-bg-glass" aria-label="Enter fullscreen">
                            <FullscreenIcon className="w-4 h-4" />
                        </button>
                    ) : (
                        <button onClick={handleExitFullscreen} className="p-2 text-text-secondary hover:text-text-primary transition-all duration-200 rounded-lg hover:bg-bg-glass" aria-label="Exit fullscreen">
                            <ExitFullscreenIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 bg-bg-secondary relative">
                {url && status === 'running' ? (
                    <iframe
                        ref={iframeRef}
                        src={url}
                        className="w-full h-full border-0"
                        title="WebContainer Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                    ></iframe>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-center p-4">
                        <div className="flex flex-col items-center">
                            <StatusIndicator status={status} />
                            <p className="text-sm text-text-secondary mt-2">
                                {status === 'booting' && 'Please wait while the environment is prepared.'}
                                {status === 'installing' && 'This may take a few moments.'}
                                {status === 'error' && 'Check the terminal for error details.'}
                                {status === 'idle' && 'The preview server is not yet running.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PreviewPanel;
