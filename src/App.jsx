import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Style foundation — import order is intentional:
// tokens → global → utilities (each layer builds on the previous)
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/utilities.css";
import { LanguageProvider } from "./context/LanguageContext";
import { EventProvider } from "./context/EventContext";
import { TicketProvider } from "./context/TicketContext";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./pages/Home";
import { CreateEventPage } from "./pages/CreateEventPage";
import { EditEventPage } from "./pages/EditEventPage";
import { SellTicketsPage } from "./pages/SellTicketsPage";
import { TicketsPage } from "./pages/TicketsPage";
import { ValidateQRPage } from "./pages/ValidateQRPage";
import { CopyEventPage } from "./pages/CopyEventPage";
import { DashboardPage } from "./pages/DashboardPage";
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
          <BrowserRouter>
            <Layout>
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
            </Layout>
          </BrowserRouter>
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
