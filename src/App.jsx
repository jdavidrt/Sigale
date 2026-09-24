import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

// Style foundation — import order is intentional:
// tokens → global → utilities → astromelias → skins (each layer builds on
// the previous). astromelias.css is structure only; each skins/*.skin.css
// supplies one event's full color-token contract, scoped to its own
// `.skin-*` body class (see skins/astromelias.skin.css for the contract and
// useEventSkin.js for how the class is chosen/swapped per event).
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/utilities.css";
import "./styles/astromelias.css";
import "./styles/skins/astromelias.skin.css";
import "./styles/skins/rock.skin.css";
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
const EventsAdminPage = lazy(() => import("./pages/EventsAdminPage").then((m) => ({ default: m.EventsAdminPage })));
const OrganizersAdminPage = lazy(() => import("./pages/OrganizersAdminPage").then((m) => ({ default: m.OrganizersAdminPage })));
// Public routes — rendered outside the organizer layout.
const EventsListPage = lazy(() => import("./pages/EventsListPage").then((m) => ({ default: m.EventsListPage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const PurchaseFlowPage = lazy(() => import("./pages/PurchaseFlowPage").then((m) => ({ default: m.PurchaseFlowPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const ScanPage = lazy(() => import("./pages/ScanPage").then((m) => ({ default: m.ScanPage })));
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { usePageVisibility } from "./hooks/usePageVisibility";
import { isLoggedIn, isSuperAdmin } from "./api/admin";

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

// Gate for super_admin-only tools (create event, events admin, organizers
// admin). An event_admin is bounced to the organizer home rather than to a
// route the server would 403 anyway.
function RequireSuperAdmin({ children }) {
  if (!isLoggedIn()) return <Navigate to="/admin" replace />;
  return isSuperAdmin() ? children : <Navigate to="/admin" replace />;
}

function AppContent() {
  const { isVisible } = usePageVisibility();

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
                  {/* Root landing — public grid of every published event. */}
                  <Route path="/" element={<EventsListPage />} />

                  {/* /admin is the organizer home (login + event hero +
                      purchase queue); it paints its own chrome. */}
                  <Route path="/admin" element={<AdminPage />} />

                  <Route path="/scan" element={<ScanPage />} />

                  {/* Organizer tools — all share the AdminLayout chrome, gated
                      by RequireAuth. /admin itself paints its own chrome. */}
                  <Route element={<RequireAuth><OrganizerLayout /></RequireAuth>}>
                    {/* Creating an event and the two account/event management
                        pages are super_admin-only (the server enforces it). */}
                    <Route path="/create-event" element={<RequireSuperAdmin><CreateEventPage /></RequireSuperAdmin>} />
                    <Route path="/edit" element={<EditEventPage />} />
                    <Route path="/sell-tickets" element={<SellTicketsPage />} />
                    <Route path="/guest-passes" element={<GuestPassesPage />} />
                    <Route path="/lista-puerta" element={<DoorListPage />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/events-admin" element={<RequireSuperAdmin><EventsAdminPage /></RequireSuperAdmin>} />
                    <Route path="/organizers" element={<RequireSuperAdmin><OrganizersAdminPage /></RequireSuperAdmin>} />
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
