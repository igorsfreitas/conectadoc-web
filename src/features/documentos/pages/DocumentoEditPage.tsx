import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInject } from '../../../infra/hooks/inject';
import type { AtributoTipoDocumento } from '../../tipo-documento/models/tipo-documento.model';
import type { AtributoDocumento, DocumentoDetalhe } from '../models/documento.model';
import { RichEditor } from '../../../infra/components/rich-editor';

// ── Multi-valor splitter ─────────────────────────────────────────────────────
function parseMultiValor(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  for (const sep of ['|', ';', '\n', '\r']) {
    if (trimmed.includes(sep)) return trimmed.split(sep).map(s => s.trim()).filter(Boolean);
  }
  if (/\. /.test(trimmed)) {
    const parts: string[] = [];
    const tokens = trimmed.split(/\s+/);
    let buf = '';
    for (const tok of tokens) {
      buf = buf ? `${buf} ${tok}` : tok;
      if (tok.endsWith('.')) { parts.push(buf); buf = ''; }
    }
    if (buf) parts.push(buf);
    if (parts.length > 1) return parts;
  }
  return [trimmed];
}

// ── Format atributo value for preview row ────────────────────────────────────
function formatAtributoValue(atributo: AtributoTipoDocumento, raw: string): string {
  if (!raw) return '';
  const t = atributo.tipo;
  if (t === 11) return raw === '1' ? 'Sim' : 'Não';
  if (t === 2) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : raw;
  }
  if (t === 7) {
    const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain.length > 80 ? `${plain.slice(0, 77)}…` : plain;
  }
  return raw.length > 100 ? `${raw.slice(0, 97)}…` : raw;
}

// ── Shared styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px', boxSizing: 'border-box',
  border: '1px solid var(--border, #d1d5db)', borderRadius: 8,
  fontSize: 14, color: 'var(--text, #111)', background: '#fff',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  width: '100%', height: 42, padding: '0 12px',
  border: '1px solid var(--border, #d1d5db)', borderRadius: 8,
  fontSize: 14, color: 'var(--text, #111)', background: '#fff',
  cursor: 'pointer', outline: 'none',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
};

