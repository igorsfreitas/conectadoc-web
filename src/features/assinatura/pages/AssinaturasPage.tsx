import { useCallback, useEffect, useRef, useState } from 'react';
import { useInject } from '../../../infra/hooks/inject';
import {
  AssinaturasContagens,
  SolicitacaoAssinatura,
  TabAssinatura,
} from '../models/assinatura.model';
import styles from './AssinaturasPage.module.scss';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function docLabel(item: SolicitacaoAssinatura): string {
  return item.numero ?? item.numeroNetdoc ?? `Peça #${item.codigoPeca}`;
}

function statusIsPending(status: string): boolean {
  return status === 'AGUARDANDO_CONFIRMACAO' || status === 'INICIADA';
}

// ── tab config ────────────────────────────────────────────────────────────────

const TABS: { key: TabAssinatura; label: string }[] = [
  { key: 'pendentes', label: 'Pendentes' },
  { key: 'fila',      label: 'Minha fila' },
  { key: 'assinados', label: 'Já assinados' },
  { key: 'recusados', label: 'Recusados' },
];

// ── sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isPending = statusIsPending(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
      background: isPending ? '#FEF3C7' : status === 'CONCLUIDA' ? '#D1FAE5' : '#FEE2E2',
      color: isPending ? '#92400E' : status === 'CONCLUIDA' ? '#065F46' : '#991B1B',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isPending ? '#F59E0B' : status === 'CONCLUIDA' ? '#10B981' : '#EF4444',
        flexShrink: 0,
      }} />
      {isPending ? 'Pendente' : status === 'CONCLUIDA' ? 'Assinado' : 'Recusado'}
    </span>
  );
}

function UrgenteBadge() {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 99,
      fontSize: 11.5, fontWeight: 600,
      background: '#FEE2E2', color: '#991B1B',
    }}>
      Urgente
    </span>
  );
}

function DocIcon() {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
      background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    </div>
  );
}

