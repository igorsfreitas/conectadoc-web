import { useNavigate } from "react-router-dom";
import { afinzAppPaths } from "../../../infra/router/paths/afinz_app";

// ── Inline SVG icons ───────────────────────────────────────────────────────
function Icon({ children, size = 22 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const IconNetwork    = () => <Icon><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="15" width="6" height="5" rx="1"/><rect x="16" y="15" width="6" height="5" rx="1"/><path d="M12 7v4M8 17.5H5.5V11M18.5 17.5H16V11"/><line x1="12" y1="11" x2="12" y2="15"/></Icon>;
const IconBook       = () => <Icon><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></Icon>;
const IconLayers     = () => <Icon><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Icon>;
const IconTag        = () => <Icon><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Icon>;
const IconBuilding   = () => <Icon><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></Icon>;
const IconMessage    = () => <Icon><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>;
const IconShield     = () => <Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>;
const IconUserCheck  = () => <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></Icon>;

// ── Cadastro groups ────────────────────────────────────────────────────────
const GROUPS: {
  title: string;
  items: { label: string; desc: string; path: string; Icon: () => React.ReactElement; color: string }[];
}[] = [
  {
    title: "Estrutura organizacional",
    items: [
      { label: "Hierarquia",               desc: "Hierarquia de arquivologia",     path: afinzAppPaths.hierarquia.asRoute!,           Icon: IconNetwork,   color: "oklch(0.65 0.16 250)" },
      { label: "Unidades Administrativas", desc: "Unidades e setores do órgão",     path: afinzAppPaths.unidadeAdministrativa.asRoute!, Icon: IconBuilding, color: "oklch(0.65 0.14 200)" },
    ],
  },
  {
    title: "Documentos",
    items: [
      { label: "Assuntos",                 desc: "Catálogo de assuntos",            path: afinzAppPaths.assuntos.asRoute!,             Icon: IconBook,      color: "oklch(0.65 0.16 290)" },
      { label: "Tipos de Documento",       desc: "Modelos e atributos por tipo",    path: afinzAppPaths.tipoDocumento.asRoute!,        Icon: IconLayers,    color: "oklch(0.65 0.16 330)" },
    ],
  },
  {
    title: "Entidades externas",
    items: [
      { label: "Tipos de Entidade",        desc: "Categorias de entidades externas", path: afinzAppPaths.tipoEntidadeExterna.asRoute!, Icon: IconTag,      color: "oklch(0.65 0.14 30)" },
      { label: "Entidades Externas",       desc: "Cadastro de entidades parceiras",  path: afinzAppPaths.entidadeExterna.asRoute!,     Icon: IconBuilding, color: "oklch(0.65 0.14 60)" },
    ],
  },
  {
    title: "Acesso e permissões",
    items: [
      { label: "Casos de Uso",             desc: "Permissões granulares do sistema", path: afinzAppPaths.casoUso.asRoute!,             Icon: IconMessage,  color: "oklch(0.62 0.14 150)" },
      { label: "Perfis",                   desc: "Grupos de permissões",             path: afinzAppPaths.perfis.asRoute!,              Icon: IconShield,   color: "oklch(0.62 0.14 175)" },
      { label: "Usuários",                 desc: "Cadastro de usuários do sistema",  path: afinzAppPaths.usuarios.asRoute!,            Icon: IconUserCheck, color: "oklch(0.62 0.14 130)" },
    ],
  },
];

export function AdministracaoPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text, #111)", margin: 0 }}>Administração</h1>
        <p style={{ fontSize: 13, color: "var(--text-3, #6b7280)", margin: "4px 0 0" }}>
          Gerencie os cadastros e configurações do sistema
        </p>
      </div>

      {GROUPS.map(group => (
        <section key={group.title} style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "var(--text-3, #9ca3af)",
            margin: "0 0 12px",
          }}>
            {group.title}
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
          }}>
            {group.items.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px",
                  background: "#fff",
                  border: "1px solid var(--border, #e5e7eb)",
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color .15s, box-shadow .15s, transform .15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(15, 23, 42, 0.06)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--border, #e5e7eb)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, borderRadius: 10,
                  background: `color-mix(in oklch, ${item.color} 12%, white)`,
                  color: item.color,
                  flexShrink: 0,
                }}>
                  <item.Icon />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text, #111)", marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: 12, color: "var(--text-3, #6b7280)", lineHeight: 1.35,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {item.desc}
                  </div>
                </div>
                <span style={{ color: "var(--text-3, #9ca3af)", fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
