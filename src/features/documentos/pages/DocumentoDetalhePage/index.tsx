import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInject } from '../../../../infra/hooks/inject';
import type { CoautorDocumento, DocumentoDetalhe, DocumentoDetalheAnexo, UsuarioSearchItem } from '../../models/documento.model';
import s from './style.module.scss';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

function fmtTempoDecorrido(iso: string | null): string {
  if (!iso) return '—';
  const inicio = new Date(iso).getTime();
  if (Number.isNaN(inicio)) return '—';
  const diffMin = Math.max(0, Math.floor((Date.now() - inicio) / 60000));
  if (diffMin < 60) return `${diffMin}min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  if (h < 24) return `${h}h ${m}min`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

function tipoDocumentoLabel(base: number | null): string {
  if (base === 1) return 'Interno';
  if (base === 2) return 'Externo';
  if (base === 3) return 'Digital';
  return 'Digital';
}

function avatarColor(codigo: number): string {
  const palette = ['#3b82f6', '#10b981', '#dc2626', '#a855f7', '#f97316', '#0ea5e9', '#eab308'];
  return palette[codigo % palette.length];
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

const TABS = [
  { key: 'overview',  label: 'Visão geral' },
  { key: 'document',  label: 'Documento'   },
  { key: 'flow',      label: 'Tramitação'  },
  { key: 'anexos',    label: 'Anexos'      },
  { key: 'comments',  label: 'Comentários' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ── Icons ──────────────────────────────────────────────────────────────────

const Icon = {
  back:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>,
  globe:    () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  star:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  print:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  more:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5"  cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>,
  pen:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  arrow:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  dl:       () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  eye:      () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  close:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ── Anexo helpers ───────────────────────────────────────────────────────────

/** MIME types que o browser consegue pré-visualizar inline. */
function canPreview(mime: string | null): boolean {
  if (!mime) return false;
  return (
    mime === 'application/pdf' ||
    mime.startsWith('image/') ||
    mime.startsWith('text/')
  );
}

/** Remove o param filename da URL → sem Content-Disposition: attachment → exibe inline. */
function toPreviewUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete('filename');
    return u.toString();
  } catch {
    return url;
  }
}

// ── AnexoPreviewModal ───────────────────────────────────────────────────────

function AnexoPreviewModal({
  anexo,
  onClose,
}: {
  anexo: DocumentoDetalheAnexo;
  onClose: () => void;
}) {
  const mime = anexo.mime ?? '';
  const preview = toPreviewUrl(anexo.url ?? '');
  const isPdf   = mime === 'application/pdf';
  const isImage  = mime.startsWith('image/');
  const isText   = mime.startsWith('text/');
  const hasPreview = canPreview(mime) && !!anexo.url;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={s.previewOverlay}
      onClick={onClose}
    >
      <div
        className={s.previewModal}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={s.previewHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={s.pdfTag} style={{ flexShrink: 0 }}>
              {(mime.split('/')[1] ?? 'FILE').toUpperCase().slice(0, 4)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {anexo.nome}
            </span>
            {anexo.tamanho && (
              <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{anexo.tamanho}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {anexo.url && (
              <a
                href={anexo.url}
                download
                className="btn btn-secondary"
                style={{ height: 32, padding: '0 12px', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <Icon.dl /> Baixar
              </a>
            )}
            <button className={s.iconBtn} onClick={onClose} title="Fechar">
              <Icon.close />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={s.previewBody}>
          {!hasPreview ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--text-3)' }}>
              <span style={{ fontSize: 40 }}>📄</span>
              <p style={{ margin: 0, fontSize: 13 }}>Pré-visualização não disponível para este tipo de arquivo.</p>
              {anexo.url && (
                <a href={anexo.url} download className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  <Icon.dl /> Baixar arquivo
                </a>
              )}
            </div>
          ) : isPdf ? (
            <iframe
              src={preview}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={anexo.nome}
            />
          ) : isImage ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', overflow: 'auto', padding: 16 }}>
              <img
                src={preview}
                alt={anexo.nome}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,.15)' }}
              />
            </div>
          ) : isText ? (
            <iframe
              src={preview}
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff', fontFamily: 'monospace' }}
              title={anexo.nome}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── AnexoRow — row usada tanto na visão geral quanto na aba Anexos ──────────

function AnexoRow({
  anexo,
  onPreview,
}: {
  anexo: DocumentoDetalheAnexo;
  onPreview: (a: DocumentoDetalheAnexo) => void;
}) {
  const shortExt = (anexo.mime?.split('/')[1] ?? 'FILE').toUpperCase().slice(0, 4);
  return (
    <div className={s.anexoItem}>
      <span className={s.pdfTag}>{shortExt}</span>
      <span className={s.anexoName}>{anexo.nome}</span>
      {anexo.tamanho && <span className={s.anexoSize}>{anexo.tamanho}</span>}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {canPreview(anexo.mime) && (
          <button
            className={s.previewBtn}
            title="Visualizar"
            onClick={() => onPreview(anexo)}
          >
            <Icon.eye />
          </button>
        )}
        {anexo.url ? (
          <a
            href={anexo.url}
            download
            className={s.dlBtn}
            title="Baixar"
          >
            <Icon.dl />
          </a>
        ) : (
          <button className={s.dlBtn} disabled title="Baixar"><Icon.dl /></button>
        )}
      </div>
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────────────

function Avatar({ name, codigo }: { name: string | null; codigo: number }) {
  return (
    <div className={s.avatar} style={{ background: avatarColor(codigo) }}>
      {initials(name)}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

// ── CoautoresCard ──────────────────────────────────────────────────────────

function CoautoresCard({
  docId,
  service,
}: {
  docId: number;
  service: ReturnType<typeof useInject>;
}) {
  const [coautores, setCoautores]       = useState<CoautorDocumento[]>([]);
  const [loading, setLoading]           = useState(true);
  const [adding, setAdding]             = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const [searchRes, setSearchRes]       = useState<UsuarioSearchItem[]>([]);
  const [searching, setSearching]       = useState(false);
  const [removing, setRemoving]         = useState<number | null>(null);
  const [showSearch, setShowSearch]     = useState(false);
  const searchRef                        = useRef<HTMLInputElement>(null);
  const debounceRef                      = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    service.listCoautores(docId).then(setCoautores).catch(() => {}).finally(() => setLoading(false));
  }, [docId]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showSearch]);

  function handleSearchChange(q: string) {
    setSearchQ(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setSearchRes([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await service.searchUsuarios(q.trim());
        setSearchRes(res);
      } catch { setSearchRes([]); }
      finally { setSearching(false); }
    }, 300);
  }

  async function handleAdd(user: UsuarioSearchItem) {
    if (adding) return;
    setAdding(true);
    try {
      const novo = await service.addCoautor(docId, user.codigo);
      setCoautores(prev => {
        const already = prev.find(c => c.codigoUsuario === user.codigo);
        return already ? prev : [...prev, novo];
      });
    } catch { /* ignore */ }
    finally {
      setAdding(false);
      setShowSearch(false);
      setSearchQ('');
      setSearchRes([]);
    }
  }

  async function handleRemove(coautor: CoautorDocumento) {
    if (removing !== null) return;
    setRemoving(coautor.codigoUsuario);
    try {
      await service.removeCoautor(docId, coautor.codigoUsuario);
      setCoautores(prev => prev.filter(c => c.codigoUsuario !== coautor.codigoUsuario));
    } catch { /* ignore */ }
    finally { setRemoving(null); }
  }

  return (
    <div className={s.sideCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p className={s.sideLabel} style={{ margin: 0 }}>Co-autores</p>
        <button
          className={s.iconBtn}
          title="Adicionar co-autor"
          onClick={() => setShowSearch(v => !v)}
          style={{ color: showSearch ? 'var(--primary)' : undefined }}
        >
          {showSearch ? <Icon.close /> : <IconPlus />}
        </button>
      </div>

      {/* Search box */}
      {showSearch && (
        <div style={{ marginBottom: 10, position: 'relative' }}>
          <input
            ref={searchRef}
            type="text"
            value={searchQ}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome, CPF ou matrícula..."
            style={{
              width: '100%', boxSizing: 'border-box', height: 36,
              padding: '0 10px', fontSize: 12.5,
              border: '1px solid var(--border)', borderRadius: 8,
              outline: 'none', fontFamily: 'inherit',
              color: 'var(--text)', background: 'var(--surface-2)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />
          {(searching || searchRes.length > 0) && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.1)',
              marginTop: 4, overflow: 'hidden',
            }}>
              {searching && (
                <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-3)' }}>Buscando…</div>
              )}
              {!searching && searchRes.length === 0 && searchQ.trim().length >= 2 && (
                <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-3)' }}>Nenhum usuário encontrado.</div>
              )}
              {searchRes.map(u => {
                const alreadyAdded = coautores.some(c => c.codigoUsuario === u.codigo);
                return (
                  <button
                    key={u.codigo}
                    type="button"
                    onClick={() => !alreadyAdded && handleAdd(u)}
                    disabled={alreadyAdded || adding}
                    style={{
                      display: 'flex', flexDirection: 'column', width: '100%',
                      padding: '8px 12px', background: 'none', border: 'none',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'left', cursor: alreadyAdded ? 'default' : 'pointer',
                      opacity: alreadyAdded ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {u.nome ?? `Usuário #${u.codigo}`}
                      {alreadyAdded && <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>já adicionado</span>}
                    </span>
                    {(u.cpf || u.matricula) && (
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {[u.cpf, u.matricula].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Co-authors list */}
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Carregando…</p>
      ) : coautores.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
          Nenhum co-autor cadastrado.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {coautores.map(c => (
            <div
              key={c.codigoUsuario}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 8,
                background: 'var(--surface-2)',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: '#a855f7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff',
              }}>
                {(c.nomeUsuario ?? '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.nomeUsuario ?? `Usuário #${c.codigoUsuario}`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.2 }}>{c.papel}</div>
              </div>
              <button
                className={s.iconBtn}
                title="Remover co-autor"
                onClick={() => handleRemove(c)}
                disabled={removing === c.codigoUsuario}
                style={{ width: 24, height: 24, color: 'var(--text-3)', flexShrink: 0 }}
              >
                <Icon.close />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function DocumentoDetalhePage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const service = useInject('DocumentosService');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [doc, setDoc] = useState<DocumentoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewAnexo, setPreviewAnexo] = useState<DocumentoDetalheAnexo | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!codigo) return;
    const id = Number(codigo);
    if (Number.isNaN(id)) {
      setError('Código de documento inválido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    service
      .findById(id)
      .then(res => { if (!cancelled) setDoc(res); })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as { response?: { status?: number; data?: { message?: string } } };
        if (e.response?.status === 404) setError('Documento não encontrado.');
        else setError(e.response?.data?.message ?? 'Erro ao carregar documento.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [codigo, service]);

  if (loading) {
    return (
      <div className={s.page}>
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          Carregando documento…
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className={s.page}>
        <button className={s.backBtn} onClick={() => navigate(-1)}>
          <Icon.back /> Voltar
        </button>
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--danger-700)', fontSize: 13 }}>
          {error ?? 'Documento não encontrado.'}
        </div>
      </div>
    );
  }

  const numero = doc.numeroNetdoc ?? doc.numero ?? String(doc.codigo);
  const isUrgente = doc.flagPendencia === 1;
  const tipoLabel = tipoDocumentoLabel(doc.tipoDocumentoBase);
  const subtitulo = [
    doc.numero,
    doc.tipoDocumentoSigla,
    doc.dataCriacao ? `Criado em ${fmtDateTime(doc.dataCriacao)}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className={s.page}>
      {previewAnexo && (
        <AnexoPreviewModal
          anexo={previewAnexo}
          onClose={() => setPreviewAnexo(null)}
        />
      )}

      {/* Breadcrumb */}
      <div className={s.crumb}>
        <button className={s.backBtn} onClick={() => navigate(-1)}>
          <Icon.back /> Voltar
        </button>
        <span className={s.crumbSep}>/</span>
        <span className={s.crumbItem}>Caixa de Entrada</span>
        <span className={s.crumbSep}>/</span>
        <span className={s.crumbCur}>{numero}</span>
      </div>

      <div className={s.grid}>

        {/* ── Main column ────────────────────────────────────────── */}
        <div>
          <div className={s.headerRow}>
            <div className={s.headerBadges}>
              <span className={s.docNum}>{numero}</span>
              {doc.segmentoOrigemSigla && (
                <span className={s.unitBadge}>
                  <span className={s.unitSigla}>{doc.segmentoOrigemSigla.slice(0, 2).toUpperCase()}</span>
                  {doc.segmentoOrigemSigla}
                </span>
              )}
              {isUrgente && (
                <span className={`${s.badge} ${s.badgeUrgent}`}>
                  <span className={s.dot} /> Urgente
                </span>
              )}
              <span className={`${s.badge} ${s.badgeNeutral}`}>
                <Icon.globe /> {tipoLabel}
              </span>
              {doc.flagConfidencial === 1 && (
                <span className={`${s.badge} ${s.badgePending}`}>Confidencial</span>
              )}
            </div>
            <div className={s.headerActions}>
              <button className={s.iconBtn} title="Favoritar"><Icon.star /></button>
              <button className={s.iconBtn} title="Imprimir"><Icon.print /></button>
              <button className={s.iconBtn} title="Baixar"><Icon.download /></button>
              <button className={s.iconBtn} title="Mais ações"><Icon.more /></button>
            </div>
          </div>

          <h1 className={s.title}>
            {doc.resumo ?? doc.assuntoDescricao ?? doc.tipoDocumentoNome ?? 'Documento'}
          </h1>
          <p className={s.subTitle}>{subtitulo || '—'}</p>

          {/* Tabs */}
          <div className={s.tabs}>
            {TABS.map(t => (
              <button
                key={t.key}
                className={`${s.tab} ${activeTab === t.key ? s.tabActive : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                {t.key === 'anexos' && doc.anexos.length > 0 && (
                  <span className={s.tabCount}>({doc.anexos.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Visão geral */}
          {activeTab === 'overview' && (
            <>
              {/* Resumo */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <h3 className={s.cardTitle}>Resumo</h3>
                </div>
                <p className={s.resumoText}>
                  {doc.resumo ?? <em style={{ color: 'var(--text-3)' }}>Nenhum resumo cadastrado.</em>}
                </p>
              </div>

              {/* Despacho (se houver) */}
              {doc.despacho && (
                <div className={s.card}>
                  <div className={s.cardHeader}>
                    <h3 className={s.cardTitle}>Despacho</h3>
                  </div>
                  <p className={s.resumoText}>{doc.despacho}</p>
                </div>
              )}

              {/* Assunto / Tipo cards */}
              <div className={s.metricsRow}>
                <div className={s.metricCard}>
                  <p className={s.metricLabel}>Assunto</p>
                  <div className={s.metricValue} style={{ fontSize: 16, lineHeight: 1.4 }}>
                    {doc.assuntoDescricao ?? '—'}
                  </div>
                </div>
                <div className={s.metricCard}>
                  <p className={s.metricLabel}>Tipo de documento</p>
                  <div className={s.metricValue} style={{ fontSize: 16, lineHeight: 1.4 }}>
                    {doc.tipoDocumentoNome ?? '—'}
                  </div>
                  {doc.tipoDocumentoSigla && (
                    <p className={s.metricFoot}>{doc.tipoDocumentoSigla}</p>
                  )}
                </div>
              </div>

              {/* Anexos */}
              <div className={s.card}>
                <div className={s.cardHeader}>
                  <h3 className={s.cardTitle}>Anexos</h3>
                  {doc.anexos.length > 0 && (
                    <button
                      className={s.tab}
                      style={{ fontSize: 12.5, padding: '4px 10px', borderBottom: 'none' }}
                      onClick={() => setActiveTab('anexos')}
                    >
                      Ver todos ({doc.anexos.length})
                    </button>
                  )}
                </div>
                {doc.anexos.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                    Nenhum anexo neste documento.
                  </p>
                ) : (
                  doc.anexos.map(a => (
                    <AnexoRow key={a.id} anexo={a} onPreview={setPreviewAnexo} />
                  ))
                )}
              </div>
            </>
          )}

          {/* Aba Anexos */}
          {activeTab === 'anexos' && (
            <div className={s.card}>
              <div className={s.cardHeader}>
                <h3 className={s.cardTitle}>Peças e Anexos</h3>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {doc.anexos.length} {doc.anexos.length === 1 ? 'arquivo' : 'arquivos'}
                </span>
              </div>
              {doc.anexos.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>
                  Nenhum anexo neste documento.
                </p>
              ) : (
                doc.anexos.map(a => (
                  <AnexoRow key={a.id} anexo={a} onPreview={setPreviewAnexo} />
                ))
              )}
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'anexos' && (
            <div className={s.card}>
              <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', margin: 0, padding: '40px 0' }}>
                Conteúdo da aba <strong style={{ color: 'var(--text-2)' }}>{TABS.find(t => t.key === activeTab)?.label}</strong> em construção.
              </p>
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────── */}
        <div className={s.side}>

          {/* Próxima ação */}
          <div className={s.sideCard}>
            <p className={s.sideLabel}>Próxima ação</p>
            {/* Show "Editar" only when document hasn't been tramitated yet */}
            {doc.tipoDespacho === null && doc.dataRecebido === null && (
              <button
                className={s.btnSecondary}
                onClick={() => navigate(`/documentos/${doc.codigo}/editar`)}
                style={{ marginBottom: 8 }}
              >
                <Icon.pen /> Editar documento
              </button>
            )}
            <button className={s.btnPrimary}><Icon.pen /> Assinar e tramitar</button>
            <button className={s.btnSecondary}><Icon.arrow /> Tramitar para...</button>
            <button className={s.btnGhost}>Recusar e devolver</button>
          </div>

          {/* Detalhes */}
          <div className={s.sideCard}>
            <p className={s.sideLabel}>Detalhes</p>
            <div className={s.detailRow}>
              <span className={s.detailKey}>Tipo</span>
              <span className={s.detailVal}>{doc.tipoDocumentoSigla ?? '—'}</span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailKey}>Origem</span>
              <span className={s.detailVal}>
                {doc.segmentoOrigemSigla ? (
                  <span className={s.unitBadge} style={{ padding: '1px 7px', fontSize: 11 }}>
                    <span className={s.unitSigla}>{doc.segmentoOrigemSigla.slice(0, 2).toUpperCase()}</span>
                    {doc.segmentoOrigemSigla}
                  </span>
                ) : '—'}
              </span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailKey}>Local atual</span>
              <span className={s.detailVal}>{doc.segmentoAtualNome ?? doc.segmentoAtualSigla ?? '—'}</span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailKey}>Recebido</span>
              <span className={s.detailVal}>{fmtDateTime(doc.dataRecebido ?? doc.dataCriacao)}</span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailKey}>Tempo aqui</span>
              <span className={s.detailValWarning}>
                {fmtTempoDecorrido(doc.dataRecebido ?? doc.dataCriacao)}
              </span>
            </div>
            <div className={s.detailRow}>
              <span className={s.detailKey}>Atualizado</span>
              <span className={s.detailVal}>{fmtDateTime(doc.dataAtualizacao)}</span>
            </div>
          </div>

          {/* Pessoas envolvidas */}
          <div className={s.sideCard}>
            <p className={s.sideLabel}>Pessoas envolvidas</p>
            {doc.pessoas.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
                Nenhuma pessoa registrada.
              </p>
            ) : (
              doc.pessoas.map(p => (
                <div key={p.codigo} className={s.personRow}>
                  <Avatar name={p.nome} codigo={p.codigo} />
                  <div className={s.personInfo}>
                    <span className={s.personName}>{p.nome ?? `Usuário #${p.codigo}`}</span>
                    <span className={s.personRole}>{p.papel}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Co-autores */}
          <CoautoresCard docId={doc.codigo} service={service} />
        </div>
      </div>
    </div>
  );
}
