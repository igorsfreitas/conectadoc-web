import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtributoTipoDocumento } from "../../tipo-documento/models/tipo-documento.model";
import { useInject } from "../../../infra/hooks/inject";
import { afinzAppPaths } from "../../../infra/router/paths/afinz_app";
import { CreateDocumentoResponse, TipoDocumentoSimples } from "../models/documento.model";
import { RichEditor } from "../../../infra/components/rich-editor";

// ── Multi-valor splitter — legacy data uses several different separators ──
function parseMultiValor(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  for (const sep of ["|", ";", "\n", "\r"]) {
    if (trimmed.includes(sep)) {
      return trimmed.split(sep).map(s => s.trim()).filter(Boolean);
    }
  }
  // No explicit separator — split by ". " (preserves trailing dot in each token)
  // Pattern matches the legacy "Sr. Sra. Srta. Dr. Dra. Ilmo Sr. Ilma Sra." format
  if (/\. /.test(trimmed)) {
    const parts: string[] = [];
    const tokens = trimmed.split(/\s+/);
    let buf = "";
    for (const tok of tokens) {
      buf = buf ? `${buf} ${tok}` : tok;
      if (tok.endsWith(".")) { parts.push(buf); buf = ""; }
    }
    if (buf) parts.push(buf);
    if (parts.length > 1) return parts;
  }
  return [trimmed];
}

type Category = "interno" | "externo" | "minuta" | "processo";

interface Segmento { codigo: number; nome: string | null; sigla: string | null; }

// ── Stepper ───────────────────────────────────────────────────────────────────
const STEPS = ["Tipo", "Metadados", "Conteúdo", "Tramitação"];

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done   = n < current;
        const active = n === current;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
                background: done || active ? "var(--brand-600, #2563eb)" : "transparent",
                color: done || active ? "#fff" : "var(--text-3, #9ca3af)",
                border: done || active ? "none" : "2px solid var(--border, #d1d5db)",
              }}>
                {done ? "✓" : n}
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--text, #111)" : done ? "var(--text-2, #374151)" : "var(--text-3, #9ca3af)",
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 1, margin: "0 12px",
                background: done ? "var(--brand-600, #2563eb)" : "var(--border, #d1d5db)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const fieldLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 500,
  color: "var(--text-2, #374151)", marginBottom: 6, display: "block",
};

const selectStyle: React.CSSProperties = {
  width: "100%", height: 42, padding: "0 12px",
  border: "1px solid var(--border, #d1d5db)", borderRadius: 8,
  fontSize: 14, color: "var(--text, #111)", background: "#fff",
  cursor: "pointer", outline: "none",
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 36,
};

const inputStyle: React.CSSProperties = {
  width: "100%", height: 42, padding: "0 12px", boxSizing: "border-box",
  border: "1px solid var(--border, #d1d5db)", borderRadius: 8,
  fontSize: 14, color: "var(--text, #111)", background: "#fff",
  outline: "none",
};

// ── Category cards ────────────────────────────────────────────────────────────
const CATEGORIES: { id: Category; label: string; desc: string; color: string; bg: string; icon: string }[] = [
  { id: "interno",  label: "Interno",  desc: "Comunicação Interna, Memorando, Ata",          color: "#3b82f6", bg: "#eff6ff", icon: "📄" },
  { id: "externo",  label: "Externo",  desc: "Ofício, Carta, Resposta a entidade externa",   color: "#ef4444", bg: "#fef2f2", icon: "📮" },
  { id: "minuta",   label: "Minuta",   desc: "Rascunho compartilhado, sem tramitação ainda", color: "#f59e0b", bg: "#fffbeb", icon: "✏️" },
  { id: "processo", label: "Processo", desc: "Pasta com múltiplos documentos e fluxo",       color: "#10b981", bg: "#f0fdf4", icon: "📁" },
];

