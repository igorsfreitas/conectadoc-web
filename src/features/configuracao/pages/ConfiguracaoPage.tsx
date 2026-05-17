import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { afinzAppPaths } from '../../../infra/router/paths/afinz_app';

// ── Inline SVG icons ──────────────────────────────────────────────────────
function Icon({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}
const IconDownload = (p: { size?: number }) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>;
const IconRefresh  = (p: { size?: number }) => <Icon {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></Icon>;
const IconSearch   = (p: { size?: number }) => <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>;

// ── Card type ─────────────────────────────────────────────────────────────
interface ConfigCard {
  icon: string;
  title: string;
  subtitle: string;
  route?: string;
}

interface ConfigSection {
  label: string;
  cards: ConfigCard[];
}

const SECTIONS: ConfigSection[] = [
  {
    label: 'SEGURANÇA & ACESSO',
    cards: [
      { icon: '🔒', title: 'Acessos & Permissões',     subtitle: 'Perfis, papéis e permissões',  route: afinzAppPaths.usuarios.asRoute },
      { icon: '✍️', title: 'Capt. de Assinatura',      subtitle: 'Capturar assinatura manuscrita' },
      { icon: '🛡️', title: 'Certificado Empresarial',  subtitle: 'A1/A3 institucional' },
      { icon: '📟', title: 'Dispositivos Assinadores',  subtitle: 'Tokens e leitoras' },
    ],
  },
  {
    label: 'ESTRUTURA ORGANIZACIONAL',
    cards: [
      { icon: '📁', title: 'Arquivologia',   subtitle: 'Tabela de temporalidade', route: afinzAppPaths.hierarquia.asRoute },
      { icon: '🔗', title: 'Conexões',       subtitle: 'Integrações entre órgãos' },
      { icon: '🏛️', title: 'Estados Públicos', subtitle: 'Cadastro de entes' },
      { icon: '⚡', title: 'Integrações',    subtitle: 'APIs e webhooks' },
    ],
  },
  {
    label: 'DOCUMENTOS & MODELOS',
    cards: [
      { icon: '📄', title: 'Tipos de Documentos', subtitle: '92 tipos cadastrados', route: afinzAppPaths.tipoDocumento.asRoute },
      { icon: '📖', title: 'Modelos OpenOffice',   subtitle: 'Templates ODT' },
      { icon: '🔍', title: 'Indexação',             subtitle: 'Campos de busca' },
      { icon: '✏️', title: 'Numeração',             subtitle: 'Sequências automáticas' },
    ],
  },
  {
    label: 'RELATÓRIOS & INDICADORES',
    cards: [
      { icon: '📊', title: 'Relatórios PDF/XLS',     subtitle: 'Gerar e agendar' },
      { icon: '📈', title: 'Gráficos & Dashboards',  subtitle: 'Personalizar painel' },
      { icon: '🔔', title: 'Informativos',            subtitle: 'Comunicados aos servidores' },
      { icon: '✈️', title: 'Tramitação',             subtitle: 'Regras e SLAs' },
    ],
  },
];

export function ConfiguracaoPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = SECTIONS.map(section => ({
    ...section,
    cards: section.cards.filter(card =>
      search === '' ||
      card.title.toLowerCase().includes(search.toLowerCase()) ||
      card.subtitle.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(section => section.cards.length > 0);

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 24,
      }}>
        <div>
          <h1 className="page-title">Configuração</h1>
          <p className="page-subtitle">Personalize o sistema para seu órgão</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary">
            <IconDownload size={14} />
            Backup
          </button>
          <button className="btn btn-secondary">
            <IconRefresh size={14} />
            Restaurar padrões
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 32, maxWidth: 400 }}>
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
          <IconSearch size={15} />
        </span>
        <input
          className="input"
          style={{ paddingLeft: 34 }}
          placeholder="Buscar configuração..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        {filtered.map(section => (
          <div key={section.label}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              marginBottom: 14,
            }}>
              {section.label}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
            }}>
              {section.cards.map(card => (
                <ConfigCard key={card.title} card={card} navigate={navigate} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigCard({ card, navigate }: { card: ConfigCard; navigate: ReturnType<typeof useNavigate> }) {
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    if (card.route) navigate(card.route);
  }

  return (
    <div
      role={card.route ? 'button' : undefined}
      tabIndex={card.route ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 20px',
        cursor: card.route ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.15s',
        boxShadow: hovered && card.route ? 'var(--shadow)' : 'var(--shadow-xs)',
        borderColor: hovered && card.route ? 'var(--border-strong)' : 'var(--border)',
        transform: hovered && card.route ? 'translateY(-1px)' : 'none',
        outline: 'none',
      }}
    >
      {/* Icon box */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'var(--brand-50)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 20,
        flexShrink: 0,
      }}>
        {card.icon}
      </div>

      {/* Text */}
      <div>
        <div style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 3,
        }}>
          {card.title}
        </div>
        <div style={{
          fontSize: 12.5,
          color: 'var(--text-3)',
          lineHeight: 1.4,
        }}>
          {card.subtitle}
        </div>
      </div>
    </div>
  );
}