// ── Pencil icon ──────────────────────────────────────────────────────────────
function IconPencil({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2.2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// ── FieldRow ─────────────────────────────────────────────────────────────────
function FieldRow({
  label, value, placeholder = 'Clique para preencher', required, active, onClick,
}: {
  label: string; value: string; placeholder?: string;
  required?: boolean; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 220px) 1fr 32px',
        gap: 16, alignItems: 'center', width: '100%',
        padding: '12px 16px',
        background: active ? 'oklch(0.96 0.04 250)' : 'transparent',
        border: 'none', borderBottom: '1px solid var(--border, #e5e7eb)',
        cursor: 'pointer', textAlign: 'left', transition: 'background .12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2, #f9fafb)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-2, #374151)' }}>
        {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
      </div>
      <div style={{
        fontSize: 14,
        color: value ? 'var(--text, #111)' : 'var(--text-3, #9ca3af)',
        fontStyle: value ? 'normal' : 'italic',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value || placeholder}
      </div>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3, #9ca3af)' }}>
        <IconPencil size={15} />
      </span>
    </button>
  );
}

// ── EditFieldDialog ──────────────────────────────────────────────────────────
function EditFieldDialog({
  atributo, initialValue, onSave, onClose,
}: {
  atributo: AtributoTipoDocumento | null;
  initialValue: string;
  onSave: (v: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => { setDraft(initialValue); }, [initialValue, atributo?.codigo]);

  useEffect(() => {
    if (!atributo) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [atributo, onClose]);

  if (!atributo) return null;
  const label = atributo.label ?? atributo.nome ?? `Campo ${atributo.codigo}`;
  const tipo  = atributo.tipo;

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--brand-600, #2563eb)');
  const blurBorder  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = 'var(--border, #d1d5db)');

  function renderEditor() {
    if (tipo === 11) {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-2, #374151)', cursor: 'pointer' }}>
          <input type="checkbox" checked={draft === '1'} onChange={e => setDraft(e.target.checked ? '1' : '0')} style={{ width: 18, height: 18, cursor: 'pointer' }} />
          Marcar como verdadeiro
        </label>
      );
    }
    if (tipo === 2) {
      return (
        <input type="date" value={draft} onChange={e => setDraft(e.target.value)}
          autoFocus onFocus={focusBorder} onBlur={blurBorder} style={inputStyle} />
      );
    }
    if (tipo === 7) {
      return (
        <RichEditor value={draft} onChange={setDraft} minHeight={300}
          placeholder={`Digite ${label.toLowerCase()}...`} />
      );
    }
    if (tipo === 8 && atributo?.multiploValor) {
      const opts = parseMultiValor(atributo.multiploValor);
      return (
        <select value={draft} onChange={e => setDraft(e.target.value)}
          autoFocus onFocus={focusBorder} onBlur={blurBorder} style={selectStyle}>
          <option value="">Selecione…</option>
          {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (tipo === 6 || tipo === 4 || tipo === 5) {
      return (
        <input type="number" value={draft} onChange={e => setDraft(e.target.value)}
          autoFocus onFocus={focusBorder} onBlur={blurBorder} style={inputStyle} />
      );
    }
    if (draft.length > 60 || tipo === 15) {
      return (
        <textarea value={draft} onChange={e => setDraft(e.target.value)} autoFocus rows={6}
          onFocus={focusBorder} onBlur={blurBorder}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical',
            border: '1px solid var(--border, #d1d5db)', borderRadius: 8,
            padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
            lineHeight: 1.5, outline: 'none', color: 'var(--text, #111)',
            textTransform: tipo === 16 ? 'uppercase' : 'none',
          }}
        />
      );
    }
    return (
      <input type="text" value={draft} onChange={e => setDraft(e.target.value)}
        autoFocus onFocus={focusBorder} onBlur={blurBorder}
        style={{ ...inputStyle, textTransform: tipo === 16 ? 'uppercase' : 'none' } as React.CSSProperties}
      />
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, background: '#fff', borderRadius: 14,
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3, #9ca3af)', marginBottom: 4 }}>
            Editar campo
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text, #111)' }}>{label}</div>
        </div>
        <div style={{ padding: 24 }}>{renderEditor()}</div>
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--border, #e5e7eb)',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ minWidth: 100 }}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(draft); onClose(); }} style={{ minWidth: 100 }}>
            ✓ Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers to extract value from AtributoDocumento ──────────────────────────
function extractAtributoValue(adoc: AtributoDocumento, tipo: number | null): string {
  if (tipo === 2 && adoc.valorData) {
    // Strip time component — input[type=date] needs YYYY-MM-DD
    return adoc.valorData.split('T')[0] ?? adoc.valorData;
  }
  if ((tipo === 5 || tipo === 6) && adoc.valorFloat != null) {
    return adoc.valorFloat;
  }
  return adoc.valor ?? '';
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function DocumentoEditPage() {
  const { codigo } = useParams();
  const navigate   = useNavigate();
  const docService      = useInject('DocumentosService');
  const tipoDocService  = useInject('TipoDocumentoService');

  const [doc,      setDoc]      = useState<DocumentoDetalhe | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Form fields
  const [resumo,          setResumo]          = useState('');
  const [despacho,        setDespacho]        = useState('');
  const [flagConfidencial, setFlagConfidencial] = useState(false);
  const [editingDespacho, setEditingDespacho] = useState(false);

  // Atributos
  const [atributos,       setAtributos]       = useState<AtributoTipoDocumento[]>([]);
  const [atributoValues,  setAtributoValues]  = useState<Record<number, string>>({});
  const [editingAtributo, setEditingAtributo] = useState<AtributoTipoDocumento | null>(null);

  const docId = Number(codigo);

  // Load doc + atributo types + atributo values in parallel
  useEffect(() => {
    if (!codigo || Number.isNaN(docId)) {
      setError('Código inválido.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        // 1. Load document base
        const d = await docService.findById(docId);
        if (cancelled) return;
        setDoc(d);
        setResumo(d.resumo ?? '');
        setDespacho(d.despacho ?? '');
        setFlagConfidencial(d.flagConfidencial === 1);

        // 2. In parallel: atributo type definitions + existing values
        const [tipos, valores] = await Promise.all([
          d.tipoDocumentoCodigo
            ? tipoDocService.findAtributos(String(d.tipoDocumentoCodigo))
            : Promise.resolve([]),
          docService.findAtributos(docId),
        ]);
        if (cancelled) return;

        const active: AtributoTipoDocumento[] = (tipos as AtributoTipoDocumento[]).filter(
          (a: AtributoTipoDocumento) => !a.flagExcluido,
        );
        setAtributos(active);

        // Build initial value map: codigoAtributoTipo → value string
        const valMap: Record<number, string> = {};
        for (const a of active) { valMap[a.codigo] = ''; }
        for (const v of valores as AtributoDocumento[]) {
          const tipo = active.find(a => a.codigo === v.codigoAtributoTipo);
          valMap[v.codigoAtributoTipo] = extractAtributoValue(v, tipo?.tipo ?? null);
        }
        setAtributoValues(valMap);
      } catch (e: unknown) {
        if (cancelled) return;
        const err = e as { response?: { data?: { message?: string } } };
        setError(err.response?.data?.message ?? 'Erro ao carregar documento.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [docId]);

  const backPath = `/documentos/${docId}`;

  const handleSave = useCallback(async () => {
    if (saving || !doc) return;
    setSaving(true);
    setError(null);
    try {
      await docService.atualizar(docId, {
        resumo:          resumo.trim() || undefined,
        despacho:        despacho.trim() || undefined,
        flagConfidencial: flagConfidencial ? 1 : 0,
      });

      const filledAtributos = atributos
        .filter(a => atributoValues[a.codigo]?.trim())
        .map(a => ({
          codigoAtributoTipo: a.codigo,
          valor: atributoValues[a.codigo] ?? null,
        }));

      if (filledAtributos.length > 0) {
        await docService.upsertAtributos(docId, { atributos: filledAtributos });
      }

      navigate(backPath, { replace: true });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? 'Erro ao salvar alterações.');
      setSaving(false);
    }
  }, [saving, doc, docId, resumo, despacho, flagConfidencial, atributos, atributoValues, navigate, backPath, docService]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: 48, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        Carregando documento…
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}
          onClick={() => navigate(-1)}>
          <IconBack /> Voltar
        </button>
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--danger-700)', fontSize: 13 }}>{error}</div>
      </div>
    );
  }

  const numero     = doc?.numeroNetdoc ?? doc?.numero ?? String(docId);
  const tipoNome   = doc?.tipoDocumentoNome ?? 'Documento';
  const totalFields  = atributos.length;
  const filledFields = atributos.filter(a => (atributoValues[a.codigo] ?? '').trim()).length;
  const progresso    = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text, #111)', margin: 0 }}>
            Editar documento
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3, #6b7280)', margin: '4px 0 0' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--text-2)' }}>
              {numero}
            </span>
            {' · '}{tipoNome}
          </p>
        </div>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate(backPath)}
        >
          <IconBack /> Voltar
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Left sidebar ────────────────────────────────────────── */}
        <aside style={{
          background: '#fff', border: '1px solid var(--border, #e5e7eb)',
          borderRadius: 14, padding: '20px 22px', position: 'sticky', top: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3, #9ca3af)', marginBottom: 6 }}>
            Documento
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text, #111)', marginBottom: 18, lineHeight: 1.3 }}>
            {tipoNome}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, marginBottom: 18 }}>
            <SummaryLine label="NetDoc"  value={numero}    mono />
            <SummaryLine label="Origem"  value={doc?.segmentoOrigemSigla ?? '—'} />
            <SummaryLine label="Criação" value={doc?.dataCriacao ? new Date(doc.dataCriacao).toLocaleDateString('pt-BR') : '—'} />
          </div>

          {totalFields > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '0 0 14px' }} />
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3, #9ca3af)', marginBottom: 8 }}>
                Progresso
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-2)' }}>Campos preenchidos</span>
                <span style={{ fontWeight: 600 }}>{filledFields}/{totalFields}</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface-2, #f3f4f6)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${progresso}%`, height: '100%', background: 'var(--brand-600, #2563eb)', transition: 'width .2s' }} />
              </div>
            </>
          )}

          {/* Confidencial checkbox */}
          <div style={{ height: 1, background: 'var(--border)', margin: '18px 0 14px' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={flagConfidencial}
              onChange={e => setFlagConfidencial(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            Documento sigiloso 🔒
          </label>

          {/* Action buttons */}
          <div style={{ height: 1, background: 'var(--border)', margin: '18px 0 14px' }} />
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 8 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Salvando…' : '✓ Salvar alterações'}
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => navigate(backPath)}
            disabled={saving}
          >
            Cancelar
          </button>
        </aside>

        {/* ── Right content card ───────────────────────────────────── */}
        <section style={{ background: '#fff', border: '1px solid var(--border, #e5e7eb)', borderRadius: 14, overflow: 'hidden' }}>

          {/* Resumo (always visible — inline textarea) */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
              Resumo / Assunto
            </div>
            <textarea
              value={resumo}
              onChange={e => setResumo(e.target.value)}
              placeholder="Descreva o assunto deste documento..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                border: '1px solid var(--border, #d1d5db)', borderRadius: 8,
                padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
                lineHeight: 1.5, outline: 'none', color: 'var(--text, #111)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--brand-600, #2563eb)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border, #d1d5db)')}
            />
          </div>

          {/* Despacho (FieldRow → opens RichEditor dialog) */}
          <FieldRow
            label="Despacho"
            value={despacho ? despacho.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100) : ''}
            placeholder="Clique para adicionar despacho"
            active={editingDespacho}
            onClick={() => setEditingDespacho(true)}
          />

          {/* Atributo field rows */}
          {atributos.length > 0 && (
            <div>
              <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                Campos do tipo de documento
              </div>
              {atributos.map(a => {
                const raw = atributoValues[a.codigo] ?? '';
                return (
                  <FieldRow
                    key={a.codigo}
                    label={a.label ?? a.nome ?? `Campo ${a.codigo}`}
                    value={formatAtributoValue(a, raw)}
                    required={a.flagCadastraComNulo === 0}
                    active={editingAtributo?.codigo === a.codigo}
                    onClick={() => setEditingAtributo(a)}
                  />
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10,
            padding: '14px 22px', borderTop: '1px solid var(--border, #e5e7eb)',
            background: 'var(--surface-2, #f9fafb)',
          }}>
            <button className="btn btn-secondary" onClick={() => navigate(backPath)} disabled={saving}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: 160 }}
            >
              {saving ? 'Salvando…' : '✓ Salvar alterações'}
            </button>
          </div>
        </section>
      </div>

      {/* Atributo edit dialog */}
      <EditFieldDialog
        atributo={editingAtributo}
        initialValue={editingAtributo ? (atributoValues[editingAtributo.codigo] ?? '') : ''}
        onSave={v => editingAtributo && setAtributoValues(prev => ({ ...prev, [editingAtributo.codigo]: v }))}
        onClose={() => setEditingAtributo(null)}
      />

      {/* Despacho edit dialog (RichEditor) */}
      {editingDespacho && (
        <div
          onClick={() => setEditingDespacho(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 720, background: '#fff', borderRadius: 14,
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border, #e5e7eb)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-3, #9ca3af)', marginBottom: 4 }}>
                Editar campo
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text, #111)' }}>Despacho</div>
            </div>
            <div style={{ padding: 24 }}>
              <RichEditor value={despacho} onChange={setDespacho} minHeight={320} placeholder="Redija o despacho..." />
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border, #e5e7eb)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setEditingDespacho(false)} style={{ minWidth: 100 }}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setEditingDespacho(false)} style={{ minWidth: 100 }}>✓ Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function SummaryLine({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--text-3, #6b7280)' }}>{label}</span>
      <span style={{
        color: 'var(--text, #111)',
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        fontWeight: mono ? 500 : 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  );
}
