import { useState, useEffect } from 'react';

/**
 * Debug panel for diagnosing mobile browser suspension issues
 * Enable by adding ?debug=1 to the URL
 * Logs lifecycle events, service worker state, cache status, and routing info
 */
export const DebugPanel = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);

    // Check URL param to enable debug mode
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const debugEnabled = params.get('debug') === '1';
        setIsVisible(debugEnabled);

        if (debugEnabled) {
            addLog('🟢 Debug panel initialized');
        }
    }, []);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
        setLogs(prev => [...prev, { timestamp, message }].slice(-50)); // Keep last 50 logs
    };

    useEffect(() => {
        if (!isVisible) return;

        // Page visibility events
        const handleVisibilityChange = () => {
            addLog(`👁️ Visibility: ${document.hidden ? 'HIDDEN' : 'VISIBLE'}`);
        };

        const handlePageHide = () => {
            addLog('🌙 Page HIDE (backgrounded)');
            sessionStorage.setItem('debug-last-hide', Date.now().toString());
        };

        const handlePageShow = (event) => {
            const lastHide = sessionStorage.getItem('debug-last-hide');
            const suspendedTime = lastHide ? Date.now() - parseInt(lastHide) : 0;
            addLog(`☀️ Page SHOW (foregrounded) - suspended ${Math.round(suspendedTime / 1000)}s`);
            if (event.persisted) {
                addLog('💾 Restored from bfcache');
            }
        };

        const handleFocus = () => addLog('🎯 Window FOCUS');
        const handleBlur = () => addLog('😶‍🌫️ Window BLUR');

        // Service worker events
        const handleControllerChange = () => {
            addLog('🔄 Service worker controller changed');
        };

        // Route changes
        const logRoute = () => {
            addLog(`🗺️ Route: ${window.location.pathname}`);
        };

        // Storage availability
        const checkStorage = () => {
            try {
                localStorage.setItem('debug-test', '1');
                localStorage.removeItem('debug-test');
                addLog('💾 localStorage: OK');
            } catch (e) {
                addLog('❌ localStorage: FAILED');
            }
        };

        // Service worker status
        const checkServiceWorker = async () => {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    addLog(`⚙️ SW: ${registration.active ? 'ACTIVE' : 'INACTIVE'}`);
                } else {
                    addLog('⚙️ SW: Not registered');
                }
            } else {
                addLog('⚙️ SW: Not supported');
            }
        };

        // Cache status
        const checkCache = async () => {
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    const hasIndexHtml = await caches.match('/index.html');
                    addLog(`📦 Cache: ${cacheNames.length} caches, index.html ${hasIndexHtml ? 'CACHED' : 'MISSING'}`);
                } catch (e) {
                    addLog('📦 Cache: Error checking');
                }
            }
        };

        // Initial checks
        logRoute();
        checkStorage();
        checkServiceWorker();
        checkCache();

        // Event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
        }

        // Route change detection (for SPAs)
        const originalPushState = window.history.pushState;
        window.history.pushState = function (...args) {
            originalPushState.apply(this, args);
            logRoute();
        };

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('pageshow', handlePageShow);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            }

            window.history.pushState = originalPushState;
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: isMinimized ? 'auto' : '10px',
            top: isMinimized ? '10px' : 'auto',
            right: '10px',
            width: isMinimized ? 'auto' : '90vw',
            maxWidth: isMinimized ? 'auto' : '400px',
            maxHeight: isMinimized ? 'auto' : '50vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: '11px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #00ff00'
        }}>
            {/* Header */}
            <div style={{
                padding: '8px 12px',
                borderBottom: isMinimized ? 'none' : '1px solid #00ff00',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
            }} onClick={() => setIsMinimized(!isMinimized)}>
                <span style={{ fontWeight: 'bold' }}>🐛 Debug Panel</span>
                <span style={{ fontSize: '16px' }}>{isMinimized ? '▼' : '▲'}</span>
            </div>

            {/* Logs */}
            {!isMinimized && (
                <>
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '8px 12px',
                        lineHeight: '1.4'
                    }}>
                        {logs.length === 0 ? (
                            <div style={{ opacity: 0.5 }}>Waiting for events...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} style={{ marginBottom: '4px' }}>
                                    <span style={{ opacity: 0.6 }}>[{log.timestamp}]</span>{' '}
                                    {log.message}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Actions */}
                    <div style={{
                        padding: '8px 12px',
                        borderTop: '1px solid #00ff00',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => setLogs([])}
                            style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                backgroundColor: '#1a1a1a',
                                color: '#00ff00',
                                border: '1px solid #00ff00',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => {
                                const text = logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n');
                                navigator.clipboard.writeText(text);
                                addLog('📋 Copied to clipboard');
                            }}
                            style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                backgroundColor: '#1a1a1a',
                                color: '#00ff00',
                                border: '1px solid #00ff00',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Copy
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                backgroundColor: '#1a1a1a',
                                color: '#00ff00',
                                border: '1px solid #00ff00',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Reload
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
