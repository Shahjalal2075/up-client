import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, CalendarDays } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { MENU, ROLE_LABEL, ADMIN_BASE } from '../config/menu';
import { useBranding } from '../useBranding';
import Logo from './Logo';

export const todayBn = () =>
  new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

export default function Layout() {
  const { user, logout } = useAuth();
  const unionName = useBranding();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const items = MENU.filter((m) => m.roles.includes(user.role));
  const path = pathname.replace(/\/$/, '');
  const isHome = path === ADMIN_BASE;
  const current = items.find((m) => (m.path === ADMIN_BASE ? isHome : path.startsWith(m.path)));

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand">
          <Logo size={44} badge />
          <strong>{unionName}</strong>
        </div>

        <nav className="nav" aria-label="প্রধান মেনু">
          {items.map(({ key, path: itemPath, label, icon: Icon }) => (
            <NavLink key={key} to={itemPath} end={itemPath === ADMIN_BASE} className="nav-link">
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          <LogOut size={18} /> লগআউট
        </button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen((v) => !v)} aria-label="মেনু">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="topbar-title">
            <h1>{isHome ? <>স্বাগতম, {user.fullName || user.username}</> : current?.label}</h1>
            <span className="role-tag">{ROLE_LABEL[user.role]}</span>
          </div>
          <span className="date-pill">
            <CalendarDays size={15} /> {todayBn()}
          </span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
