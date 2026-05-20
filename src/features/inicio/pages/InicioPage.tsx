import { useNavigate } from 'react-router-dom';
import s from './style.module.scss';

// ── Mock data ──────────────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Em sua posse',
    value: 109,
    delta: '+12 vs. semana anterior',
    up: true,
    iconColor: '#eff6ff',
    iconStroke: '#3b82f6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Caixa de entrada',
    value: 3,
    delta: '+3 vs. semana anterior',
    up: true,
    iconColor: '#fff7ed',
    iconStroke: '#f97316',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
      </svg>
    ),
  },
  {
    label: 'Aguardando assinatura',
    value: 7,
    delta: '-2 vs. semana anterior',
    up: false,
    iconColor: '#f0fdf4',
    iconStroke: '#22c55e',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    label: 'Tramitados (mês)',
    value: 234,
    delta: '+18% vs. semana anterior',
    up: true,
    iconColor: '#faf5ff',
    iconStroke: '#a855f7',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
];

type StatusKey = 'urgente' | 'pendente' | 'tramitacao';

interface ActivityItem {
  id: string;
  numero: string;
  sigla1: string;
  unidade1: string;
  status: StatusKey;
  titulo: string;
  tempo: string;
  de: string;
  para: string;
}

const ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    numero: '2017.49968',
    sigla1: 'SD',
    unidade1: 'SDRMA',
    status: 'urgente',
    titulo: 'EMPENHO — Material de expediente',
    tempo: 'há 4 min',
    de: 'DEPFIN',
    para: 'SEGOV',
  },
  {
    id: '2',
    numero: '2017.49955',
    sigla1: 'SD',
    unidade1: 'SDRMA',
    status: 'pendente',
    titulo: 'DIÁRIAS DE VIAGEM — Capacitação Recife',
    tempo: 'há 22 min',
    de: 'DEPFIN',
    para: 'SEGOV',
  },
  {
    id: '3',
    numero: '2017.49946',
    sigla1: 'SD',
    unidade1: 'SDRMA',
    status: 'tramitacao',
    titulo: 'DIÁRIAS DE VIAGEM — Reunião CIDES',
    tempo: 'há 1 h',
    de: 'DEPFIN',
    para: 'SEGOV',
  },
  {
    id: '4',
    numero: '2025.18243',
    sigla1: 'SE',
    unidade1: 'SEAD',
    status: 'tramitacao',
    titulo: 'ASSINATURA DE CONTRATO 0723/2025',
    tempo: 'há 3 h',
    de: 'CGM',
    para: 'SEGOV',
  },
];

type SignStatusKey = 'pendente';

interface SignItem {
  id: string;
  ref: string;
  desc: string;
  solicitante: string;
  status: SignStatusKey;
}

const SIGN_ITEMS: SignItem[] = [
  {
    id: '1',
    ref: 'Proc. Adm. 0007/2026',
    desc: 'Ata da Reunião do Conselho — 09/05',
    solicitante: 'Diretor de TI',
    status: 'pendente',
  },
  {
    id: '2',
    ref: 'Proc. Adm. 0006/2026',
    desc: 'Ofício 050/2026 — Resposta SEMURB',
    solicitante: 'Secretário SEAD',
    status: 'pendente',
  },
  {
    id: '3',
    ref: 'Of. 1257/2026',
    desc: 'Solicitação de Liberação Orçamentária',
    solicitante: 'SEFIN',
    status: 'pendente',
  },
];

const BAR_DATA = [
  { label: 'Em tramitação', value: 87, pct: 87, color: 'var(--info-500)' },
  { label: 'Pendente',       value: 52, pct: 52, color: 'var(--warning-500)' },
  { label: 'Concluído',      value: 71, pct: 71, color: 'var(--success-500)' },
  { label: 'Arquivado',      value: 24, pct: 24, color: 'var(--text-3)' },
];

const VOL_DATA = [
  { day: 'Seg', count: 28 },
  { day: 'Ter', count: 45 },
  { day: 'Qua', count: 37 },
  { day: 'Qui', count: 62 },
  { day: 'Sex', count: 41 },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusKey }) {
  if (status === 'urgente')    return <span className={`${s.badge} ${s.badgeUrgent}`}><Dot />Urgente</span>;
  if (status === 'pendente')   return <span className={`${s.badge} ${s.badgePending}`}><Dot />Pendente</span>;
  return <span className={`${s.badge} ${s.badgeInProgress}`}><Dot />Em tramitação</span>;
}