// ── Pencil icon ───────────────────────────────────────────────────────────────
function IconPencil({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

// ── Format atributo value for preview row display ─────────────────────────────
function formatAtributoValue(atributo: AtributoTipoDocumento, raw: string): string {
  if (!raw) return "";
  const t = atributo.tipo;
  if (t === 11) return raw === "1" ? "Sim" : "Não";
  if (t === 2) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : raw;
  }
  if (t === 7) {
    // strip HTML tags for preview
    const plain = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return plain.length > 80 ? `${plain.slice(0, 77)}…` : plain;
  }
  return raw.length > 100 ? `${raw.slice(0, 97)}…` : raw;
}

// ── FieldRow — single row in the right card ───────────────────────────────────
function FieldRow({
  label,
  value,
  placeholder = "Clique para preencher",
  required,
  active,
  onClick,
}: {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(140px, 220px) 1fr 32px",
        gap: 16,
        alignItems: "center",
        width: "100%",
        padding: "12px 16px",
        background: active ? "oklch(0.96 0.04 250)" : "transparent",
        border: "none",
        borderBottom: "1px solid var(--border, #e5e7eb)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background .12s",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface-2, #f9fafb)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-2, #374151)" }}>
        {label}{required && <span style={{ color: "#ef4444" }}>*</span>}
      </div>
      <div style={{
        fontSize: 14,
        color: value ? "var(--text, #111)" : "var(--text-3, #9ca3af)",
        fontStyle: value ? "normal" : "italic",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {value || placeholder}
      </div>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3, #9ca3af)" }}>
        <IconPencil size={15} />
      </span>
    </button>
  );
}

// ── EditFieldDialog — opens an editor matching the atributo's tipo ────────────
function EditFieldDialog({
  atributo,
  initialValue,
  onSave,
  onClose,
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [atributo, onClose]);

  if (!atributo) return null;
  const label = atributo.label ?? atributo.nome ?? `Campo ${atributo.codigo}`;
  const tipo  = atributo.tipo;

  const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = "var(--brand-600, #2563eb)");
  const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = "var(--border, #d1d5db)");

  function renderEditor() {
    if (tipo === 11) {
      return (
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--text-2, #374151)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={draft === "1"}
            onChange={e => setDraft(e.target.checked ? "1" : "0")}
            style={{ width: 18, height: 18, cursor: "pointer" }}
          />
          Marcar como verdadeiro
        </label>
      );
    }
    if (tipo === 2) {
      return (
        <input
          type="date"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          autoFocus
          onFocus={focusBorder}
          onBlur={blurBorder}
          style={inputStyle}
        />
      );
    }
    if (tipo === 7) {
      return (
        <RichEditor
          value={draft}
          onChange={setDraft}
          minHeight={300}
          placeholder={`Digite ${label.toLowerCase()}...`}
        />
      );
    }
    if (tipo === 8 && atributo?.multiploValor) {
      const opts = parseMultiValor(atributo.multiploValor);
      return (
        <select
          value={draft}
          onChange={e => setDraft(e.target.value)}
          autoFocus
          onFocus={focusBorder}
          onBlur={blurBorder}
          style={selectStyle}
        >
          <option value="">Selecione…</option>
          {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }
    if (tipo === 6 || tipo === 4 || tipo === 5) {
      return (
        <input
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          autoFocus
          onFocus={focusBorder}
          onBlur={blurBorder}
          style={inputStyle}
        />
      );
    }
    // default text input — multiline for non-trivial fields
    if (draft.length > 60 || tipo === 15) {
      return (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          autoFocus
          rows={6}
          onFocus={focusBorder}
          onBlur={blurBorder}
          style={{
            width: "100%", boxSizing: "border-box", resize: "vertical",
            border: "1px solid var(--border, #d1d5db)", borderRadius: 8,
            padding: "10px 12px", fontSize: 14, fontFamily: "inherit",
            lineHeight: 1.5, outline: "none", color: "var(--text, #111)",
            textTransform: tipo === 16 ? "uppercase" : "none",
          }}
        />
      );
    }
    return (
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        autoFocus
        onFocus={focusBorder}
        onBlur={blurBorder}
        style={{ ...inputStyle, textTransform: tipo === 16 ? "uppercase" : "none" } as React.CSSProperties}
      />
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(15, 23, 42, 0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 720,
          background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.25)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border, #e5e7eb)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #9ca3af)", marginBottom: 4 }}>
            Editar campo
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text, #111)" }}>{label}</div>
        </div>
        <div style={{ padding: 24 }}>
          {renderEditor()}
        </div>
        <div style={{
          padding: "14px 20px", borderTop: "1px solid var(--border, #e5e7eb)",
          display: "flex", justifyContent: "flex-end", gap: 10,
          fontSize: 12, color: "var(--text-3, #6b7280)",
        }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ minWidth: 100 }}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={() => { onSave(draft); onClose(); }}
            style={{ minWidth: 100, display: "flex", alignItems: "center", gap: 6 }}
          >
            ✓ Salvar
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Page ──────────────────────────────────────────────────────────────────────
export function NovoDocumentoPage() {
  const navigate         = useNavigate();
  const docService       = useInject("DocumentosService");
  const tipoDocService   = useInject("TipoDocumentoService");
  const uaService        = useInject("UnidadeAdministrativaService");

  // Step control
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<Category | null>(null);

  // Data fetched
  const [tipos,     setTipos]     = useState<TipoDocumentoSimples[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);

  // Step 2 fields
  const [codigoTipo,             setCodigoTipo]             = useState<number | null>(null);
  const [codigoSegmentoCriador,  setCodigoSegmentoCriador]  = useState<number | null>(null);
  const [assunto,                setAssunto]                = useState("");
  const [codigoEstado,           setCodigoEstado]           = useState<number>(1);
  const [flagExpedienteImpresso, setFlagExpedienteImpresso] = useState<0 | 1>(0);
  const [flagConfidencial,       setFlagConfidencial]       = useState(false);

  // Step 3 — template atributos from tipo de documento
  const [atributos,      setAtributos]      = useState<AtributoTipoDocumento[]>([]);
  const [atributoValues, setAtributoValues] = useState<Record<number, string>>({});
  const [conteudo,       setConteudo]       = useState("");
  const [editingAtributo, setEditingAtributo] = useState<AtributoTipoDocumento | null>(null);
  const [editingConteudo, setEditingConteudo] = useState(false);

  // Document created
  const [createdDoc, setCreatedDoc] = useState<CreateDocumentoResponse | null>(null);
  const [creating,   setCreating]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (step === 2) {
      docService.findTiposInterno().then(setTipos).catch(() => {});
      uaService.findAllSimple().then((d: Segmento[]) => setSegmentos(d)).catch(() => {});
    }
  }, [step]);

  // Fetch template atributos when entering step 3
  useEffect(() => {
    if (step !== 3 || !codigoTipo) return;
    tipoDocService
      .findAtributos(String(codigoTipo))
      .then((list: AtributoTipoDocumento[]) => {
        const active = list.filter((a: AtributoTipoDocumento) => !a.flagExcluido);
        setAtributos(active);
        // pre-fill with empty strings so inputs are controlled
        const init: Record<number, string> = {};
        active.forEach((a: AtributoTipoDocumento) => { init[a.codigo] = ""; });
        setAtributoValues(init);
      })
      .catch(() => {});
  }, [step, codigoTipo]);

  // Auto-create document when tipo is selected in step 2
  async function handleTipoChange(codigo: number) {
    setCodigoTipo(codigo);
    setCreatedDoc(null);
    setError(null);
    if (!codigo) return;
    setCreating(true);
    try {
      const doc = await docService.criar({ codigoTipoDocumento: codigo });
      setCreatedDoc(doc);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erro ao registrar documento.");
    } finally {
      setCreating(false);
    }
  }

  // Step 2 → 3: save metadata and advance
  async function handleProximoMetadados() {
    if (!createdDoc || saving) return;
    setSaving(true);
    setError(null);
    try {
      await docService.atualizar(createdDoc.codigo, {
        resumo:                 assunto.trim() || undefined,
        codigoEstado,
        flagExpedienteImpresso,
        codigoSegmentoCriador:  codigoSegmentoCriador ?? undefined,
        flagConfidencial:       flagConfidencial ? 1 : 0,
      });
      setStep(3);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erro ao salvar metadados.");
    } finally {
      setSaving(false);
    }
  }

  // Step 3 → finish: save atributos + content and go to caixa
  async function handleSalvarConteudo(rascunho = false) {
    if (!createdDoc || saving) return;
    void rascunho;
    setSaving(true);
    setError(null);
    try {
      // Save despacho (body text)
      await docService.atualizar(createdDoc.codigo, {
        despacho: conteudo.trim() || undefined,
      });

      // Save template atributo values (only those with content)
      const filledAtributos = atributos
        .filter(a => atributoValues[a.codigo]?.trim())
        .map(a => ({
          codigoAtributoTipo: a.codigo,
          valor: atributoValues[a.codigo] ?? null,
        }));

      if (filledAtributos.length > 0) {
        await docService.upsertAtributos(createdDoc.codigo, { atributos: filledAtributos });
      }

      navigate(afinzAppPaths.caixaEntrada.asRoute!);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Erro ao salvar conteúdo.");
      setSaving(false);
    }
  }

  // ── Step 1 — Category picker ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text, #111)", margin: 0 }}>Novo documento</h1>
            <p style={{ fontSize: 13, color: "var(--text-3, #6b7280)", margin: "4px 0 0" }}>
              Escolha o tipo de documento que deseja criar
            </p>
          </div>
          <button
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-2)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => navigate(-1)}
          >
            ‹ Voltar
          </button>
        </div>

        <Stepper current={1} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id); setStep(2); }}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "20px 24px", borderRadius: 12, cursor: "pointer",
                border: "1px solid var(--border, #e5e7eb)", background: "#fff",
                textAlign: "left", transition: "box-shadow .15s, border-color .15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)";
                e.currentTarget.style.borderColor = cat.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border, #e5e7eb)";
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: cat.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text, #111)", marginBottom: 4 }}>{cat.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-3, #6b7280)", lineHeight: 1.4 }}>{cat.desc}</div>
              </div>
              <span style={{ color: "var(--text-3, #9ca3af)", fontSize: 16 }}>→</span>
            </button>
          ))}
        </div>

        {/* IA Suggestion */}
        <div style={{
          padding: "16px 20px", borderRadius: 12,
          background: "oklch(0.97 0.01 250)", border: "1px solid oklch(0.88 0.025 250)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <div style={{ flex: 1, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "var(--brand-600, #2563eb)" }}>Sugestão IA</span>
            <span style={{ color: "var(--text-2, #374151)", marginLeft: 8 }}>
              Com base nos seus últimos documentos, você costuma criar{" "}
              <strong>Atas de Reunião</strong> nesse horário.{" "}
            </span>
            <button
              style={{ color: "var(--brand-600, #2563eb)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: 0 }}
              onClick={() => { setCategory("interno"); setStep(2); }}
            >
              Criar uma agora →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const catInfo    = CATEGORIES.find(c => c.id === category);
  const tipoItems  = tipos.map(t => ({ codigo: t.codigo, label: `${t.sigla ? t.sigla + " — " : ""}${t.nome ?? String(t.codigo)}` }));

  // ── Step 2 — Metadados ─────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text, #111)", margin: 0 }}>Metadados do documento</h1>
            <p style={{ fontSize: 13, color: "var(--text-3, #6b7280)", margin: "4px 0 0" }}>Preencha as informações principais</p>
          </div>
          <button
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-2)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => { setStep(1); setCreatedDoc(null); setCodigoTipo(null); setError(null); }}
          >
            ‹ Voltar
          </button>
        </div>

        <Stepper current={2} />

        <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 16, padding: "28px 32px" }}>
          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Tipo + Unidade */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={fieldLabel}>
                Tipo de documento <span style={{ color: "#ef4444" }}>*</span>
                {catInfo && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: catInfo.color, background: catInfo.bg, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                    {catInfo.label}
                  </span>
                )}
              </label>
              <select
                style={selectStyle}
                value={codigoTipo ?? ""}
                onChange={e => handleTipoChange(Number(e.target.value))}
              >
                <option value="">Selecione o tipo…</option>
                {tipoItems.map(t => <option key={t.codigo} value={t.codigo}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Unidade de cadastramento <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                style={selectStyle}
                value={codigoSegmentoCriador ?? ""}
                onChange={e => setCodigoSegmentoCriador(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Selecione a unidade…</option>
                {segmentos.map(s => (
                  <option key={s.codigo} value={s.codigo}>
                    {s.sigla ? `${s.sigla} — ${s.nome ?? ""}` : s.nome ?? String(s.codigo)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assunto */}
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Assunto <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea
              value={assunto}
              onChange={e => setAssunto(e.target.value)}
              placeholder="Descreva o assunto deste documento..."
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box", resize: "vertical",
                border: "1px solid var(--border, #d1d5db)", borderRadius: 8,
                padding: "10px 12px", fontSize: 14, fontFamily: "inherit",
                lineHeight: 1.5, outline: "none", color: "var(--text, #111)",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--brand-600, #2563eb)")}
              onBlur={e  => (e.target.style.borderColor = "var(--border, #d1d5db)")}
            />
          </div>

          {/* Situação + Físico/Digital */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={fieldLabel}>Situação</label>
              <select style={selectStyle} value={codigoEstado} onChange={e => setCodigoEstado(Number(e.target.value))}>
                <option value={1}>Em tramitação</option>
                <option value={2}>Arquivado</option>
                <option value={3}>Cancelado</option>
              </select>
            </div>
            <div>
              <label style={fieldLabel}>Físico / Digital <span style={{ color: "#ef4444" }}>*</span></label>
              <div style={{ display: "flex" }}>
                {([0, 1] as const).map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFlagExpedienteImpresso(val)}
                    style={{
                      flex: 1, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 6, fontSize: 13, fontWeight: 500, cursor: "pointer",
                      border: "1px solid var(--border, #d1d5db)",
                      borderRadius: val === 0 ? "8px 0 0 8px" : "0 8px 8px 0",
                      background: flagExpedienteImpresso === val ? "var(--brand-600, #2563eb)" : "#fff",
                      color: flagExpedienteImpresso === val ? "#fff" : "var(--text-2, #374151)",
                      transition: "background .15s, color .15s",
                    }}
                  >
                    {val === 0 ? "🖥 Digital" : "🖨 Físico"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sigiloso */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2, #374151)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={flagConfidencial}
                onChange={e => setFlagConfidencial(e.target.checked)}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              Documento sigiloso (acesso restrito) 🔒
            </label>
          </div>

          {/* Footer: NetDoc + Próximo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid var(--border, #e5e7eb)" }}>
            <div style={{ fontSize: 13, color: "var(--text-3, #6b7280)" }}>
              {creating ? (
                <span>Gerando número…</span>
              ) : createdDoc ? (
                <>NetDoc gerado automaticamente:{" "}
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--text, #111)" }}>
                    {createdDoc.numeroNetdoc}
                  </span>
                </>
              ) : (
                <span>Selecione o tipo para gerar o NetDoc</span>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleProximoMetadados}
              disabled={!createdDoc || saving}
              style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 120 }}
            >
              {saving ? "Salvando…" : "Próximo →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3 — Conteúdo (novo layout: cards lado-a-lado + rows com lápis) ────
  const tipoNome     = createdDoc?.tipoDocumentoNome ?? "Documento";
  const totalFields  = atributos.length;
  const filledFields = atributos.filter(a => (atributoValues[a.codigo] ?? "").trim()).length;
  const progresso    = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  const statusLabel  = filledFields === totalFields && totalFields > 0 ? "Pronto para tramitar" : "Em tramitação";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text, #111)", margin: 0 }}>Conteúdo do documento</h1>
          <p style={{ fontSize: 13, color: "var(--text-3, #6b7280)", margin: "4px 0 0" }}>Preencha os campos clicando no ícone de edição</p>
        </div>
        <button
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-2)", background: "none", border: "none", cursor: "pointer" }}
          onClick={() => { setStep(2); setError(null); }}
        >
          ‹ Voltar
        </button>
      </div>

      <Stepper current={3} />

      {error && (
        <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
          {error}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: 24,
        alignItems: "flex-start",
      }}>
        {/* ── Left summary card ─────────────────────────────────────── */}
        <aside style={{
          background: "#fff",
          border: "1px solid var(--border, #e5e7eb)",
          borderRadius: 14,
          padding: "20px 22px",
          position: "sticky",
          top: 16,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", color: "var(--text-3, #9ca3af)", marginBottom: 6,
          }}>
            Documento
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text, #111)", marginBottom: 18, lineHeight: 1.3 }}>
            {tipoNome}
          </div>

          {createdDoc && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
              <SummaryLine label="NetDoc"   value={createdDoc.numeroNetdoc} mono />
              <SummaryLine label="Número"   value={createdDoc.numeroNetdoc} mono />
              <SummaryLine label="Criação"  value={new Date(createdDoc.dataHoraCriacao).toLocaleDateString("pt-BR")} />
              <SummaryLine label="Origem"   value={createdDoc.segmentoOrigemSigla ?? "—"} />
              <SummaryLine
                label="Status"
                value={
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: "oklch(0.94 0.04 220)",
                    color: "oklch(0.40 0.14 220)",
                    padding: "2px 10px", borderRadius: 999,
                  }}>
                    • {statusLabel}
                  </span>
                }
              />
            </div>
          )}

          <div style={{ height: 1, background: "var(--border)", margin: "18px 0" }} />

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #9ca3af)", marginBottom: 8 }}>
            Progresso
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "var(--text-2, #374151)" }}>Campos preenchidos</span>
            <span style={{ fontWeight: 600, color: "var(--text, #111)" }}>{filledFields}/{totalFields || "—"}</span>
          </div>
          <div style={{ height: 6, background: "var(--surface-2, #f3f4f6)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              width: `${progresso}%`, height: "100%",
              background: "var(--brand-600, #2563eb)",
              transition: "width .2s",
            }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
            <SidebarBtn icon="👁">Pré-visualizar</SidebarBtn>
            <SidebarBtn icon="👥">Co-autores (0)</SidebarBtn>
            <SidebarBtn icon="📎">Anexos (0)</SidebarBtn>
          </div>
        </aside>

        {/* ── Right form card ───────────────────────────────────────── */}
        <section style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 14, overflow: "hidden" }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            padding: "18px 22px", borderBottom: "1px solid var(--border, #e5e7eb)", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text, #111)" }}>Dados do documento</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3, #6b7280)", marginTop: 2 }}>
                Os campos com <span style={{ color: "#ef4444" }}>*</span> são obrigatórios.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" style={{ height: 32, fontSize: 12.5, padding: "0 12px" }} title="Em breve">
                ⚡ Preencher com IA
              </button>
              <button
                className="btn btn-secondary"
                style={{ height: 32, fontSize: 12.5, padding: "0 12px" }}
                onClick={() => handleSalvarConteudo(true)}
                disabled={saving}
              >
                Salvar rascunho
              </button>
            </div>
          </div>

          {/* Field rows */}
          <div>
            {atributos.length > 0 ? (
              atributos.map(a => {
                const raw = atributoValues[a.codigo] ?? "";
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
              })
            ) : (
              <FieldRow
                label="Conteúdo"
                value={conteudo ? conteudo.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 100) : ""}
                required
                onClick={() => setEditingConteudo(true)}
              />
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 22px", borderTop: "1px solid var(--border, #e5e7eb)",
            background: "var(--surface-2, #f9fafb)",
          }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setStep(2); setError(null); }}
            >
              ‹ Voltar
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleSalvarConteudo(true)}
                disabled={saving}
              >
                Salvar e sair
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleSalvarConteudo(false)}
                disabled={saving}
                style={{ minWidth: 160, display: "flex", alignItems: "center", gap: 6 }}
              >
                {saving ? "Salvando…" : <>Concluir e tramitar ✈</>}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Atributo edit dialog */}
      <EditFieldDialog
        atributo={editingAtributo}
        initialValue={editingAtributo ? (atributoValues[editingAtributo.codigo] ?? "") : ""}
        onSave={v => editingAtributo && setAtributoValues(prev => ({ ...prev, [editingAtributo.codigo]: v }))}
        onClose={() => setEditingAtributo(null)}
      />

      {/* Conteúdo fallback dialog (when tipo has no atributos) */}
      {editingConteudo && (
        <div
          onClick={() => setEditingConteudo(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 720,
              background: "#fff", borderRadius: 14,
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.25)",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border, #e5e7eb)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-3, #9ca3af)", marginBottom: 4 }}>
                Editar campo
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text, #111)" }}>Conteúdo</div>
            </div>
            <div style={{ padding: 24 }}>
              <RichEditor value={conteudo} onChange={setConteudo} minHeight={320} placeholder="Redija o conteúdo do documento..." />
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border, #e5e7eb)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setEditingConteudo(false)} style={{ minWidth: 100 }}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setEditingConteudo(false)} style={{ minWidth: 100 }}>✓ Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sidebar helpers ───────────────────────────────────────────────────────────
function SummaryLine({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <span style={{ color: "var(--text-3, #6b7280)" }}>{label}</span>
      <span style={{
        color: "var(--text, #111)",
        fontFamily: mono ? "JetBrains Mono, monospace" : "inherit",
        fontWeight: mono ? 500 : 400,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </span>
    </div>
  );
}

function SidebarBtn({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title="Em breve"
      style={{
        display: "flex", alignItems: "center", gap: 10,
        height: 36, padding: "0 12px",
        background: "var(--surface-2, #f9fafb)",
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: 8, fontSize: 13, color: "var(--text-2, #374151)",
        cursor: "pointer", textAlign: "left",
      }}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </button>
  );
}
