import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInject } from "../../../infra/hooks/inject";
import { DraftBanner, useFormDraft } from "../../../infra/hooks/use-form-draft";
import { afinzAppPaths } from "../../../infra/router/paths/afinz_app";
import { TipoDocumentoSimples } from "../models/documento.model";

const DRAFT_KEY = "form-draft:novo-documento";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Segmento { codigo: number; nome: string | null; sigla: string | null; }
interface Assunto  { codigo: number; descricao: string | null; }

// ── Helpers ───────────────────────────────────────────────────────────────────
function SearchSelect({
  label,
  placeholder,
  items,
  value,
  onSelect,
  renderItem,
  renderSelected,
  loading,
  onSearch,
}: {
  label: string;
  placeholder: string;
  items: { codigo: number | string; label: string }[];
  value: number | string | null;
  onSelect: (codigo: number | string) => void;
  renderItem?: (item: { codigo: number | string; label: string }) => React.ReactNode;
  renderSelected?: (item: { codigo: number | string; label: string }) => React.ReactNode;
  loading?: boolean;
  onSearch?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find(i => i.codigo == value);

  const filtered = q
    ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase()))
    : items;

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div style={{ marginBottom: 16 }} ref={ref}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2, #374151)", marginBottom: 4 }}>
        {label}
      </label>
      <div
        style={{
          border: "1px solid var(--border, #e5e7eb)", borderRadius: 8, background: "#fff",
          minHeight: 38, padding: "6px 10px", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between", fontSize: 13,
          color: selected ? "var(--text, #111)" : "var(--text-3, #9ca3af)",
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected ? (renderSelected ? renderSelected(selected) : selected.label) : placeholder}</span>
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>▾</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", zIndex: 100, background: "#fff",
          border: "1px solid var(--border, #e5e7eb)", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,.1)", minWidth: 300, maxWidth: 480,
          maxHeight: 280, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)" }}>
            <input
              autoFocus
              className="input"
              value={q}
              onChange={e => { setQ(e.target.value); onSearch?.(e.target.value); }}
              placeholder="Buscar..."
              style={{ height: 32, fontSize: 13, width: "100%" }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-3)" }}>Carregando…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-3)" }}>Nenhum resultado.</div>
            ) : filtered.map(item => (
              <div
                key={item.codigo}
                onClick={() => { onSelect(item.codigo); setOpen(false); setQ(""); }}
                style={{
                  padding: "9px 14px", fontSize: 13, cursor: "pointer",
                  background: item.codigo == value ? "oklch(0.965 0.008 250)" : undefined,
                  color: item.codigo == value ? "var(--brand-600, #2563eb)" : "var(--text, #111)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2, #f9fafb)")}
                onMouseLeave={e => (e.currentTarget.style.background = item.codigo == value ? "oklch(0.965 0.008 250)" : "")}
              >
                {renderItem ? renderItem(item) : item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function NovoDocumentoPage() {
  const navigate = useNavigate();
  const docService = useInject("DocumentosService");
  const assuntosService = useInject("AssuntosService");
  const uaService = useInject("UnidadeAdministrativaService");

  const [tipos, setTipos] = useState<TipoDocumentoSimples[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);

  const [codigoTipo, setCodigoTipo] = useState<number | null>(null);
  const [codigoSegmento, setCodigoSegmento] = useState<number | null>(null);
  const [codigoAssunto, setCodigoAssunto] = useState<number | null>(null);
  const [resumo, setResumo] = useState("");
  const [despacho, setDespacho] = useState("");
  const [confidencial, setConfidencial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formValues = { codigoTipo, codigoSegmento, codigoAssunto, resumo, despacho, confidencial };
  const draft = useFormDraft(DRAFT_KEY, formValues, {
    isEmpty: s => s.codigoTipo === null && !s.resumo.trim(),
  });

  function handleRestoreDraft() {
    const saved = draft.restoreDraft();
    if (!saved) return;
    if (saved.codigoTipo !== undefined)    setCodigoTipo(saved.codigoTipo);
    if (saved.codigoSegmento !== undefined) setCodigoSegmento(saved.codigoSegmento);
    if (saved.codigoAssunto !== undefined)  setCodigoAssunto(saved.codigoAssunto);
    if (saved.resumo !== undefined)         setResumo(saved.resumo);
    if (saved.despacho !== undefined)       setDespacho(saved.despacho);
    if (saved.confidencial !== undefined)   setConfidencial(saved.confidencial);
  }

  useEffect(() => {
    docService.findTiposInterno().then(setTipos).catch(() => {});
    uaService.findAllSimple().then((data: Segmento[]) => setSegmentos(data)).catch(() => {});
    assuntosService.findAll(1, 200).then((r: { data: Assunto[] }) => setAssuntos(r.data)).catch(() => {});
  }, []);

  const tipoItems = tipos.map(t => ({ codigo: t.codigo, label: t.nome ?? t.sigla ?? String(t.codigo) }));
  const segItems  = segmentos.map(s => ({ codigo: s.codigo, label: `${s.sigla ?? ""} — ${s.nome ?? ""}` }));
  const assItems  = assuntos.map(a => ({ codigo: a.codigo, label: a.descricao ?? String(a.codigo) }));

  const canSubmit = codigoTipo !== null && resumo.trim().length > 0 && !saving;

  async function handleSubmit() {
    if (!canSubmit || codigoTipo === null) return;
    setSaving(true);
    setError(null);
    try {
      await docService.criar({
        codigoTipoDocumento: codigoTipo,
        codigoAssunto: codigoAssunto ?? undefined,
        codigoSegmentoDestino: codigoSegmento ?? undefined,
        resumo: resumo.trim(),
        despacho: despacho.trim() || undefined,
        flagConfidencial: confidencial ? 1 : 0,
      });
      draft.clearDraft();
      navigate(afinzAppPaths.caixaEntrada.asRoute!);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erro ao criar documento.");
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: 12, height: 30, marginBottom: 14 }}
          onClick={() => navigate(-1)}
        >
          ← Voltar
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text, #111)", margin: 0 }}>
          Novo Documento
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3, #6b7280)", margin: "4px 0 0" }}>
          Preencha as informações do documento a ser criado
        </p>
      </div>

      {/* Draft restore banner */}
      {draft.hasDraft && draft.draftSavedAt && (
        <DraftBanner
          savedAt={draft.draftSavedAt}
          onRestore={handleRestoreDraft}
          onDiscard={draft.dismissDraft}
        />
      )}

      {/* Form card */}
      <div style={{
        background: "#fff", border: "1px solid var(--border, #e5e7eb)",
        borderRadius: 12, padding: "28px 32px",
      }}>
        {/* Tipo */}
        <div style={{ position: "relative" }}>
          <SearchSelect
            label="Tipo de Documento *"
            placeholder="Selecione o tipo..."
            items={tipoItems}
            value={codigoTipo}
            onSelect={v => setCodigoTipo(Number(v))}
          />
        </div>

        {/* Para (destino) */}
        <div style={{ position: "relative" }}>
          <SearchSelect
            label="Para (destino)"
            placeholder="Selecione a unidade de destino..."
            items={segItems}
            value={codigoSegmento}
            onSelect={v => setCodigoSegmento(Number(v))}
          />
        </div>

        {/* Assunto */}
        <div style={{ position: "relative" }}>
          <SearchSelect
            label="Assunto"
            placeholder="Selecione o assunto..."
            items={assItems}
            value={codigoAssunto}
            onSelect={v => setCodigoAssunto(Number(v))}
          />
        </div>

        {/* Resumo / Texto */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2, #374151)", marginBottom: 4 }}>
            Texto / Resumo *
          </label>
          <textarea
            value={resumo}
            onChange={e => setResumo(e.target.value)}
            placeholder="Descreva o conteúdo do documento..."
            rows={6}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              border: "1px solid var(--border, #e5e7eb)", borderRadius: 8,
              padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
              lineHeight: 1.6, outline: "none", color: "var(--text, #111)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--brand-600, #2563eb)")}
            onBlur={e => (e.target.style.borderColor = "var(--border, #e5e7eb)")}
          />
          <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right", marginTop: 2 }}>
            {resumo.length} / 2000
          </div>
        </div>

        {/* Despacho */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2, #374151)", marginBottom: 4 }}>
            Despacho / Observação
          </label>
          <textarea
            value={despacho}
            onChange={e => setDespacho(e.target.value)}
            placeholder="Instrução ou observação de envio (opcional)..."
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              border: "1px solid var(--border, #e5e7eb)", borderRadius: 8,
              padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
              lineHeight: 1.6, outline: "none", color: "var(--text, #111)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--brand-600, #2563eb)")}
            onBlur={e => (e.target.style.borderColor = "var(--border, #e5e7eb)")}
          />
        </div>

        {/* Confidencial */}
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id="confidencial"
            type="checkbox"
            checked={confidencial}
            onChange={e => setConfidencial(e.target.checked)}
            style={{ cursor: "pointer", width: 15, height: 15 }}
          />
          <label htmlFor="confidencial" style={{ fontSize: 13, color: "var(--text-2, #374151)", cursor: "pointer" }}>
            🔒 Documento confidencial
          </label>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16, padding: "10px 14px", borderRadius: 8,
            background: "#fef2f2", border: "1px solid #fecaca",
            fontSize: 13, color: "#dc2626",
          }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ minWidth: 140 }}
          >
            {saving ? "Criando…" : "Criar Documento"}
          </button>
        </div>
      </div>
    </div>
  );
}