function ShimmerCard() {
  const bar = (w: number, h = 13) => (
    <div style={{
      width, height: h, borderRadius: 6,
      background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border,#e5e7eb)' }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, background: '#e5e7eb', flexShrink: 0 }} />
      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e5e7eb', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8 }}>{bar(160)} {bar(60)} </div>
        {bar(260)}
        {bar(180, 11)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>{bar(52, 30)} {bar(72, 30)}</div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export function AssinaturasPage() {
  const assinaturaService = useInject('AssinaturaService');

  const [activeTab, setActiveTab] = useState<TabAssinatura>('pendentes');
  const [items, setItems] = useState<SolicitacaoAssinatura[]>([]);
  const [counts, setCounts] = useState<AssinaturasContagens>({ pendentes: 0, fila: 0, assinados: 0, recusados: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [recusandoId, setRecusandoId] = useState<number | null>(null);
  const masterRef = useRef<HTMLInputElement>(null);

  // ── load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async (tab: TabAssinatura) => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const res = await assinaturaService.solicitacoes(tab);
      setItems(res.data);
      setCounts(res.counts);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? e.message ?? 'Erro ao carregar assinaturas.');
    } finally {
      setLoading(false);
    }
  }, [assinaturaService]);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  // ── master checkbox indeterminate state ──────────────────────────────────

  useEffect(() => {
    if (!masterRef.current) return;
    const all = selected.size === items.length && items.length > 0;
    const some = selected.size > 0 && !all;
    masterRef.current.checked = all;
    masterRef.current.indeterminate = some;
  }, [selected, items]);

  // ── selection handlers ────────────────────────────────────────────────────

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.codigo)));
    }
  }

  function toggleItem(codigo: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  }

  // ── recusar ───────────────────────────────────────────────────────────────

  async function handleRecusar(codigo: number) {
    setRecusandoId(codigo);
    try {
      await assinaturaService.recusar(codigo);
      setItems((prev) => prev.filter((i) => i.codigo !== codigo));
      setSelected((prev) => { const n = new Set(prev); n.delete(codigo); return n; });
      setCounts((prev) => ({
        ...prev,
        pendentes: Math.max(0, prev.pendentes - 1),
        recusados: prev.recusados + 1,
      }));
    } catch {
      // silently ignore — in production, show toast
    } finally {
      setRecusandoId(null);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  const isPendingTab = activeTab === 'pendentes' || activeTab === 'fila';
  const pendingCount = counts.pendentes;

  return (
    <div className={styles.page}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

      {/* ── header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assinaturas</h1>
          <p className={styles.subtitle}>
            {loading
              ? 'Carregando...'
              : `${pendingCount} documento${pendingCount !== 1 ? 's' : ''} aguardando sua assinatura digital`}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnOutline}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Capturar assinatura manuscrita
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={selected.size === 0}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {selected.size > 0
              ? `Assinar ${selected.size} selecionado${selected.size !== 1 ? 's' : ''}`
              : 'Assinar selecionados'}
          </button>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className={styles.tabs}>
        {TABS.map(({ key, label }) => {
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              {count > 0 && (
                <span className={`${styles.tabBadge} ${activeTab === key ? styles.tabBadgeActive : ''}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── error ── */}
      {error && (
        <div className={styles.errorBox}>⚠ {error}</div>
      )}

      {/* ── list container ── */}
      <div className={styles.listContainer}>
        {/* selection bar — only for actionable tabs */}
        {isPendingTab && !loading && items.length > 0 && (
          <div className={styles.selectionBar}>
            <label className={styles.masterCheck}>
              <input
                ref={masterRef}
                type="checkbox"
                onChange={toggleAll}
              />
              <span className={styles.selectionCount}>
                {selected.size > 0
                  ? `${selected.size} de ${items.length} selecionado${selected.size !== 1 ? 's' : ''}`
                  : `${items.length} item${items.length !== 1 ? 's' : ''}`}
              </span>
            </label>
            <div className={styles.selectionBarRight}>
              <button type="button" className={styles.btnBarAction}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filtrar
              </button>
              <button type="button" className={styles.btnBarAction}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                </svg>
                Mais urgentes primeiro
              </button>
            </div>
          </div>
        )}

        {/* content */}
        {loading ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Nenhum item encontrado nesta aba.</p>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selected.has(item.codigo);
            const isRecusando = recusandoId === item.codigo;
            return (
              <div
                key={item.codigo}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
              >
                {/* checkbox — only for pending tabs */}
                {isPendingTab && (
                  <input
                    type="checkbox"
                    className={styles.cardCheck}
                    checked={isSelected}
                    onChange={() => toggleItem(item.codigo)}
                  />
                )}

                <DocIcon />

                <div className={styles.cardContent}>
                  {/* line 1: doc number + badges */}
                  <div className={styles.cardLine1}>
                    <span className={styles.docNumber}>{docLabel(item)}</span>
                    <StatusBadge status={item.status} />
                    {item.flagUrgente && <UrgenteBadge />}
                  </div>

                  {/* line 2: resumo */}
                  {item.resumo && (
                    <p className={styles.cardResumo}>{item.resumo}</p>
                  )}

                  {/* line 3: solicitado por + data */}
                  <p className={styles.cardMeta}>
                    {item.solicitadoPor
                      ? `Solicitado por ${item.solicitadoPor}`
                      : 'Solicitante não identificado'}
                    {item.solicitadoEm ? ` · ${fmtDateTime(item.solicitadoEm)}` : ''}
                  </p>
                </div>

                {/* actions */}
                <div className={styles.cardActions}>
                  <button type="button" className={styles.btnVer}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                    Ver
                  </button>
                  {isPendingTab && (
                    <button
                      type="button"
                      className={styles.btnRecusar}
                      onClick={() => handleRecusar(item.codigo)}
                      disabled={isRecusando}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                      {isRecusando ? '...' : 'Recusar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
