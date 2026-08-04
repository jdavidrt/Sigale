import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams, useNavigate } from "react-router-dom";

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
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const GuestPassesPage = lazy(() => import("./pages/GuestPassesPage").then((m) => ({ default: m.GuestPassesPage })));
const DoorListPage = lazy(() => import("./pages/DoorListPage").then((m) => ({ default: m.DoorListPage })));
// 2.0 public routes (Astromelias) — rendered outside the organizer Layout.
const EventsListPage = lazy(() => import("./pages/EventsListPage").then((m) => ({ default: m.EventsListPage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const PurchaseFlowPage = lazy(() => import("./pages/PurchaseFlowPage").then((m) => ({ default: m.PurchaseFlowPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const ScanPage = lazy(() => import("./pages/ScanPage").then((m) => ({ default: m.ScanPage })));
import { loadFlyerImage } from "./utils/svgTicketTemplate";
import { FLYER_IMAGE_BASE64 } from "./assets/flyerImage";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { usePageVisibility } from "./hooks/usePageVisibility";
import { isLoggedIn } from "./api/admin";
import { eventsApi } from "./api/events";

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

// Legacy /evento/:id links (pre-2.0 multi-event) → /:slug. Falls back to the
// root landing when the event has no slug (a deploy-window-created event) or
// the id doesn't resolve at all — never gets stuck on a dead URL.
function LegacyEventRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    eventsApi
      .getById(id)
      .then((e) => {
        if (cancelled) return;
        navigate(e?.slug ? `/${e.slug}` : "/", { replace: true });
      })
      .catch(() => {
        if (!cancelled) navigate("/", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return <div className="route-fallback">Loading…</div>;
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
    <BrowserRouter>
      <LanguageProvider>
        <EventProvider>
          <TicketProvider>
            <DialogProvider>
              <Suspense fallback={<div className="route-fallback">Loading…</div>}>
                <Routes>
                  {/* Root landing — public grid of every published event
                      (multi-event: there is no more single "the" event). */}
                  <Route path="/" element={<EventsListPage />} />
                  <Route path="/compra" element={<Navigate to="/" replace />} />
                  <Route path="/evento/:id" element={<LegacyEventRedirect />} />

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
                    <Route path="/lista-puerta" element={<DoorListPage />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                    <Route path="/validate-qr" element={<Navigate to="/scan" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                  </Route>

                  {/* Public per-event routes — every event lives at /:slug
                      (/demo is just a slug like any other). react-router
                      ranks static path segments over dynamic ones regardless
                      of declaration order, so these never swallow the
                      literal routes above (/admin, /scan, /tickets, …). */}
                  <Route path="/:slug" element={<LandingPage />} />
                  <Route path="/:slug/compra" element={<PurchaseFlowPage />} />

                  {/* Catch-all lives at the top level (not inside RequireAuth)
                      so a logged-out visitor to an unknown URL lands on the
                      public root, not on /admin. */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </DialogProvider>
          </TicketProvider>
        </EventProvider>
      </LanguageProvider>
    </BrowserRouter>
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
