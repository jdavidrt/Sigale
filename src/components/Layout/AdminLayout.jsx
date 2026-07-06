/*
 * AdminLayout — the shared chrome for every organizer (admin) page.
 *
 * Renders the Astromelias dark Screen, a top bar with the "Sígale /
 * Administración" brand mark (links home to /admin) and the slide-out
 * OrganizerMenu. Every page under the /admin/* tree wraps its content in
 * this layout so the menu, background, and topbar are identical across the
 * organizer surface.
 *
 *   <AdminLayout>
 *     <YourPageContent />
 *   </AdminLayout>
 *
 * The logout handler is passed in by the route so AdminLayout doesn't need to
 * own the auth toggle. If you don't pass `onLogout`, the layout falls back to
 * the OrganizerMenu's default (which still calls api/admin.logout()).
 */
import { Screen } from '../ui/Screen';
import { OrganizerMenu } from './OrganizerMenu';
import { StorageErrorBanner } from '../Common/StorageErrorBanner';
import { logout as apiLogout } from '../../api/admin';
import { Link, useNavigate } from 'react-router-dom';

export function AdminLayout({ children, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) return onLogout();
    apiLogout();
    navigate('/admin');
  };

  return (
    <Screen seed={11}>
      <StorageErrorBanner />
      <div className="topbar" style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--black)' }}>
        <Link to="/admin" style={{ textDecoration: 'none' }}>
          <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>Sígale</div>
          <div className="muted" style={{ fontSize: 12 }}>Administración</div>
        </Link>
        <OrganizerMenu onLogout={handleLogout} />
      </div>
      <div className="scr-body pad" style={{ zIndex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {children}
      </div>
    </Screen>
  );
}

export default AdminLayout;
