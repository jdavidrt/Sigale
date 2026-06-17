import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// Style foundation — import order is intentional:
// tokens → global → utilities → astromelias (each layer builds on the previous)
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/utilities.css";
import "./styles/astromelias.css";
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
const EditEventPage = lazy(() => import("./pages/EditEventPage").then((m) => ({ default: m.EditEventPage })));
const SellTicketsPage = lazy(() => import("./pages/SellTicketsPage").then((m) => ({ default: m.SellTicketsPage })));
const TicketsPage = lazy(() => import("./pages/TicketsPage").then((m) => ({ default: m.TicketsPage })));
const ValidateQRPage = lazy(() => import("./pages/ValidateQRPage").then((m) => ({ default: m.ValidateQRPage })));
const CopyEventPage = lazy(() => import("./pages/CopyEventPage").then((m) => ({ default: m.CopyEventPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
// 2.0 public routes (Astromelias) — rendered outside the organizer Layout.
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const PurchaseFlowPage = lazy(() => import("./pages/PurchaseFlowPage").then((m) => ({ default: m.PurchaseFlowPage })));
const PurchaseStatusPage = lazy(() => import("./pages/PurchaseStatusPage").then((m) => ({ default: m.PurchaseStatusPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const ScanPage = lazy(() => import("./pages/ScanPage").then((m) => ({ default: m.ScanPage })));
import { loadCharlyIllustration } from "./utils/svgTicketTemplate";
import { CHARLY_ILLUSTRATION_BASE64 } from "./assets/charlyIllustration";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { usePageVisibility } from "./hooks/usePageVisibility";
import { DebugPanel } from "./components/Common/DebugPanel";

// Organizer chrome (Navbar etc.) lives in Layout. Public 2.0 screens skip it.
function OrganizerLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

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
              <Suspense fallback={<div className="route-fallback">Loading…</div>}>
                <Routes>
                  {/* Public 2.0 routes — full-screen Astromelias, no organizer nav.
                      Root is the public landing (the shareable mockup surface). */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/evento/:id" element={<LandingPage />} />
                  <Route path="/compra" element={<PurchaseFlowPage />} />
                  <Route path="/compra/:orderId" element={<PurchaseStatusPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/scan" element={<ScanPage />} />

                  {/* Organizer routes — wrapped in Layout. The organizer home
                      (formerly at "/") now lives under /admin/create. */}
                  <Route element={<OrganizerLayout />}>
                    <Route path="/admin/create" element={<Home />} />
                    <Route path="/create-event" element={<CreateEventPage />} />
                    <Route path="/edit-event" element={<EditEventPage />} />
                    <Route path="/sell-tickets" element={<SellTicketsPage />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                    <Route path="/validate-qr" element={<ValidateQRPage />} />
                    <Route path="/copy-event" element={<CopyEventPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    {/* Catch-all route - redirect any unmatched paths to the landing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Suspense>
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
      {/* <DebugPanel /> */}
    </ErrorBoundary>
  );
}

export default App;
