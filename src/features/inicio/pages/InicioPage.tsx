import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInject } from '../../../infra/hooks/inject';
import {
  DashboardData,
  DashboardAtividade,
  DashboardPendenteAssinatura,
} from '../../documentos/models/documento.model';
import s from './style.module.scss';

// ── Helpers ────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return 'agora';
  if (mins < 60)  return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `há ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `há ${days} d`;
}

type StatusKey = 'urgente' | 'pendente' | 'tramitacao';

function itemStatus(item: DashboardAtividade): StatusKey {
  if (item.flagPendencia === 1) return 'pendente';
  return 'tramitacao';
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusKey }) {
  if (status === 'urgente')  return <span className={`${s.badge} ${s.badgeUrgent}`}><Dot />Urgente</span>;
  if (status === 'pendente') return <span className={`${s.badge} ${s.badgePending}`}><Dot />Pendente</span>;
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

function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function Skeleton({ w = '100%', h = 16, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const STAT_ICONS = [
  {
    label: 'Em sua posse',
    iconColor: '#eff6ff', iconStroke: '#3b82f6',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    label: 'Caixa de entrada',
    iconColor: '#fff7ed', iconStroke: '#f97316',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
      </svg>
    ),
  },
  {
    label: 'Aguardando assinatura',
    iconColor: '#f0fdf4', iconStroke: '#22c55e',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    label: 'Tramitados (mês)',
    iconColor: '#faf5ff', iconStroke: '#a855f7',
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

export function InicioPage() {
  const navigate      = useNavigate();
  const docService    = useInject('DocumentosService');

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    docService
      .getDashboard()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Não foi possível carregar os dados.'); setLoading(false); });
  }, []);

  const counts = data?.counts;
  const statValues = [
    counts?.posse              ?? 0,
    counts?.entrada            ?? 0,
    counts?.aguardandoAssinatura ?? 0,
    counts?.tramitadosMes      ?? 0,
  ];

  const maxVol = data
    ? Math.max(...data.volumeDiario.map(d => d.count), 1)
    : 1;

  const maxSit = data
    ? Math.max(...data.tramitacoesPorSituacao.map(r => r.value), 1)
    : 1;

  const nomeUsuario = data?.nomeUsuario
    ? data.nomeUsuario.split(' ')[0]   // first name only
    : 'usuário';

  const urgentes  = counts?.entrada ?? 0;
  const pendentes = counts?.aguardandoAssinatura ?? 0;

  return (
    <div className={s.page}>
      {/* shimmer keyframe */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <h1>Bem-vindo, {nomeUsuario} 👋</h1>
          <p>
            {loading ? (
              <Skeleton w={300} h={14} />
            ) : (
              <>
                Você tem{' '}
                <strong>{urgentes} documento{urgentes !== 1 ? 's' : ''} na entrada</strong>
                {pendentes > 0 && (
                  <> e <strong>{pendentes} assinatura{pendentes !== 1 ? 's' : ''} pendente{pendentes !== 1 ? 's' : ''}</strong></>
                )}.
              </>
            )}
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

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className={s.statsRow}>
        {STAT_ICONS.map((stat, i) => (
          <div key={stat.label} className={s.statCard}>
            <div className={s.statTop}>
              <span className={s.statLabel}>{stat.label}</span>
              <div className={s.statIcon} style={{ background: stat.iconColor, color: stat.iconStroke }}>
                {stat.icon}
              </div>
            </div>
            {loading ? (
              <Skeleton w={60} h={30} r={6} />
            ) : (
              <div className={s.statValue}>{statValues[i]}</div>
            )}
            <div className={`${s.statDelta} ${s.deltaUp}`}>
              <ArrowUp />
              {loading ? <Skeleton w={120} h={12} /> : <span>vs. mês anterior</span>}
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
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className={s.activityItem} style={{ gap: 12, pointerEvents: 'none' }}>
                    <Skeleton w={34} h={34} r={8} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton w="60%" h={12} />
                      <Skeleton w="85%" h={13} />
                      <Skeleton w="40%" h={11} />
                    </div>
                  </li>
                ))
              : data?.atividades.length === 0
              ? (
                  <li style={{ padding: '24px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                    Nenhuma atividade recente
                  </li>
                )
              : data?.atividades.map((item: DashboardAtividade) => (
                  <li
                    key={`${item.tramitacaoCodigo}-${item.documentoCodigo}`}
                    className={s.activityItem}
                    onClick={() => navigate(`/documentos/${item.documentoCodigo}`)}
                  >
                    <div className={s.docIcon}><DocIcon /></div>
                    <div className={s.activityMain}>
                      <div className={s.activityMeta}>
                        <span className={s.docNumber}>{item.numeroNetdoc ?? item.numero ?? `#${item.documentoCodigo}`}</span>
                        {item.tipoDocumentoSigla && <span className={s.unitBadge}>{item.tipoDocumentoSigla}</span>}
                        <StatusBadge status={itemStatus(item)} />
                      </div>
                      <div className={s.activityTitle}>
                        {item.resumo ?? item.tipoDocumentoNome ?? 'Documento'}
                      </div>
                      <div className={s.activityFlow}>
                        <span>{item.origemSigla ?? '—'}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                        <span className={s.flowUnit}>{item.destinoSigla ?? '—'}</span>
                      </div>
                    </div>
                    <span className={s.activityTime}>{relativeTime(item.dataEnvio)}</span>
                  </li>
                ))
            }
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
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className={s.signItem} style={{ pointerEvents: 'none' }}>
                    <Skeleton w={16} h={16} r={3} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Skeleton w="70%" h={12} />
                      <Skeleton w="90%" h={12} />
                      <Skeleton w="50%" h={11} />
                    </div>
                  </li>
                ))
              : data?.pendentesAssinatura.length === 0
              ? (
                  <li style={{ padding: '24px 20px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                    Nenhuma assinatura pendente
                  </li>
                )
              : data?.pendentesAssinatura.map((item: DashboardPendenteAssinatura) => (
                  <li key={item.codigo} className={s.signItem}>
                    <input type="checkbox" className={s.signCheck} defaultChecked />
                    <div className={s.signBody}>
                      <div className={s.signDocRef}>
                        <DocIcon />
                        <span className={s.signDocNum}>
                          {item.numeroNetdoc ?? `Doc #${item.documentoCodigo}`}
                        </span>
                        <span className={`${s.badge} ${s.badgePending}`}>Pendente</span>
                      </div>
                      <p className={s.signDesc}>{item.resumo ?? item.tipoDocumentoNome ?? 'Documento'}</p>
                      <p className={s.signRequester}>
                        {item.modalidade === 'MANUSCRITA' ? 'Assinatura manuscrita' : 'Assinatura eletrônica'}
                        {item.dataAssinatura && ` — ${new Date(item.dataAssinatura).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </li>
                ))
            }
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
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} h={8} />)}
              </div>
            ) : (
              <div className={s.barChart}>
                {(data?.tramitacoesPorSituacao ?? []).map(row => (
                  <div key={row.label} className={s.barRow}>
                    <span className={s.barLabel}>{row.label}</span>
                    <div className={s.barTrack}>
                      <div
                        className={s.barFill}
                        style={{
                          width: `${Math.round((row.value / maxSit) * 100)}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                    <span className={s.barValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Volume diário */}
        <div className={s.chartPanel}>
          <div className={s.chartHeader}>
            <span className={s.chartTitle}>Volume diário</span>
            <button className={s.chartFilter}>Esta semana</button>
          </div>
          <div className={s.chartBody}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <Skeleton w="100%" h={40 + i * 10} r={4} />
                    <Skeleton w={24} h={11} r={3} />
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.volChart}>
                {(data?.volumeDiario ?? []).map(d => (
                  <div key={d.date} className={s.volBar}>
                    <span className={s.volCount}>{d.count}</span>
                    <div
                      className={s.volFill}
                      style={{ height: `${Math.max((d.count / maxVol) * 80, 4)}px` }}
                    />
                    <span className={s.volDay}>{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
