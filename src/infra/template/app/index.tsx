import React, { useContext } from "react";
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

const IconHome       = (p: { size?: number }) => <Icon {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Icon>;
const IconInbox      = (p: { size?: number }) => <Icon {...p}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></Icon>;
const IconPen        = (p: { size?: number }) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Icon>;
const IconDocument   = (p: { size?: number }) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></Icon>;
const IconPlus       = (p: { size?: number }) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
const IconSearch     = (p: { size?: number }) => <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;
const IconCreditCard = (p: { size?: number }) => <Icon {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></Icon>;
const IconUsers      = (p: { size?: number }) => <Icon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const IconSettings   = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>;
const IconBarChart   = (p: { size?: number }) => <Icon {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></Icon>;
const IconLogout     = (p: { size?: number }) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Icon>;
const IconChevD      = (p: { size?: number }) => <Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>;
const IconBell       = (p: { size?: number }) => <Icon {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Icon>;
const IconMessage    = (p: { size?: number }) => <Icon {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>;
const IconHelp       = (p: { size?: number }) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></Icon>;
const IconTag        = (p: { size?: number }) => <Icon {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Icon>;
const IconBuilding   = (p: { size?: number }) => <Icon {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></Icon>;
const IconLayers     = (p: { size?: number }) => <Icon {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>;
const IconShield     = (p: { size?: number }) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>;
const IconUserCheck  = (p: { size?: number }) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></Icon>;
const IconBook       = (p: { size?: number }) => <Icon {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Icon>;
const IconNetwork    = (p: { size?: number }) => <Icon {...p}><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="15" width="6" height="5" rx="1"/><rect x="16" y="15" width="6" height="5" rx="1"/><path d="M12 7v4M8 17.5H5.5V11M18.5 17.5H16V11"/><line x1="12" y1="11" x2="12" y2="15"/></Icon>;

// ── Nav definitions ───────────────────────────────────────────────────────
const NAV_TRABALHO = [
  { path: afinzAppPaths.inicio.asRoute!,          label: 'Início',            Icon: IconHome     },
  { path: afinzAppPaths.caixaEntrada.asRoute!,    label: 'Caixa de Entrada',  Icon: IconInbox    },
  { path: afinzAppPaths.assinaturas.asRoute!,     label: 'Assinaturas',       Icon: IconPen      },
  { path: afinzAppPaths.documentos.asRoute!,      label: 'Documentos',        Icon: IconDocument },
  { path: afinzAppPaths.novoDocumento.asRoute!,   label: 'Novo documento',    Icon: IconPlus     },
  { path: afinzAppPaths.pesquisaAvancada.asRoute!,label: 'Pesquisa avançada', Icon: IconSearch   },
];

const NAV_GESTAO = [
  { path: afinzAppPaths.cracha.asRoute!,               label: 'Crachá',                 Icon: IconCreditCard },
  { path: afinzAppPaths.administracao.asRoute!,        label: 'Administração',          Icon: IconUsers      },
  { path: afinzAppPaths.configuracao.asRoute!,         label: 'Configuração',           Icon: IconSettings   },
  { path: afinzAppPaths.relatoriosIndicadores.asRoute!,label: 'Relatórios & Indicadores',Icon: IconBarChart  },
];

// ── Collapsible nav section ───────────────────────────────────────────────
function NavSection({
  label,
  items,
  defaultOpen = true,
}: {
  label: string;
  items: { path: string; label: string; Icon: (p: { size?: number }) => JSX.Element }[];
  defaultOpen?: boolean;
}) {
  const location = useLocation();
  const isAnyActive = items.some(i => location.pathname.startsWith(i.path));
  const [open, setOpen] = React.useState(defaultOpen || isAnyActive);

  return (
    <>
      <button
        className="sidebar-section-btn"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '8px 16px 4px',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
          color: 'var(--text-3)',
        }}
      >
        {label}
        <span style={{ transition: 'transform 0.15s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'flex' }}>
          <IconChevD size={13} />
        </span>
      </button>
      {open && items.map(({ path, label: itemLabel, Icon: NavIcon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <NavIcon size={17} />
          <span>{itemLabel}</span>
        </NavLink>
      ))}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, setProfile } = useContext(ProfileContext);
  const authService = useInject("AuthService");

  const initials = (name: string) =>
    name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const userName     = profile?.usuario?.nome ?? 'Usuário';
  const userInitials = initials(userName);
  const userCpf      = profile?.usuario?.cpf ? formatCpf(profile.usuario.cpf) : '';

  async function handleLogout() {
    try { await authService.logout(); } catch { /* ignore */ }
    setProfile(undefined);
    navigate(afinzAppPaths.login.path!);
  }

  return (
    <div className="app">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <img src="/favicon.ico" alt="ConectaDoc" className="brand-favicon" />
          <div className="brand-text">CONECTA<span>DOC</span></div>
        </div>

        {/* Tenant switcher */}
        <div className="sidebar-tenant">
          <div className="tenant-avatar">{userInitials}</div>
          <div className="tenant-info">
            <div className="tenant-name">Prefeitura Municipal</div>
            <div className="tenant-role">SEGOV · Gabinete</div>
          </div>
          <IconChevD size={14} />
        </div>

        <nav className="nav">
          <NavSection label="Trabalho"  items={NAV_TRABALHO}   defaultOpen={true}  />
          <NavSection label="Gestão"    items={NAV_GESTAO}     defaultOpen={true}  />
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-avatar">{userInitials}</div>
          <div className="user-meta">
            <div className="user-name">{userName}</div>
            {userCpf && <div className="user-id">CPF {userCpf}</div>}
          </div>
          <button className="icon-btn" title="Sair" onClick={handleLogout}>
            <IconLogout size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className="main">
        <div className="topbar">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span>Início</span>
            {getBreadcrumb(location.pathname) && (
              <>
                <span className="breadcrumb-sep">&rsaquo;</span>
                <b>{getBreadcrumb(location.pathname)}</b>
              </>
            )}
          </div>

          {/* Center search */}
          <div style={{ flex: 1, maxWidth: 480, margin: '0 auto', position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}>
              <IconSearch size={14} />
            </span>
            <input
              className="input"
              style={{ paddingLeft: 32, paddingRight: 52, height: 36, fontSize: 13 }}
              placeholder="Buscar por NetDoc, processo, assunto, pessoa…"
              readOnly
            />
            <kbd style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              fontFamily: 'inherit',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              padding: '1px 6px',
              color: 'var(--text-3)',
              lineHeight: 1.8,
            }}>
              ⌘K
            </kbd>
          </div>

          {/* Right actions */}
          <div className="topbar-actions">
            <button className="icon-btn" title="Notificações"><IconBell size={16} /></button>
            <button className="icon-btn" title="Mensagens"><IconMessage size={16} /></button>
            <button className="icon-btn" title="Ajuda"><IconHelp size={16} /></button>
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
  if (pathname.startsWith('/inicio'))               return '';
  if (pathname.startsWith('/documentos'))           return 'Documentos';
  if (pathname.startsWith('/assinaturas'))          return 'Assinaturas';
  if (pathname.startsWith('/pesquisa-avancada'))    return 'Pesquisa Avançada';
  if (pathname.startsWith('/caixa'))                return 'Caixa de Entrada';
  if (pathname.startsWith('/assuntos'))             return 'Assuntos';
  if (pathname.startsWith('/hierarquia'))           return 'Hierarquia';
  if (pathname.startsWith('/tipo-entidade-externa'))return 'Tipo de Entidade Externa';
  if (pathname.startsWith('/entidade-externa'))     return 'Entidades Externas';
  if (pathname.startsWith('/unidade-administrativa'))return 'Unidades Administrativas';
  if (pathname.startsWith('/tipo-documento'))       return 'Tipos de Documento';
  if (pathname.startsWith('/caso-uso'))             return 'Casos de Uso';
  if (pathname.startsWith('/perfis'))               return 'Perfis';
  if (pathname.startsWith('/usuarios'))             return 'Usuários';
  if (pathname.startsWith('/cracha'))               return 'Crachá';
  if (pathname.startsWith('/administracao'))        return 'Administração';
  if (pathname.startsWith('/configuracao'))         return 'Configuração';
  if (pathname.startsWith('/relatorios'))           return 'Relatórios & Indicadores';
  return '';
}
