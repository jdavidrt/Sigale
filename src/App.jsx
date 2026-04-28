import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Style foundation — import order is intentional:
// tokens → global → utilities (each layer builds on the previous)
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/utilities.css";
import { LanguageProvider } from "./context/LanguageContext";
import { EventProvider } from "./context/EventContext";
import { TicketProvider } from "./context/TicketContext";
import { DialogProvider } from "./context/DialogContext";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./pages/Home";
// M8: split heavier routes out of the main bundle. ValidateQRPage pulls in
// html5-qrcode (~100KB gz) and is only needed on one route; the rest of the
// pages are split too so the landing page ships as little JS as possible.
const CreateEventPage = lazy(() => import("./pages/CreateEventPage").then((m) => ({ default: m.CreateEventPage })));
const EditEventPage   = lazy(() => import("./pages/EditEventPage").then((m) => ({ default: m.EditEventPage })));
const SellTicketsPage = lazy(() => import("./pages/SellTicketsPage").then((m) => ({ default: m.SellTicketsPage })));
const TicketsPage     = lazy(() => import("./pages/TicketsPage").then((m) => ({ default: m.TicketsPage })));
const ValidateQRPage  = lazy(() => import("./pages/ValidateQRPage").then((m) => ({ default: m.ValidateQRPage })));
const CopyEventPage   = lazy(() => import("./pages/CopyEventPage").then((m) => ({ default: m.CopyEventPage })));
const DashboardPage   = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
import { loadCharlyIllustration } from "./utils/svgTicketTemplate";
import { CHARLY_ILLUSTRATION_BASE64 } from "./assets/charlyIllustration";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { usePageVisibility } from "./hooks/usePageVisibility";
import { DebugPanel } from "./components/Common/DebugPanel";

function AppContent() {
  // Monitor page visibility for iOS tab suspension
  const { isVisible } = usePageVisibility();

  // Load assets (Charly illustration) on app initialization
  useEffect(() => {
    loadCharlyIllustration(CHARLY_ILLUSTRATION_BASE64);
  }, []);

  // Log visibility changes in dev mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[App] Page visibility:', isVisible ? 'visible' : 'hidden');
    }
  }, [isVisible]);

  return (
    <LanguageProvider>
      <EventProvider>
        <TicketProvider>
          <DialogProvider>
            <BrowserRouter>
              <Layout>
                <Suspense fallback={<div style={{ padding: 24, textAlign: "center" }}>Loading…</div>}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/create-event" element={<CreateEventPage />} />
                    <Route path="/edit-event" element={<EditEventPage />} />
                    <Route path="/sell-tickets" element={<SellTicketsPage />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                    <Route path="/validate-qr" element={<ValidateQRPage />} />
                    <Route path="/copy-event" element={<CopyEventPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    {/* Catch-all route - redirect any unmatched paths to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            </BrowserRouter>
          </DialogProvider>
        </TicketProvider>
      </EventProvider>
    </LanguageProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
      <DebugPanel />
    </ErrorBoundary>
  );
}

export default App;
