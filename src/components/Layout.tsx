import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useUser, useAuth } from '../auth/AuthContext';
import { canResetData } from '../auth/permissions';
import { useWorkforce } from '../state/WorkforceContext';

const NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/operatives', label: 'Operatives' },
  { to: '/matrix', label: 'Training matrix' },
  { to: '/medical', label: 'Medicals' },
  { to: '/holidays', label: 'Holidays' },
  { to: '/audit', label: 'Audit log' },
];

export function Layout() {
  const user = useUser();
  const { signOut } = useAuth();
  const { resetDemo } = useWorkforce();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          SiteReady
        </div>
        <button
          className="topbar__menu"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          Menu
        </button>
        <div className="topbar__user">
          <span>
            {user.displayName}
            <small>{user.role === 'manager' ? 'Site manager, 2 projects' : user.role === 'guest' ? 'Read-only' : 'Administrator'}</small>
          </span>
          {canResetData(user) && (
            <button className="btn btn--quiet" onClick={() => void resetDemo()}>
              Reset demo data
            </button>
          )}
          <button className="btn btn--quiet" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <nav id="primary-nav" className={`sidenav${menuOpen ? ' sidenav--open' : ''}`} aria-label="Main">
        <ul>
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} onClick={() => setMenuOpen(false)}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="sidenav__note">Portfolio demo. All people and companies are fictional.</p>
      </nav>
      <main id="main" className="content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
