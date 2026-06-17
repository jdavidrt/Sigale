import { useState, useEffect } from "react";
import s from "./DebugPanel.module.css";

/**
 * Debug panel for diagnosing mobile browser suspension issues.
 * Enable by adding ?debug=1 to the URL or setting localStorage.debug = "1".
 * Logs lifecycle events, service worker state, cache status, and routing info.
 */
export const DebugPanel = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [logs, setLogs] = useState([]);
    const [isMinimized, setIsMinimized] = useState(false);

    // Check URL param or localStorage to enable debug mode
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const debugFromUrl = params.get("debug") === "1";
        const debugFromStorage = localStorage.getItem("debug") === "1";
        const debugEnabled = debugFromUrl || debugFromStorage;

        setIsVisible(debugEnabled);

        if (debugEnabled) {
            addLog("🟢 Debug panel initialized");
        }
    }, []);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            fractionalSecondDigits: 3,
        });
        setLogs((prev) => [...prev, { timestamp, message }].slice(-50));
    };

    useEffect(() => {
        if (!isVisible) return;

        // Page visibility events
        const handleVisibilityChange = () => {
            addLog(`👁️ Visibility: ${document.hidden ? "HIDDEN" : "VISIBLE"}`);
        };

        const handlePageHide = () => {
            addLog("🌙 Page HIDE (backgrounded)");
            sessionStorage.setItem("debug-last-hide", Date.now().toString());
        };

        const handlePageShow = (event) => {
            const lastHide = sessionStorage.getItem("debug-last-hide");
            const suspendedTime = lastHide ? Date.now() - parseInt(lastHide) : 0;
            addLog(`☀️ Page SHOW (foregrounded) - suspended ${Math.round(suspendedTime / 1000)}s`);
            if (event.persisted) {
                addLog("💾 Restored from bfcache");
            }
        };

        const handleFocus = () => addLog("🎯 Window FOCUS");
        const handleBlur  = () => addLog("😶‍🌫️ Window BLUR");

        const handleControllerChange = () => {
            addLog("🔄 Service worker controller changed");
        };

        const logRoute = () => {
            addLog(`🗺️ Route: ${window.location.pathname}`);
        };

        const checkStorage = () => {
            try {
                localStorage.setItem("debug-test", "1");
                localStorage.removeItem("debug-test");
                addLog("💾 localStorage: OK");
            } catch {
                addLog("❌ localStorage: FAILED");
            }
        };

        const checkServiceWorker = async () => {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    addLog(`⚙️ SW: ${registration.active ? "ACTIVE" : "INACTIVE"}`);
                } else {
                    addLog("⚙️ SW: Not registered");
                }
            } else {
                addLog("⚙️ SW: Not supported");
            }
        };

        const checkCache = async () => {
            if ("caches" in window) {
                try {
                    const cacheNames   = await caches.keys();
                    const hasIndexHtml = await caches.match("/index.html");
                    addLog(`📦 Cache: ${cacheNames.length} caches, index.html ${hasIndexHtml ? "CACHED" : "MISSING"}`);
                } catch {
                    addLog("📦 Cache: Error checking");
                }
            }
        };

        // Initial checks
        logRoute();
        checkStorage();
        checkServiceWorker();
        checkCache();

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("pagehide", handlePageHide);
        window.addEventListener("pageshow", handlePageShow);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("blur", handleBlur);

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
        }

        // Route change detection for SPA
        const originalPushState = window.history.pushState;
        window.history.pushState = function (...args) {
            originalPushState.apply(this, args);
            logRoute();
        };

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("pagehide", handlePageHide);
            window.removeEventListener("pageshow", handlePageShow);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("blur", handleBlur);

            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
            }

            window.history.pushState = originalPushState;
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div className={`${s.panel} ${isMinimized ? s.minimized : ""}`}>
            {/* Header */}
            <div className={s.header} onClick={() => setIsMinimized(!isMinimized)}>
                <span className={s.headerTitle}>🐛 Debug Panel</span>
                <span className={s.headerToggle}>{isMinimized ? "▼" : "▲"}</span>
            </div>

            {/* Logs + Actions — hidden when minimized */}
            {!isMinimized && (
                <>
                    <div className={s.logArea}>
                        {logs.length === 0 ? (
                            <div className={s.logEmpty}>Waiting for events...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className={s.logEntry}>
                                    <span className={s.logTimestamp}>[{log.timestamp}]</span>{" "}
                                    {log.message}
                                </div>
                            ))
                        )}
                    </div>

                    <div className={s.actionsBar}>
                        <button
                            onClick={() => setLogs([])}
                            className={s.actionBtn}
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => {
                                const text = logs.map((l) => `[${l.timestamp}] ${l.message}`).join("\n");
                                navigator.clipboard.writeText(text);
                                addLog("📋 Copied to clipboard");
                            }}
                            className={s.actionBtn}
                        >
                            Copy
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className={s.actionBtn}
                        >
                            Reload
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