function Dot() {
  return <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />;
}

function ArrowUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export function InicioPage() {
  const navigate = useNavigate();
  const maxVol = Math.max(...VOL_DATA.map(d => d.count));

  return (
    <div className={s.page}>

      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h1>Bem-vindo, Grimalde 👋</h1>
          <p>
            Você tem <strong>3 documentos urgentes</strong> e <strong>7 assinaturas pendentes</strong>.
          </p>
        </div>
        <div className={s.headerActions}>
          <button className={s.btnSecondary} onClick={() => {}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Importar
          </button>
          <button className={s.btnPrimary} onClick={() => navigate('/documentos/novo')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo documento
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className={s.statsRow}>
        {STATS.map(stat => (
          <div key={stat.label} className={s.statCard}>
            <div className={s.statTop}>
              <span className={s.statLabel}>{stat.label}</span>
              <div
                className={s.statIcon}
                style={{ background: stat.iconColor, color: stat.iconStroke }}
              >
                {stat.icon}
              </div>
            </div>
            <div className={s.statValue}>{stat.value}</div>
            <div className={`${s.statDelta} ${stat.up ? s.deltaUp : s.deltaDown}`}>
              {stat.up ? <ArrowUp /> : <ArrowDown />}
              {stat.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Body: activity + signatures */}
      <div className={s.body}>

        {/* Atividade recente */}
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div>
              <p className={s.panelTitle}>Atividade recente</p>
              <p className={s.panelSub}>Documentos que chegaram à sua caixa</p>
            </div>
            <a href="/caixa" className={s.viewAll}>
              Ver tudo
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>
          <ul className={s.activityList}>
            {ACTIVITY.map(item => (
              <li key={item.id} className={s.activityItem} onClick={() => {}}>
                <div className={s.docIcon}>
                  <DocIcon />
                </div>
                <div className={s.activityMain}>
                  <div className={s.activityMeta}>
                    <span className={s.docNumber}>{item.numero}</span>
                    <span className={s.unitBadge}>{item.sigla1}</span>
                    <span className={s.unitBadge}>{item.unidade1}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className={s.activityTitle}>{item.titulo}</div>
                  <div className={s.activityFlow}>
                    <span>{item.de}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                    <span className={s.flowUnit}>{item.para}</span>
                  </div>
                </div>
                <span className={s.activityTime}>{item.tempo}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pendentes de assinatura */}
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <p className={s.panelTitle}>Pendentes de assinatura</p>
            <button className={s.signBtn}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Assinar em lote
            </button>
          </div>
          <ul className={s.signList}>
            {SIGN_ITEMS.map(item => (
              <li key={item.id} className={s.signItem}>
                <input type="checkbox" className={s.signCheck} defaultChecked />
                <div className={s.signBody}>
                  <div className={s.signDocRef}>
                    <DocIcon />
                    <span className={s.signDocNum}>{item.ref}</span>
                    <span className={`${s.badge} ${s.badgePending}`}>Pendente</span>
                  </div>
                  <p className={s.signDesc}>{item.desc}</p>
                  <p className={s.signRequester}>Solicitado por: {item.solicitante}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Charts row */}
      <div className={s.chartsRow}>

        {/* Tramitações por situação */}
        <div className={s.chartPanel}>
          <div className={s.chartHeader}>
            <span className={s.chartTitle}>Tramitações por situação</span>
            <button className={s.chartFilter}>Últimos 30 dias</button>
          </div>
          <div className={s.chartBody}>
            <div className={s.barChart}>
              {BAR_DATA.map(row => (
                <div key={row.label} className={s.barRow}>
                  <span className={s.barLabel}>{row.label}</span>
                  <div className={s.barTrack}>
                    <div
                      className={s.barFill}
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                  <span className={s.barValue}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Volume diário */}
        <div className={s.chartPanel}>
          <div className={s.chartHeader}>
            <span className={s.chartTitle}>Volume diário</span>
            <button className={s.chartFilter}>Esta semana</button>
          </div>
          <div className={s.chartBody}>
            <div className={s.volChart}>
              {VOL_DATA.map(d => (
                <div key={d.day} className={s.volBar}>
                  <span className={s.volCount}>{d.count}</span>
                  <div
                    className={s.volFill}
                    style={{ height: `${(d.count / maxVol) * 80}px` }}
                  />
                  <span className={s.volDay}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
