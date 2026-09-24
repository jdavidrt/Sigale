import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { eventsApi } from "../api/events";
import { getAuth, isLoggedIn } from "../api/admin";
import { useLocalStorageValue } from "../hooks/useLocalStorageValue";

/** Build the organizer Basic-auth header for write calls, or undefined if not logged in. */
function authOpts() {
  const auth = getAuth();
  return auth?.basic ? { headers: { Authorization: `Basic ${auth.basic}` } } : undefined;
}

const EventContext = createContext();

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error("useEvent must be used within EventProvider");
  return context;
};

// Nothing auto-loads on mount. Public pages resolve an event by URL slug
// (loadEventBySlug); the organizer panel scopes to whichever event is
// selected (selectEvent), restored across visits via a persisted id. The DB
// is the source of truth — only the selected event id (a preference) is
// kept in localStorage.
export const EventProvider = ({ children }) => {
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  // A failed GET /api/events/all must not read as "zero events" (AdminPage
  // would bounce to /create-event); surfacing the error lets the page show a
  // retry instead (stale creds, cold dyno, network blip).
  const [organizerEventsError, setOrganizerEventsError] = useState(null);
  // False until GET /api/events/all has resolved at least once. An empty
  // `organizerEvents` before that means "not fetched yet", not "this
  // organizer has zero events" — AdminPage must not redirect a super_admin
  // to /create-event on that first, still-empty render.
  const [organizerEventsLoaded, setOrganizerEventsLoaded] = useState(false);
  const [selectedEventId, setSelectedEventId] = useLocalStorageValue("sigale-selected-event-id", "");

  // "Latest value" refs read by refreshOrganizerEvents (identity-stable, deps
  // []) so its "already on the right event" check compares against current
  // state instead of whatever event/selectedEventId were at the render where
  // it was last recreated — that staleness was why it never actually skipped
  // the redundant selectEvent() call, and why /api/events/:id kept refiring.
  const eventRef = useRef(event);
  eventRef.current = event;
  const selectedEventIdRef = useRef(selectedEventId);
  selectedEventIdRef.current = selectedEventId;
  // Collapses overlapping refreshOrganizerEvents() calls (e.g. EventProvider's
  // own bootstrap firing around the same time as OrganizerMenu's mount-time
  // call) into the one in-flight request.
  const inFlightRef = useRef(null);
  // Runs the bootstrap fetch once per EventProvider mount (i.e. once per
  // session — EventProvider itself never unmounts), not once per mount of
  // whichever page happens to render OrganizerMenu first.
  const bootstrappedRef = useRef(false);

  /** Public pages: resolve an event by its URL slug (LandingPage, PurchaseFlowPage). */
  const loadEventBySlug = useCallback((slug) => {
    if (!slug) {
      setEvent(null);
      return Promise.resolve(null);
    }
    setEventLoading(true);
    return eventsApi
      .getBySlug(slug)
      .then((e) => {
        setEvent(e);
        return e;
      })
      .catch(() => {
        setEvent(null);
        return null;
      })
      .finally(() => setEventLoading(false));
  }, []);

  /** Organizer: switch the scoped event (persisted so it survives a reload). */
  const selectEvent = useCallback(
    (id) => {
      if (!id) return Promise.resolve(null);
      setSelectedEventId(String(id));
      setEventLoading(true);
      return eventsApi
        .getById(id)
        .then((e) => {
          setEvent(e);
          return e;
        })
        .catch(() => {
          setEvent(null);
          return null;
        })
        .finally(() => setEventLoading(false));
    },
    [setSelectedEventId],
  );

  // Kept in a ref for the same reason as eventRef/selectedEventIdRef above:
  // refreshOrganizerEvents must call the *current* selectEvent without
  // taking on its identity as a dependency.
  const selectEventRef = useRef(selectEvent);
  selectEventRef.current = selectEvent;

  /**
   * Organizer event selector: fetch every event, then restore the persisted
   * selection if it still exists, else default to the most recent
   * (eventsApi.listAll is ORDER BY eventDate DESC). Referentially stable
   * (deps []) and idempotent — safe to call from both EventProvider's own
   * bootstrap and OrganizerMenu's mount effect without re-fetching the
   * already-selected event or racing itself when both fire close together.
   */
  const refreshOrganizerEvents = useCallback(() => {
    if (inFlightRef.current) return inFlightRef.current;
    const promise = (async () => {
      try {
        const rows = await eventsApi.listAll(authOpts());
        setOrganizerEvents(rows);
        setOrganizerEventsError(null);
        setOrganizerEventsLoaded(true);
        const currentSelectedId = selectedEventIdRef.current;
        const stillExists = currentSelectedId && rows.some((r) => String(r.id) === String(currentSelectedId));
        if (stillExists) {
          if (!eventRef.current || String(eventRef.current.id) !== String(currentSelectedId)) {
            await selectEventRef.current(currentSelectedId);
          }
        } else if (rows.length > 0) {
          await selectEventRef.current(rows[0].id);
        } else {
          setEvent(null);
        }
        return rows;
      } catch (err) {
        // Leave organizerEvents/event untouched — a transient failure must not
        // erase an already-loaded list, and must not read as "no events".
        setOrganizerEventsError(err?.message || 'No se pudieron cargar los eventos');
        throw err;
      } finally {
        inFlightRef.current = null;
      }
    })();
    inFlightRef.current = promise;
    return promise;
  }, []);

  // Bootstrap once per session (EventProvider mounts once for the app's
  // lifetime) when the organizer already has credentials — e.g. an F5 on
  // /admin with a persisted login, so Panel's loading/error/empty branches
  // never wait on OrganizerMenu mounting. OrganizerMenu's own mount-time call
  // is what fetches the list right after a fresh login, since that happens
  // after this effect has already run once.
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    if (isLoggedIn()) {
      refreshOrganizerEvents().catch(() => {});
    }
  }, [refreshOrganizerEvents]);

  /** Re-fetch whatever event is currently loaded (by id — works for both a
   * slug-loaded public event and an organizer-selected one). Swallows
   * errors and leaves the current state untouched, since this is called
   * after routine actions (confirm/reject a purchase) where a transient
   * network hiccup shouldn't blank an already-rendered page. */
  const refreshEvent = useCallback(() => {
    if (!event?.id) return Promise.resolve(null);
    return eventsApi
      .getById(event.id)
      .then((e) => {
        setEvent(e);
        return e;
      })
      .catch(() => null);
  }, [event?.id]);

  const createEvent = useCallback(
    async (eventData) => {
      const created = await eventsApi.create(eventData, authOpts());
      setEvent(created);
      setSelectedEventId(String(created.id));
      // Best-effort refresh so the new event shows up in the selector right
      // away; a failure here doesn't affect the event that was just created.
      eventsApi
        .listAll(authOpts())
        .then(setOrganizerEvents)
        .catch(() => {});
      return created;
    },
    [setSelectedEventId],
  );

  const updateEvent = useCallback(
    async (eventData) => {
      const id = event?.id ?? eventData.id;
      if (!id) throw new Error("No hay un evento seleccionado para actualizar.");
      const updated = await eventsApi.update(id, eventData, authOpts());
      setEvent(updated);
      eventsApi
        .listAll(authOpts())
        .then(setOrganizerEvents)
        .catch(() => {});
      return updated;
    },
    [event],
  );

  const value = useMemo(
    () => ({
      event,
      eventLoading,
      eventId: event?.id ?? null,
      createEvent,
      updateEvent,
      refreshEvent,
      // Organizer event selection + public slug resolution.
      organizerEvents,
      organizerEventsError,
      organizerEventsLoaded,
      selectedEventId,
      selectEvent,
      refreshOrganizerEvents,
      loadEventBySlug,
    }),
    [
      event,
      eventLoading,
      createEvent,
      updateEvent,
      refreshEvent,
      organizerEvents,
      organizerEventsError,
      organizerEventsLoaded,
      selectedEventId,
      selectEvent,
      refreshOrganizerEvents,
      loadEventBySlug,
    ],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};
