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
import { AdminLayout } from "./components/Layout/AdminLayout";
// Heavier routes are lazy-loaded so the landing ships minimal JS.
const CreateEventPage = lazy(() => import("./pages/CreateEventPage").then((m) => ({ default: m.CreateEventPage })));
const EditEventPage = lazy(() => import("./pages/EditEventPage").then((m) => ({ default: m.EditEventPage })));
const SellTicketsPage = lazy(() => import("./pages/SellTicketsPage").then((m) => ({ default: m.SellTicketsPage })));
const TicketsPage = lazy(() => import("./pages/TicketsPage").then((m) => ({ default: m.TicketsPage })));
const ValidateQRPage = lazy(() => import("./pages/ValidateQRPage").then((m) => ({ default: m.ValidateQRPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const GuestPassesPage = lazy(() => import("./pages/GuestPassesPage").then((m) => ({ default: m.GuestPassesPage })));
// 2.0 public routes (Astromelias) — rendered outside the organizer Layout.
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const PurchaseFlowPage = lazy(() => import("./pages/PurchaseFlowPage").then((m) => ({ default: m.PurchaseFlowPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const ScanPage = lazy(() => import("./pages/ScanPage").then((m) => ({ default: m.ScanPage })));
import { loadFlyerImage } from "./utils/svgTicketTemplate";
import { FLYER_IMAGE_BASE64 } from "./assets/flyerImage";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { usePageVisibility } from "./hooks/usePageVisibility";
import { isLoggedIn } from "./api/admin";

// Organizer chrome (Astromelias topbar + OrganizerMenu sidebar) for every
// admin-tooling route. Each child page renders inside the dark Screen.
function OrganizerLayout() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

// Gate for every organizer tool. The local check is a UX gate only — the
// server still re-validates organizer credentials on each write.
function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/admin" replace />;
}

function AppContent() {
  const { isVisible } = usePageVisibility();

  useEffect(() => {
    loadFlyerImage(FLYER_IMAGE_BASE64);
  }, []);

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
                  {/* Public 2.0 routes — full-screen Astromelias, no organizer nav. */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/evento/:id" element={<LandingPage />} />
                  <Route path="/compra" element={<PurchaseFlowPage />} />

                  {/* /admin is the single organizer home (login + event hero +
                      purchase queue). Old /admin/create URL now redirects here. */}
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/create" element={<Navigate to="/admin" replace />} />

                  <Route path="/scan" element={<ScanPage />} />

                  {/* Organizer tools — all share the AdminLayout chrome, gated
                      by RequireAuth. /admin itself paints its own chrome. */}
                  <Route element={<RequireAuth><OrganizerLayout /></RequireAuth>}>
                    <Route path="/create-event" element={<CreateEventPage />} />
                    <Route path="/edit" element={<EditEventPage />} />
                    <Route path="/edit-event" element={<Navigate to="/edit" replace />} />
                    <Route path="/sell-tickets" element={<SellTicketsPage />} />
                    <Route path="/guest-passes" element={<GuestPassesPage />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                    <Route path="/validate-qr" element={<ValidateQRPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
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
    </ErrorBoundary>
  );
}

export default App;
