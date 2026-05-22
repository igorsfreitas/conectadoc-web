import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInject } from '../../../../infra/hooks/inject';
import type { DocumentosService } from '../../../../infra/services/documentos/documentos.service';
import type { AtributoDocumento, CoautorDocumento, ComentarioDocumento, DespachoPadrao, DocumentoDetalhe, DocumentoDetalheAnexo, TramitacaoItem, UsuarioPorSegmento, UsuarioSearchItem } from '../../models/documento.model';
import type { AtributoTipoDocumento } from '../../../tipo-documento/models/tipo-documento.model';
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

// ── Atributo helpers ───────────────────────────────────────────────────────

function extractAtributoVal(atipo: AtributoTipoDocumento, adoc: AtributoDocumento | undefined): string {
  if (!adoc) return '';
  const t = atipo.tipo;
  if (t === 2)             return (adoc.valorData ?? adoc.valor ?? '').split('T')[0];
  if (t === 5 || t === 6) return String(adoc.valorFloat ?? adoc.valor ?? '');
  return adoc.valor ?? '';
}

function formatAtributoDisplay(atipo: AtributoTipoDocumento, adoc: AtributoDocumento | undefined): string {
  const raw = extractAtributoVal(atipo, adoc);
  if (!raw) return '—';
  const t = atipo.tipo;
  // Date → dd/MM/yyyy
  if (t === 2) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : raw;
  }
  // Checkbox
  if (t === 11) return raw === '1' ? 'Sim' : 'Não';
  // Multi-valued: split and join
  if (t === 8) {
    const parts = raw.includes('|') ? raw.split('|')
      : raw.includes(';')          ? raw.split(';')
      : [raw];
    return parts.map(p => p.trim()).filter(Boolean).join(' · ');
  }
  return raw;
}

/** Group sorted atributos by their aba field. */
function groupByAba(atributos: AtributoTipoDocumento[]): Array<[string, AtributoTipoDocumento[]]> {
  const map = new Map<string, AtributoTipoDocumento[]>();
  for (const a of atributos) {
    const key = a.aba?.trim() || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries());
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
  service: DocumentosService;
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
              {c.fotoUrl ? (
                <img
                  src={c.fotoUrl}
                  alt={c.nomeUsuario ?? ''}
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: '#a855f7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: '#fff',
                }}>
                  {(c.nomeUsuario ?? '?').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
              )}
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

// ── ComentariosTab ─────────────────────────────────────────────────────────

