import { useContext } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ProfileContext } from "../../contexts/profile";
import { useInject } from "../../hooks/inject";
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

const IconInbox = (p: { size?: number }) => <Icon {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></Icon>;

// ── Nav definition ────────────────────────────────────────────────────────
const NAV_TRABALHO = [
  { path: afinzAppPaths.caixaEntrada.asRoute!, label: 'Caixa de Entrada', Icon: IconInbox   },
  { path: afinzAppPaths.assuntos.asRoute!,     label: 'Assuntos',         Icon: IconFolder  },
];
const IconUsers = (p: { size?: number }) => <Icon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;

const IconBuilding = (p: { size?: number }) => <Icon {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/><path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/></Icon>;

const IconDocument = (p: { size?: number }) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Icon>;
const IconKey      = (p: { size?: number }) => <Icon {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></Icon>;

const NAV_GESTAO = [
  { path: afinzAppPaths.hierarquia.asRoute!,          label: 'Hierarquia',           Icon: IconSettings  },
  { path: afinzAppPaths.tipoEntidadeExterna.asRoute!, label: 'Tipo Entidade Externa', Icon: IconUsers     },
  { path: afinzAppPaths.entidadeExterna.asRoute!,         label: 'Entidades Externas',      Icon: IconBuilding  },
  { path: afinzAppPaths.unidadeAdministrativa.asRoute!,   label: 'Unid. Administrativas',   Icon: IconFolder    },
  { path: afinzAppPaths.tipoDocumento.asRoute!,           label: 'Tipos de Documento',       Icon: IconDocument  },
  { path: afinzAppPaths.casoUso.asRoute!,                label: 'Casos de Uso',             Icon: IconKey       },
  { path: afinzAppPaths.perfis.asRoute!,                 label: 'Perfis',                   Icon: IconUsers     },
  { path: afinzAppPaths.usuarios.asRoute!,               label: 'Usuários',                 Icon: IconUsers     },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, setProfile } = useContext(ProfileContext);
  const authService = useInject("AuthService");

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const userName     = profile?.usuario?.nome ?? 'Usuário';
  const userInitials = initials(userName);
  const tenantName     = 'ConectaDoc';
  const tenantRole     = '';
  const tenantInitials = 'CD';

  async function handleLogout() {
    try { await authService.logout(); } catch { /* ignore */ }
    setProfile(undefined);
    navigate(afinzAppPaths.login.path!);
  }

  return (
    <div className="app">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/favicon.ico" alt="ConectaDoc" className="brand-favicon" />
          <div className="brand-text">CONECTA<span>DOC</span></div>
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
          <button className="icon-btn" title="Sair" onClick={handleLogout}>
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
  if (pathname.startsWith('/documentos/novo'))      return 'Novo Documento';
  if (pathname.startsWith('/caixa'))                return 'Caixa de Entrada';
  if (pathname.startsWith('/assuntos'))              return 'Assuntos';
  if (pathname.startsWith('/hierarquia'))            return 'Hierarquia';
  if (pathname.startsWith('/tipo-entidade-externa')) return 'Tipo de Entidade Externa';
  if (pathname.startsWith('/entidade-externa'))           return 'Entidades Externas';
  if (pathname.startsWith('/unidade-administrativa'))     return 'Unidades Administrativas';
  if (pathname.startsWith('/tipo-documento'))            return 'Tipos de Documento';
  if (pathname.startsWith('/caso-uso'))                  return 'Casos de Uso';
  if (pathname.startsWith('/perfis'))                    return 'Perfis';
  if (pathname.startsWith('/usuarios'))                  return 'Usuários';
  return '';
}
