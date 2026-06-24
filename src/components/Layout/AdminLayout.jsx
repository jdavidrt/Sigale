/*
 * AdminLayout — the shared chrome for every organizer (admin) page.
 *
 * Renders the Astromelias dark Screen, a top bar with the event title and the
 * slide-out OrganizerMenu (the menu shown on /admin, the canonical look).
 * Every page under the /admin/* tree wraps its content in this layout so the
 * menu, background, and topbar are identical across the organizer surface.
 *
 *   <AdminLayout title="Editar evento">
 *     <YourPageContent />
 *   </AdminLayout>
 *
 * The logout handler is passed in by the route so AdminLayout doesn't need to
 * own the auth toggle. If you don't pass `onLogout`, the layout falls back to
 * the OrganizerMenu's default (which still calls api/admin.logout()).
 */
import { useEvent } from '../../context/EventContext';
import { Screen } from '../ui/Screen';
import { OrganizerMenu } from './OrganizerMenu';
import { StorageErrorBanner } from '../Common/StorageErrorBanner';
import { logout as apiLogout } from '../../api/admin';
import { useNavigate } from 'react-router-dom';

export function AdminLayout({ title, subtitle, children, onLogout }) {
  const { event } = useEvent();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) return onLogout();
    apiLogout();
    navigate('/admin');
  };

  const headerTitle = title || 'Panel';
  const headerSubtitle = subtitle ?? event?.name ?? '';

  return (
    <Screen seed={11}>
      <StorageErrorBanner />
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--black)' }}>
        <div>
          <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>{headerTitle}</div>
          {headerSubtitle && <div className="muted" style={{ fontSize: 12 }}>{headerSubtitle}</div>}
        </div>
        <OrganizerMenu onLogout={handleLogout} />
      </div>
      <div className="scr-body pad" style={{ zIndex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {children}
      </div>
    </Screen>
  );
}

export default AdminLayout;
