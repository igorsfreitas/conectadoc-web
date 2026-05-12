import { Outlet, NavLink, useLocation } from "react-router-dom";
import { afinzAppPaths } from "../../router/paths/afinz_app";

// ── Inline SVG icons (Lucide-style) ───────────────────────────────────────
function Icon({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
const IconFolder    = (p: { size?: number }) => <Icon {...p}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></Icon>;
const IconSettings  = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>;
const IconLogout    = (p: { size?: number }) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>;
const IconChevD     = (p: { size?: number }) => <Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>;
const IconMore      = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></Icon>;

// ── Nav definition ────────────────────────────────────────────────────────
const NAV_TRABALHO = [
  { path: afinzAppPaths.assuntos.asRoute!, label: 'Assuntos',     Icon: IconFolder   },
];
const NAV_GESTAO = [
  { path: afinzAppPaths.hierarquia.asRoute!, label: 'Configuração', Icon: IconSettings },
];

export function AppLayout() {
  const location = useLocation();

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const tenantName  = 'Prefeitura Municipal';
  const tenantRole  = 'SEGOV · Gabinete';
  const tenantInitials = 'PM';
  const userName    = 'Usuário';
  const userInitials = initials(userName);

  return (
    <div className="app">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">C</div>
          <div className="brand-text">conecta<span>doc</span></div>
        </div>

        <div className="sidebar-tenant">
          <div className="tenant-avatar">{tenantInitials}</div>
          <div className="tenant-info">
            <div className="tenant-name">{tenantName}</div>
            <div className="tenant-role">{tenantRole}</div>
          </div>
          <IconChevD size={14} />
        </div>

        <div className="sidebar-section">Trabalho</div>
        <nav className="nav">
          {NAV_TRABALHO.map(({ path, label, Icon: NavIcon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <NavIcon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="sidebar-section">Gestão</div>
          {NAV_GESTAO.map(({ path, label, Icon: NavIcon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <NavIcon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">{userInitials}</div>
          <div className="user-meta">
            <div className="user-name">{userName}</div>
            <div className="user-id">ConectaDoc</div>
          </div>
          <button className="icon-btn" title="Sair">
            <IconLogout size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className="main">
        <div className="topbar">
          <div className="breadcrumb">
            <span>ConectaDoc</span>
            <span className="breadcrumb-sep">/</span>
            <b>{getBreadcrumb(location.pathname)}</b>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn"><IconMore size={16} /></button>
          </div>
        </div>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function getBreadcrumb(pathname: string): string {
  if (pathname.startsWith('/assuntos'))   return 'Assuntos';
  if (pathname.startsWith('/hierarquia')) return 'Configuração';
  return '';
}