function ComentariosTab({ docId, service }: { docId: number; service: DocumentosService }) {
  const [comentarios, setComentarios] = useState<ComentarioDocumento[]>([]);
  const [loading, setLoading]         = useState(true);
  const [texto, setTexto]             = useState('');
  const [sending, setSending]         = useState(false);
  const [removing, setRemoving]       = useState<number | null>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    service.listComentarios(docId)
      .then(setComentarios)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [docId]);

  async function handleSend() {
    const t = texto.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const novo = await service.addComentario(docId, t);
      setComentarios(prev => [...prev, novo]);
      setTexto('');
      textareaRef.current?.focus();
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  async function handleDelete(c: ComentarioDocumento) {
    if (removing !== null) return;
    setRemoving(c.codigo);
    try {
      await service.deleteComentario(docId, c.codigo);
      setComentarios(prev => prev.filter(x => x.codigo !== c.codigo));
    } catch { /* ignore */ }
    finally { setRemoving(null); }
  }

  function fmtRelativo(iso: string | null): string {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60)   return 'agora mesmo';
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', gap: 10, padding: '12px 0',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <h3 className={s.cardTitle}>Comentários</h3>
        {comentarios.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{comentarios.length}</span>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Carregando…</p>
      ) : comentarios.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 16px' }}>
          Nenhum comentário ainda. Seja o primeiro a comentar.
        </p>
      ) : (
        <div style={{ marginBottom: 20 }}>
          {comentarios.map(c => (
            <div key={c.codigo} style={rowStyle}>
              {/* Avatar */}
              {c.fotoUrl ? (
                <img src={c.fotoUrl} alt={c.nomeUsuario ?? ''} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }} />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  background: avatarColor(c.codigoUsuario),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                }}>
                  {initials(c.nomeUsuario)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {c.nomeUsuario ?? `Usuário #${c.codigoUsuario}`}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{fmtRelativo(c.dataCriacao)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {c.texto}
                </p>
              </div>
              <button
                className={s.iconBtn}
                title="Excluir comentário"
                onClick={() => handleDelete(c)}
                disabled={removing === c.codigo}
                style={{ alignSelf: 'flex-start', marginTop: 2, color: 'var(--text-3)', flexShrink: 0 }}
              >
                <Icon.close />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Caixa de envio */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSend();
          }}
          placeholder="Escreva um comentário… (Ctrl+↵ para enviar)"
          rows={3}
          style={{
            flex: 1, resize: 'vertical', minHeight: 72, padding: '10px 12px',
            border: '1px solid var(--border)', borderRadius: 10,
            fontSize: 13.5, fontFamily: 'inherit', color: 'var(--text)',
            background: 'var(--surface-2)', outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
        />
        <button
          className={s.btnPrimary}
          onClick={handleSend}
          disabled={!texto.trim() || sending}
          style={{ height: 38, paddingInline: 18, flexShrink: 0, alignSelf: 'flex-end' }}
        >
          {sending ? 'Enviando…' : 'Comentar'}
        </button>
      </div>
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

// ── TramitarDialog ──────────────────────────────────────────────────────────

function TramitarDialog({
  doc,
  service,
  onClose,
  onSuccess,
}: {
  doc: DocumentoDetalhe;
  service: DocumentosService;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const uaService = useInject('UnidadeAdministrativaService');
  const [segmentos, setSegmentos] = useState<{ codigo: number; nome: string | null; sigla: string | null }[]>([]);
  const [destino, setDestino]     = useState<number | ''>('');
  const [despacho, setDespacho]   = useState('');
  const [dataLimite, setDataLimite] = useState('');
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState('');

  // Usuários do destino
  const [usuariosDestino, setUsuariosDestino] = useState<UsuarioPorSegmento[]>([]);
  const [usuarioPicked, setUsuarioPicked]     = useState<UsuarioPorSegmento | null>(null);
  const [pickerUsuariosOpen, setPickerUsuariosOpen] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Despachos padrão
  const [despachosPadrao, setDespachosPadrao]   = useState<DespachoPadrao[]>([]);
  const [pickerDespachoOpen, setPickerDespachoOpen] = useState(false);

  // Anexar despacho como peça
  const [anexarDespacho, setAnexarDespacho] = useState(false);

  useEffect(() => {
    uaService.findAllSimple().then(list => setSegmentos(list)).catch(() => setSegmentos([]));
    service.listDespachosPadrao().then(setDespachosPadrao).catch(() => setDespachosPadrao([]));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Quando destino muda → carrega usuários da unidade
  useEffect(() => {
    if (!destino) { setUsuariosDestino([]); setUsuarioPicked(null); return; }
    setLoadingUsuarios(true);
    setUsuarioPicked(null);
    service.listUsuariosPorSegmento(Number(destino))
      .then(setUsuariosDestino)
      .catch(() => setUsuariosDestino([]))
      .finally(() => setLoadingUsuarios(false));
  }, [destino]);

  const filteredSeg = segmentos.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (s.nome ?? '').toLowerCase().includes(q) || (s.sigla ?? '').toLowerCase().includes(q);
  });

  async function handleTramitar() {
    if (!destino) { setError('Selecione o destino.'); return; }
    setSending(true);
    setError(null);
    try {
      await service.tramitar(doc.codigo, {
        codigoSegmentoDestino: Number(destino),
        codigoUsuarioDestino:  usuarioPicked?.codigo,
        despacho:   despacho.trim() || undefined,
        dataLimite: dataLimite || undefined,
        tipoDespacho: 'DESPACHO',
        anexarDespachoComoPeca: anexarDespacho && !!despacho.trim(),
      });
      onSuccess();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Erro ao tramitar documento.');
      setSending(false);
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(15,23,42,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    backdropFilter: 'blur(3px)',
  };
  const modal: React.CSSProperties = {
    width: '100%', maxWidth: 640, background: '#fff',
    borderRadius: 16, boxShadow: '0 24px 60px rgba(15,23,42,0.28)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 4 }}>
            Tramitar documento
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {doc.numeroNetdoc ?? doc.numero ?? `Documento #${doc.codigo}`}
          </div>
          {doc.segmentoAtualNome && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Origem: <strong style={{ color: 'var(--text-2)' }}>{doc.segmentoAtualNome}</strong>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '60vh' }}>

          {/* Destino */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
              Destino <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Pesquisar unidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', height: 36, padding: '0 10px', boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, marginBottom: 6, outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
            />
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              {filteredSeg.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--text-3)' }}>Nenhuma unidade encontrada.</div>
              ) : filteredSeg.map(seg => (
                <button
                  key={seg.codigo}
                  type="button"
                  onClick={() => setDestino(seg.codigo)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 12px', background: destino === seg.codigo ? 'var(--primary-soft)' : 'transparent',
                    border: 'none', borderBottom: '1px solid var(--border)', textAlign: 'left', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {seg.sigla && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: destino === seg.codigo ? 'var(--primary)' : 'var(--surface-2)', color: destino === seg.codigo ? '#fff' : 'var(--text-2)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                      {seg.sigla}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: destino === seg.codigo ? 'var(--primary)' : 'var(--text)', fontWeight: destino === seg.codigo ? 600 : 400 }}>
                    {seg.nome ?? seg.sigla}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Usuário destino (opcional) */}
          {destino && (
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Usuário destino (opcional)
              </label>
              <button
                type="button"
                onClick={() => setPickerUsuariosOpen(true)}
                disabled={loadingUsuarios || usuariosDestino.length === 0}
                style={{
                  width: '100%', height: 38, padding: '0 12px', textAlign: 'left',
                  background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8,
                  fontSize: 13, color: usuarioPicked ? 'var(--text)' : 'var(--text-3)',
                  cursor: loadingUsuarios || usuariosDestino.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span>
                  {loadingUsuarios ? 'Carregando usuários…'
                    : usuariosDestino.length === 0 ? 'Nenhum usuário lotado nesta unidade'
                    : usuarioPicked ? usuarioPicked.nome ?? `Usuário #${usuarioPicked.codigo}`
                    : 'Selecionar Usuário'}
                </span>
                {usuarioPicked && (
                  <span
                    onClick={e => { e.stopPropagation(); setUsuarioPicked(null); }}
                    style={{ color: 'var(--text-3)', fontSize: 16, padding: '0 6px', cursor: 'pointer' }}
                  >×</span>
                )}
              </button>
            </div>
          )}

          {/* Data Limite */}
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
              Data limite (opcional — gera pendência)
            </label>
            <input
              type="date"
              value={dataLimite}
              onChange={e => setDataLimite(e.target.value)}
              style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', color: 'var(--text)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Despacho */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>
                Conteúdo do despacho (opcional)
              </label>
              {despachosPadrao.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPickerDespachoOpen(true)}
                  style={{
                    fontSize: 12, padding: '4px 10px', background: 'var(--surface-2)',
                    border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-2)',
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                  }}
                >
                  📋 Despachos Padrão
                </button>
              )}
            </div>
            <textarea
              value={despacho}
              onChange={e => setDespacho(e.target.value)}
              placeholder="Redija o despacho de encaminhamento..."
              rows={4}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13.5, fontFamily: 'inherit', lineHeight: 1.5, outline: 'none', color: 'var(--text)', minHeight: 90 }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
            />
            {despacho.trim() && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)', marginTop: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={anexarDespacho}
                  onChange={e => setAnexarDespacho(e.target.checked)}
                  style={{ width: 15, height: 15, cursor: 'pointer' }}
                />
                Anexar despacho como peça (PDF) ao documento
              </label>
            )}
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--surface-2)' }}>
          <button
            style={{ height: 38, padding: '0 18px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-2)' }}
            onClick={onClose}
            disabled={sending}
          >
            Cancelar
          </button>
          <button
            style={{ height: 38, padding: '0 22px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: sending || !destino ? 'not-allowed' : 'pointer', opacity: sending || !destino ? 0.6 : 1, fontFamily: 'inherit' }}
            onClick={handleTramitar}
            disabled={sending || !destino}
          >
            {sending ? 'Tramitando…' : '↗ Tramitar documento'}
          </button>
        </div>

        {/* Sub-picker: Despachos Padrão */}
        {pickerDespachoOpen && (
          <PickerOverlay title="Selecionar Layout do Despacho" onClose={() => setPickerDespachoOpen(false)}>
            <div style={{ background: '#dde7f2', padding: '8px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
              LAYOUT DE DESPACHO
            </div>
            {despachosPadrao.map(d => (
              <button
                key={d.codigo}
                type="button"
                onClick={() => {
                  setDespacho(d.conteudo
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim());
                  setPickerDespachoOpen(false);
                }}
                style={{
                  display: 'block', width: '100%', padding: '12px 14px',
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, color: 'var(--text)', fontWeight: 600,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {d.nome}
                <div style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.4 }}>
                  {d.conteudo.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)}
                  {d.conteudo.length > 120 ? '…' : ''}
                </div>
              </button>
            ))}
          </PickerOverlay>
        )}

        {/* Sub-picker: Usuários */}
        {pickerUsuariosOpen && (
          <PickerOverlay title="Usuários" onClose={() => setPickerUsuariosOpen(false)}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', background: '#dde7f2', padding: '8px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
              <span>NOME</span>
              <span>UND</span>
            </div>
            {usuariosDestino.map(u => (
              <button
                key={u.codigo}
                type="button"
                onClick={() => { setUsuarioPicked(u); setPickerUsuariosOpen(false); }}
                style={{
                  display: 'grid', gridTemplateColumns: '1.6fr 1fr',
                  width: '100%', padding: '10px 14px',
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, color: 'var(--text)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontWeight: 500 }}>{u.nome ?? `Usuário #${u.codigo}`}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 12 }}>
                  {u.segmentoSigla ?? u.segmentoNome ?? '—'}
                </span>
              </button>
            ))}
            {usuariosDestino.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                Nenhum usuário lotado nesta unidade.
              </div>
            )}
          </PickerOverlay>
        )}
      </div>
    </div>
  );
}

// ── PickerOverlay ────────────────────────────────────────────────────────────

function PickerOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 540, maxHeight: '70vh',
        background: '#fff', borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(15,23,42,0.4)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          background: '#1f4e79', color: '#fff', padding: '8px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 13, fontWeight: 600,
        }}>
          <span>{title}</span>
          <button onClick={onClose} style={{
            background: '#fff', color: '#000', width: 22, height: 22, border: '1px solid #888',
            cursor: 'pointer', fontSize: 12, fontWeight: 700, lineHeight: '20px', padding: 0,
          }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── TramitarSuccessDialog (pós-tramitação) ────────────────────────────────

function TramitarSuccessDialog({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, padding: 24, maxWidth: 380,
        boxShadow: '0 24px 60px rgba(15,23,42,0.4)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
          {message}
        </div>
        <button onClick={onClose} style={{
          marginTop: 14, padding: '8px 24px', background: 'var(--primary)',
          color: '#fff', border: 'none', borderRadius: 8, fontSize: 13,
          fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>OK</button>
      </div>
    </div>
  );
}

// ── TramitacoesTab ───────────────────────────────────────────────────────────

function TramitacoesTab({ docId, service }: { docId: number; service: DocumentosService }) {
  const [items, setItems]   = useState<TramitacaoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    service.listTramitacoes(docId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [docId]);

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function statusBadge(item: TramitacaoItem) {
    if (item.flagCancelada === 1) return { label: 'Cancelada', bg: '#fee2e2', color: '#dc2626' };
    if (item.flagRecusada  === 1) return { label: 'Recusada',  bg: '#fef9c3', color: '#b45309' };
    if (item.flagAceite    === 1) return { label: 'Aceita',    bg: '#dcfce7', color: '#16a34a' };
    return { label: 'Em andamento', bg: 'var(--primary-soft)', color: 'var(--primary)' };
  }

  if (loading) return (
    <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
      Carregando tramitações…
    </div>
  );

  if (items.length === 0) return (
    <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
      Nenhuma tramitação registrada para este documento.
    </div>
  );

  return (
    <div>
      {/* Timeline */}
      <div style={{ position: 'relative', paddingLeft: 32 }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 10, top: 10, bottom: 10, width: 2, background: 'var(--border)' }} />

        {items.map((item, idx) => {
          const badge = statusBadge(item);
          return (
            <div key={item.codigo} style={{ position: 'relative', marginBottom: idx < items.length - 1 ? 20 : 0 }}>
              {/* Circle */}
              <div style={{
                position: 'absolute', left: -28, top: 14,
                width: 16, height: 16, borderRadius: '50%',
                background: badge.color, border: '2px solid #fff',
                boxShadow: '0 0 0 2px ' + badge.color,
              }} />

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
                {/* Row 1: origem → destino + status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', flexWrap: 'wrap' }}>
                    <span style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>
                      {item.origemSigla ?? item.origemNome ?? '—'}
                    </span>
                    <span style={{ color: 'var(--text-3)', fontSize: 14 }}>→</span>
                    <span style={{ background: 'var(--primary-soft)', color: 'var(--primary)', borderRadius: 6, padding: '2px 8px', fontSize: 12 }}>
                      {item.destinoSigla ?? item.destinoNome ?? '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    <a
                      href={service.grtUrl(item.codigoDocumento, item.codigo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Gerar GRT (PDF)"
                      style={{
                        display: 'inline-flex', alignItems: 'center', fontSize: 11.5,
                        color: 'var(--primary)', textDecoration: 'none', fontWeight: 600,
                        padding: '3px 8px', border: '1px solid var(--border)',
                        borderRadius: 12, background: 'var(--surface)',
                      }}
                    >
                      📄 GRT
                    </a>
                  </div>
                </div>

                {/* Row 2: meta */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: item.despacho ? 10 : 0 }}>
                  <span>Enviado em {fmtDate(item.dataEnvio)}</span>
                  {item.usuarioOrigemNome && <span>por <strong style={{ color: 'var(--text-2)' }}>{item.usuarioOrigemNome}</strong></span>}
                  {item.usuarioDestinoNome && <span>→ para <strong style={{ color: 'var(--text-2)' }}>{item.usuarioDestinoNome}</strong></span>}
                  {item.dataLimite && (
                    <span style={{ color: '#b45309' }}>
                      Prazo: {new Date(item.dataLimite).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>

                {/* Despacho */}
                {item.despacho && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', marginBottom: 6 }}>
                      {item.tipoDespacho ?? 'Despacho'}
                    </div>
                    <div
                      style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{ __html: item.despacho }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DocumentoPreview ────────────────────────────────────────────────────────

function DocumentoPreview({
  doc,
  atributosTipo,
  atributosDoc,
}: {
  doc: DocumentoDetalhe;
  atributosTipo: AtributoTipoDocumento[];
  atributosDoc: AtributoDocumento[];
}) {
  const dataCriacao = doc.dataCriacao ? new Date(doc.dataCriacao) : null;
  const dataFormatada = dataCriacao
    ? dataCriacao.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const tipoNome = doc.tipoDocumentoNome?.toUpperCase() ?? '';
  const docTitulo = [tipoNome, doc.numero ? `Nº ${doc.numero}` : null].filter(Boolean).join(' ');

  const getAdoc = (atipo: AtributoTipoDocumento) =>
    atributosDoc.find(a => a.codigoAtributoTipo === atipo.codigo);

  const getVal = (atipo: AtributoTipoDocumento) => extractAtributoVal(atipo, getAdoc(atipo));

  // Split by tipo: HTML fields get their own full-width block; others inline
  const atributoSimples = atributosTipo.filter(a => a.tipo !== 7);
  const atributoHtml    = atributosTipo.filter(a => a.tipo === 7);

  const paper: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--border)',
    borderRadius: 6,
    boxShadow: '0 4px 24px rgba(15,23,42,0.10)',
    maxWidth: 700,
    margin: '0 auto',
    fontFamily: "'Times New Roman', Georgia, serif",
    fontSize: 13,
    color: '#111',
    lineHeight: 1.7,
  };

  const body: React.CSSProperties = { padding: '44px 64px 56px' };

  return (
    <div style={paper}>
      <div style={body}>

        {/* ── Institutional header ─────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'inherit', color: '#333' }}>
            Prefeitura Municipal
          </div>

          {/* Coat-of-arms placeholder — replaces with real image when available */}
          <div style={{
            height: 70,
            background: 'repeating-linear-gradient(45deg, #f0f2f5 0, #f0f2f5 5px, #fff 5px, #fff 10px)',
            border: '1px dashed #ccc',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}>
            <span style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic', fontFamily: 'sans-serif' }}>
              brasão e cabeçalho oficial
            </span>
          </div>

          {/* Department / origin segment */}
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            {doc.segmentoOrigemNome?.toUpperCase() ?? doc.segmentoOrigemSigla ?? ''}
          </div>

          {/* Date + NetDoc number */}
          {(dataFormatada || doc.numeroNetdoc) && (
            <div style={{ fontSize: 11, color: '#555', lineHeight: 1.9, fontFamily: 'inherit' }}>
              {dataFormatada && <div>{dataFormatada}</div>}
              {doc.numeroNetdoc && <div>NND: {doc.numeroNetdoc}</div>}
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '0 0 22px' }} />

        {/* ── Document title ───────────────────────────────── */}
        {docTitulo && (
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <strong style={{ fontSize: 13.5, letterSpacing: '0.03em' }}>{docTitulo}</strong>
          </div>
        )}

        {/* ── Resumo as "Pauta" ────────────────────────────── */}
        {doc.resumo && (
          <p style={{ margin: '0 0 14px', textIndent: '0' }}>
            <strong>Pauta:</strong> {doc.resumo}
          </p>
        )}

        {/* ── Simple atributos (non-HTML, with value) ──────── */}
        {atributoSimples.map(atipo => {
          const val = formatAtributoDisplay(atipo, getAdoc(atipo));
          if (val === '—' || !val) return null;
          const label = atipo.label ?? atipo.nome ?? `Campo ${atipo.codigo}`;
          return (
            <p key={atipo.codigo} style={{ margin: '0 0 10px' }}>
              <strong>{label}:</strong> {val}
            </p>
          );
        })}

        {/* ── Despacho / body (HTML) ───────────────────────── */}
        {doc.despacho && (
          <div
            style={{ margin: '16px 0', textAlign: 'justify' }}
            dangerouslySetInnerHTML={{ __html: doc.despacho }}
          />
        )}

        {/* ── HTML atributos (full-width rich sections) ─────── */}
        {atributoHtml.map(atipo => {
          const raw = getVal(atipo);
          if (!raw) return null;
          const label = atipo.label ?? atipo.nome ?? `Campo ${atipo.codigo}`;
          return (
            <div key={atipo.codigo} style={{ margin: '16px 0' }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>{label}:</strong>
              <div
                style={{ textAlign: 'justify' }}
                dangerouslySetInnerHTML={{ __html: raw }}
              />
            </div>
          );
        })}

        {/* ── Signature placeholder ────────────────────────── */}
        <div style={{
          marginTop: 48,
          textAlign: 'center',
          padding: '10px 0',
          borderTop: '1px solid #ddd',
          fontSize: 11,
          color: '#999',
          fontStyle: 'italic',
          fontFamily: 'sans-serif',
        }}>
          [ assinatura digital ICP-Brasil ]
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function DocumentoDetalhePage() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const service = useInject('DocumentosService');
  const tipoDocService = useInject('TipoDocumentoService');
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [doc, setDoc] = useState<DocumentoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewAnexo, setPreviewAnexo] = useState<DocumentoDetalheAnexo | null>(null);
  const [atributosTipo, setAtributosTipo] = useState<AtributoTipoDocumento[]>([]);
  const [atributosDoc, setAtributosDoc] = useState<AtributoDocumento[]>([]);
  const [tramitarOpen, setTramitarOpen] = useState(false);
  const [tramitacaoAberta, setTramitacaoAberta] = useState<TramitacaoItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Carrega tramitação aberta (última em andamento) sempre que o doc mudar
  const reloadTramitacaoAberta = (codigo: number) => {
    service.listTramitacoes(codigo)
      .then(list => {
        const aberta = [...list].reverse().find(
          t => t.flagAceite !== 1 && t.flagRecusada !== 1 && t.flagCancelada !== 1,
        ) ?? null;
        setTramitacaoAberta(aberta);
      })
      .catch(() => setTramitacaoAberta(null));
  };

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
      .then(res => {
        if (cancelled) return;
        setDoc(res);
        reloadTramitacaoAberta(res.codigo);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const e = err as { response?: { status?: number; data?: { message?: string } } };
        if (e.response?.status === 404) setError('Documento não encontrado.');
        else setError(e.response?.data?.message ?? 'Erro ao carregar documento.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [codigo, service]);

  // Load custom fields once doc is ready
  useEffect(() => {
    if (!doc?.tipoDocumentoCodigo) return;
    let cancelled = false;
    Promise.allSettled([
      tipoDocService.findAtributos(String(doc.tipoDocumentoCodigo)),
      service.findAtributos(doc.codigo),
    ]).then(([tiposRes, valsRes]) => {
      if (cancelled) return;
      setAtributosTipo(tiposRes.status === 'fulfilled' ? tiposRes.value : []);
      setAtributosDoc(valsRes.status === 'fulfilled' ? valsRes.value : []);
    });
    return () => { cancelled = true; };
  }, [doc?.codigo, doc?.tipoDocumentoCodigo]);

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

      {tramitarOpen && (
        <TramitarDialog
          doc={doc}
          service={service}
          onClose={() => setTramitarOpen(false)}
          onSuccess={() => {
            setTramitarOpen(false);
            setActiveTab('flow');
            setSuccessMsg('Tramitação incluída com sucesso.');
            // Reload doc + tramitação aberta
            service.findById(doc.codigo).then(setDoc).catch(() => {});
            reloadTramitacaoAberta(doc.codigo);
          }}
        />
      )}

      {successMsg && (
        <TramitarSuccessDialog message={successMsg} onClose={() => setSuccessMsg(null)} />
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

          {/* Banner TRAMITAÇÃO EM ABERTO */}
          {tramitacaoAberta && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, padding: '12px 16px', marginBottom: 14,
              background: 'linear-gradient(90deg, oklch(0.96 0.04 60), oklch(0.97 0.02 60))',
              border: '1px solid oklch(0.85 0.08 60)',
              borderLeft: '4px solid oklch(0.65 0.18 60)',
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#92400e' }}>
                  Tramitação em aberto
                </span>
                <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                  Tramitado para <strong>{tramitacaoAberta.destinoNome ?? tramitacaoAberta.destinoSigla ?? '—'}</strong>
                  {tramitacaoAberta.dataEnvio && (
                    <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>
                      {' '}em {new Date(tramitacaoAberta.dataEnvio).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              </div>
              <a
                href={service.grtUrl(doc.codigo, tramitacaoAberta.codigo)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 34, padding: '0 14px',
                  background: '#fff', border: '1px solid oklch(0.65 0.18 60)',
                  borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                  color: '#92400e', textDecoration: 'none', cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                📄 Gerar GRT
              </a>
            </div>
          )}

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

              {/* Campos customizados do tipo de documento */}
              {atributosTipo.length > 0 && (
                <div className={s.card}>
                  <div className={s.cardHeader}>
                    <h3 className={s.cardTitle}>Campos do documento</h3>
                  </div>
                  {groupByAba(atributosTipo).map(([aba, items]) => (
                    <div key={aba || '__root__'}>
                      {aba && (
                        <p style={{
                          fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.08em', color: 'var(--text-3)',
                          margin: '14px 0 6px',
                        }}>
                          {aba}
                        </p>
                      )}
                      {items.map(atipo => {
                        const adoc = atributosDoc.find(a => a.codigoAtributoTipo === atipo.codigo);
                        const isHtml = atipo.tipo === 7;
                        const rawVal = extractAtributoVal(atipo, adoc);

                        if (isHtml) {
                          return (
                            <div key={atipo.codigo} className={s.htmlField}>
                              <span className={s.htmlFieldLabel}>
                                {atipo.label ?? atipo.nome ?? `Campo ${atipo.codigo}`}
                              </span>
                              {rawVal ? (
                                <div
                                  className={s.htmlContent}
                                  dangerouslySetInnerHTML={{ __html: rawVal }}
                                />
                              ) : (
                                <span style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>—</span>
                              )}
                            </div>
                          );
                        }

                        const val = formatAtributoDisplay(atipo, adoc);
                        return (
                          <div key={atipo.codigo} className={s.detailRow}
                               style={{ alignItems: 'flex-start', paddingTop: 6, paddingBottom: 6 }}>
                            <span className={s.detailKey} style={{ paddingTop: 1 }}>
                              {atipo.label ?? atipo.nome ?? `Campo ${atipo.codigo}`}
                            </span>
                            <span className={s.detailVal} style={{
                              color: val === '—' ? 'var(--text-3)' : undefined,
                              fontStyle: val === '—' ? 'italic' : undefined,
                            }}>
                              {val}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
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

          {/* Aba Documento — prévia formatada */}
          {activeTab === 'document' && (
            <DocumentoPreview
              doc={doc}
              atributosTipo={atributosTipo}
              atributosDoc={atributosDoc}
            />
          )}

          {/* Aba Tramitação */}
          {activeTab === 'flow' && (
            <div className={s.card}>
              <div className={s.cardHeader}>
                <h3 className={s.cardTitle}>Histórico de Tramitação</h3>
                <button className={s.tab} style={{ fontSize: 12.5, padding: '4px 10px', borderBottom: 'none' }} onClick={() => setTramitarOpen(true)}>
                  ↗ Tramitar
                </button>
              </div>
              <TramitacoesTab docId={doc.codigo} service={service} />
            </div>
          )}

          {activeTab === 'comments' && (
            <ComentariosTab docId={doc.codigo} service={service} />
          )}

          {activeTab !== 'overview' && activeTab !== 'anexos' && activeTab !== 'comments' && activeTab !== 'document' && activeTab !== 'flow' && (
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
            <button className={s.btnSecondary} onClick={() => setTramitarOpen(true)}><Icon.arrow /> Tramitar para...</button>
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
