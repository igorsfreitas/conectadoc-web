import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtributoTipoDocumento } from "../../tipo-documento/models/tipo-documento.model";
import { Assunto } from "../../assuntos/models/assunto.model";
import { useInject } from "../../../infra/hooks/inject";
import { afinzAppPaths } from "../../../infra/router/paths/afinz_app";
import { CoautorDocumento, CreateDocumentoResponse, PecaDocumento, TipoDocumentoSimples, UsuarioSearchItem } from "../models/documento.model";
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

// ── UserSearchEditor — autocomplete de usuários do sistema ───────────────────
function UserSearchEditor({
  value,
  onChange,
  searchUsuarios,
}: {
  value: string;
  onChange: (v: string) => void;
  searchUsuarios: (q: string) => Promise<UsuarioSearchItem[]>;
}) {
  const [results, setResults]   = useState<UsuarioSearchItem[]>([]);
  const [open,    setOpen]      = useState(false);
  const [loading, setLoading]   = useState(false);
  const debounce                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef            = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleChange(v: string) {
    onChange(v);
    if (debounce.current) clearTimeout(debounce.current);
    if (v.trim().length < 2) { setResults([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchUsuarios(v.trim());
        setResults(res);
        setOpen(res.length > 0);
      } catch { /* ignore */ } finally { setLoading(false); }
    }, 300);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        type="text"
        autoFocus
        value={value}
        onChange={e => handleChange(e.target.value)}
        placeholder="Digite o nome para buscar..."
        style={{ ...inputStyle, paddingRight: loading ? 36 : 12 }}
        onFocus={e => { e.target.style.borderColor = "var(--brand-600, #2563eb)"; if (value.trim().length >= 2 && results.length > 0) setOpen(true); }}
        onBlur={e => (e.target.style.borderColor = "var(--border, #d1d5db)")}
      />
      {loading && (
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-3)" }}>…</span>
      )}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)",
          background: "#fff", border: "1px solid var(--border, #d1d5db)",
          borderRadius: 8, zIndex: 200, maxHeight: 220, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(15,23,42,.14)",
        }}>
          {results.map(u => (
            <button
              key={u.codigo}
              type="button"
              onMouseDown={e => {
                e.preventDefault();
                onChange(u.nome ?? "");
                setOpen(false);
              }}
              style={{
                display: "flex", flexDirection: "column", width: "100%",
                padding: "8px 14px", textAlign: "left",
                background: "transparent", border: "none",
                borderBottom: "1px solid var(--surface-2, #f3f4f6)",
                cursor: "pointer", fontFamily: "inherit",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2, #f9fafb)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 13.5, color: "var(--text, #111)", fontWeight: 500 }}>{u.nome ?? "—"}</span>
              {(u.matricula || u.cpf) && (
                <span style={{ fontSize: 11.5, color: "var(--text-3, #9ca3af)", fontFamily: "JetBrains Mono, monospace" }}>
                  {u.matricula ? `Matrícula: ${u.matricula}` : u.cpf}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── EditFieldDialog — opens an editor matching the atributo's tipo ────────────
function EditFieldDialog({
  atributo,
  initialValue,
  onSave,
  onClose,
  searchUsuarios,
}: {
  atributo: AtributoTipoDocumento | null;
  initialValue: string;
  onSave: (v: string) => void;
  onClose: () => void;
  searchUsuarios?: (q: string) => Promise<UsuarioSearchItem[]>;
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

  const isUserField = (() => {
    const n = (atributo?.nome ?? "").toLowerCase();
    const l = (atributo?.label ?? "").toLowerCase();
    return ["nome", "destinatario", "destinatário", "para"].some(k => n === k || l === k);
  })();

  function renderEditor() {
    if (isUserField && searchUsuarios) {
      return (
        <UserSearchEditor
          value={draft}
          onChange={setDraft}
          searchUsuarios={searchUsuarios}
        />
      );
    }
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


// ── Assunto Combo Box ─────────────────────────────────────────────────────────
function AssuntoComboBox({
  assuntos,
  value,
  onChange,
}: {
  assuntos: Assunto[];
  value: number | null;
  onChange: (codigo: number | null, descricao: string) => void;
}) {
  const [query,    setQuery]    = useState("");
  const [open,     setOpen]     = useState(false);
  const [display,  setDisplay]  = useState("");
  const containerRef            = useRef<HTMLDivElement>(null);

  // Sync display label when value changes externally
  useEffect(() => {
    if (value === null) { setDisplay(""); return; }
    const found = assuntos.find(a => a.codigo === value);
    if (found) setDisplay(found.descricao ?? String(found.codigo));
  }, [value, assuntos]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Reset query when closing without selection
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? assuntos.filter(a => (a.descricao ?? "").toUpperCase().includes(query.toUpperCase()))
    : assuntos;

  function select(a: Assunto) {
    const label = a.descricao ?? String(a.codigo);
    setDisplay(label);
    setQuery("");
    setOpen(false);
    onChange(a.codigo, label);
  }

  function handleInputChange(v: string) {
    setQuery(v);
    setDisplay(v);
    if (!open) setOpen(true);
    if (!v) onChange(null, "");
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={open ? query : display}
          placeholder="Digite para filtrar ou selecione..."
          onChange={e => handleInputChange(e.target.value)}
          onFocus={e => {
            setOpen(true);
            setQuery("");
            e.target.style.borderColor = "var(--brand-600, #2563eb)";
          }}
          onBlur={e => (e.target.style.borderColor = "var(--border, #d1d5db)")}
          autoComplete="off"
          style={{ ...inputStyle, paddingRight: 36 }}
        />
        <span
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            pointerEvents: "none", color: "var(--text-3, #9ca3af)", fontSize: 10,
          }}
        >
          {open ? "▲" : "▼"}
        </span>
      </div>

      {open && (
        <div style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)",
          background: "#fff", border: "1px solid var(--border, #d1d5db)",
          borderRadius: 8, zIndex: 100,
          maxHeight: 240, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(15,23,42,.12)",
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "var(--text-3, #9ca3af)", fontStyle: "italic" }}>
              Nenhum assunto encontrado
            </div>
          ) : (
            filtered.map(a => (
              <button
                key={a.codigo}
                type="button"
                onMouseDown={e => { e.preventDefault(); select(a); }}
                style={{
                  display: "block", width: "100%", padding: "9px 14px",
                  textAlign: "left", background: "transparent",
                  border: "none", borderBottom: "1px solid var(--surface-2, #f3f4f6)",
                  fontSize: 13.5, color: "var(--text, #111)", cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2, #f9fafb)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {a.descricao ?? `Assunto ${a.codigo}`}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function NovoDocumentoPage() {
  const navigate         = useNavigate();
  const docService       = useInject("DocumentosService");
  const tipoDocService   = useInject("TipoDocumentoService");
  const uaService        = useInject("UnidadeAdministrativaService");
  const assuntosService  = useInject("AssuntosService");

  // Step control
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<Category | null>(null);

  // Data fetched
  const [tipos,     setTipos]     = useState<TipoDocumentoSimples[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [assuntos,  setAssuntos]  = useState<Assunto[]>([]);

  // Step 2 fields
  const [codigoTipo,             setCodigoTipo]             = useState<number | null>(null);
  const [codigoSegmentoCriador,  setCodigoSegmentoCriador]  = useState<number | null>(null);
  const [codigoAssunto,          setCodigoAssunto]          = useState<number | null>(null);
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

  // UI modals
  const [showSigilosoConfirm, setShowSigilosoConfirm] = useState(false);
  const [showPreview,          setShowPreview]          = useState(false);

  // Anexos (peças)
  const [pecas,          setPecas]          = useState<PecaDocumento[]>([]);
  const [uploadingPeca,  setUploadingPeca]   = useState(false);
  const [showAnexos,     setShowAnexos]      = useState(false);
  const fileInputRef                         = useRef<HTMLInputElement>(null);

  // Co-autores
  const [coautores,       setCoautores]       = useState<CoautorDocumento[]>([]);
  const [showCoautores,   setShowCoautores]   = useState(false);
  const [coautorQuery,    setCoautorQuery]    = useState("");
  const [coautorResults,  setCoautorResults]  = useState<UsuarioSearchItem[]>([]);
  const [addingCoautor,   setAddingCoautor]   = useState(false);
  const [removingCoautor, setRemovingCoautor] = useState<number | null>(null);
  const coautorDebounceRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (step === 2) {
      docService.findTiposInterno().then(setTipos).catch(() => {});
      uaService.findAllSimple().then((d: Segmento[]) => setSegmentos(d)).catch(() => {});
      assuntosService.findAll(1, 500).then(r => setAssuntos(r.data)).catch(console.error);
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
        codigoAssunto:          codigoAssunto ?? undefined,
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

  async function handleUploadPeca(file: File) {
    if (!createdDoc || uploadingPeca) return;
    setUploadingPeca(true);
    try {
      const peca = await docService.uploadPeca(createdDoc.codigo, file);
      setPecas(prev => [...prev, peca]);
    } catch {
      // silently ignore — user can retry
    } finally {
      setUploadingPeca(false);
    }
  }

  // ── Co-autores handlers ────────────────────────────────────────────────────
  function handleCoautorQueryChange(q: string) {
    setCoautorQuery(q);
    setCoautorResults([]);
    if (coautorDebounceRef.current) clearTimeout(coautorDebounceRef.current);
    if (!q.trim()) return;
    coautorDebounceRef.current = setTimeout(async () => {
      try {
        const res = await docService.searchUsuarios(q.trim());
        setCoautorResults(res);
      } catch {
        setCoautorResults([]);
      }
    }, 300);
  }

  async function handleAddCoautor(u: UsuarioSearchItem) {
    if (!createdDoc || addingCoautor) return;
    if (coautores.some(c => c.codigoUsuario === u.codigo)) return;
    setAddingCoautor(true);
    try {
      const novo = await docService.addCoautor(createdDoc.codigo, u.codigo);
      setCoautores(prev => [...prev, novo]);
      setCoautorQuery("");
      setCoautorResults([]);
    } catch {
      // silently ignore
    } finally {
      setAddingCoautor(false);
    }
  }

  async function handleRemoveCoautor(codigoUsuario: number) {
    if (!createdDoc) return;
    setRemovingCoautor(codigoUsuario);
    try {
      await docService.removeCoautor(createdDoc.codigo, codigoUsuario);
      setCoautores(prev => prev.filter(c => c.codigoUsuario !== codigoUsuario));
    } catch {
      // silently ignore
    } finally {
      setRemovingCoautor(null);
    }
  }

  // Load co-autores when panel opens
  async function handleToggleCoautores() {
    const next = !showCoautores;
    setShowCoautores(next);
    if (next && createdDoc && coautores.length === 0) {
      try {
        const list = await docService.listCoautores(createdDoc.codigo);
        setCoautores(list);
      } catch {
        // silently ignore
      }
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
            onClick={() => { setStep(1); setCreatedDoc(null); setCodigoTipo(null); setCodigoAssunto(null); setError(null); }}
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
            <label style={fieldLabel}>
              Assunto <span style={{ color: "#ef4444" }}>*</span>
              {assuntos.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-3, #9ca3af)", fontWeight: 400 }}>
                  {assuntos.length} opções disponíveis
                </span>
              )}
            </label>
            <AssuntoComboBox
              assuntos={assuntos}
              value={codigoAssunto}
              onChange={(codigo) => setCodigoAssunto(codigo)}
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

          {/* Sigiloso — toggle alinhado à direita */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", marginBottom: 20, borderRadius: 10,
            background: flagConfidencial ? "#fef2f2" : "var(--surface-2, #f9fafb)",
            border: `1px solid ${flagConfidencial ? "#fecaca" : "var(--border, #e5e7eb)"}`,
            transition: "background .2s, border-color .2s",
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: flagConfidencial ? "#dc2626" : "var(--text-2, #374151)" }}>
                🔒 Documento sigiloso
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3, #6b7280)", marginTop: 2 }}>
                {flagConfidencial ? "Acesso restrito — somente pessoas autorizadas" : "Ative para restringir o acesso a este documento"}
              </div>
            </div>
            <input
              type="checkbox"
              checked={flagConfidencial}
              onChange={e => {
                if (e.target.checked) {
                  setShowSigilosoConfirm(true);
                } else {
                  setFlagConfidencial(false);
                }
              }}
              style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#dc2626", flexShrink: 0 }}
            />
          </div>

          {/* Modal de confirmação sigiloso */}
          {showSigilosoConfirm && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 60,
              background: "rgba(15, 23, 42, 0.5)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}>
              <div style={{
                background: "#fff", borderRadius: 14, maxWidth: 440, width: "100%",
                boxShadow: "0 20px 50px rgba(15,23,42,.25)",
              }}>
                <div style={{ padding: "24px 28px 20px" }}>
                  <div style={{ fontSize: 20, marginBottom: 10 }}>🔒</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text, #111)", marginBottom: 8 }}>
                    Tornar documento sigiloso?
                  </div>
                  <p style={{ fontSize: 13.5, color: "var(--text-2, #374151)", lineHeight: 1.55, margin: 0 }}>
                    Deseja realmente tornar este documento sigiloso? O acesso será restrito e somente
                    pessoas autorizadas poderão visualizá-lo.
                  </p>
                </div>
                <div style={{
                  padding: "14px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10,
                }}>
                  <button
                    className="btn btn-secondary"
                    style={{ minWidth: 100 }}
                    onClick={() => setShowSigilosoConfirm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ minWidth: 120, background: "#dc2626", borderColor: "#dc2626" }}
                    onClick={() => { setFlagConfidencial(true); setShowSigilosoConfirm(false); }}
                  >
                    🔒 Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

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
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                height: 36, padding: "0 12px",
                background: "var(--surface-2, #f9fafb)",
                border: "1px solid var(--border, #e5e7eb)",
                borderRadius: 8, fontSize: 13, color: "var(--text-2, #374151)",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span>👁</span>
              <span>Pré-visualizar</span>
            </button>
            {/* Co-autores toggle */}
            <button
              type="button"
              onClick={handleToggleCoautores}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                height: 36, padding: "0 12px",
                background: showCoautores ? "oklch(0.94 0.04 250)" : "var(--surface-2, #f9fafb)",
                border: `1px solid ${showCoautores ? "var(--brand-600, #2563eb)" : "var(--border, #e5e7eb)"}`,
                borderRadius: 8, fontSize: 13,
                color: showCoautores ? "var(--brand-600, #2563eb)" : "var(--text-2, #374151)",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span>👥</span>
              <span>Co-autores ({coautores.length})</span>
            </button>

            {/* Co-autores panel */}
            {showCoautores && (
              <div style={{ marginTop: -4, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                {/* Search */}
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Buscar usuário…"
                    value={coautorQuery}
                    onChange={e => handleCoautorQueryChange(e.target.value)}
                    disabled={!createdDoc}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      height: 34, padding: "0 10px",
                      border: "1px solid var(--border, #d1d5db)", borderRadius: 7,
                      fontSize: 12.5, color: "var(--text, #111)", background: "#fff",
                      outline: "none",
                    }}
                  />
                  {coautorResults.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                      background: "#fff", border: "1px solid var(--border, #d1d5db)",
                      borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.10)",
                      marginTop: 2, maxHeight: 180, overflowY: "auto",
                    }}>
                      {coautorResults.map(u => {
                        const alreadyAdded = coautores.some(c => c.codigoUsuario === u.codigo);
                        return (
                          <button
                            key={u.codigo}
                            type="button"
                            disabled={alreadyAdded || addingCoautor}
                            onMouseDown={() => handleAddCoautor(u)}
                            style={{
                              display: "flex", flexDirection: "column", alignItems: "flex-start",
                              width: "100%", padding: "8px 12px", background: "none",
                              border: "none", borderBottom: "1px solid var(--border, #f3f4f6)",
                              cursor: alreadyAdded ? "default" : "pointer",
                              opacity: alreadyAdded ? 0.5 : 1,
                              textAlign: "left",
                            }}
                            onMouseEnter={e => { if (!alreadyAdded) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2, #f9fafb)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                          >
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text, #111)" }}>
                              {u.nome ?? "—"}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--text-3, #6b7280)" }}>
                              {u.matricula ?? u.cpf ?? ""}
                              {alreadyAdded ? " · Já adicionado" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* List of co-autores */}
                {coautores.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {coautores.map(c => (
                      <div
                        key={c.codigoUsuario}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "6px 10px",
                          background: "var(--surface-2, #f9fafb)",
                          border: "1px solid var(--border)", borderRadius: 8,
                          fontSize: 12,
                        }}
                      >
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          background: "var(--brand-600, #2563eb)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#fff",
                        }}>
                          {(c.nomeUsuario ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontWeight: 600, color: "var(--text, #111)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.nomeUsuario ?? `Usuário ${c.codigoUsuario}`}
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--text-3, #6b7280)" }}>{c.papel}</div>
                        </div>
                        <button
                          type="button"
                          title="Remover co-autor"
                          disabled={removingCoautor === c.codigoUsuario}
                          onClick={() => handleRemoveCoautor(c.codigoUsuario)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#ef4444", fontSize: 14, lineHeight: 1,
                            padding: 2, flexShrink: 0, opacity: removingCoautor === c.codigoUsuario ? 0.5 : 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {coautores.length === 0 && !coautorQuery && (
                  <p style={{ fontSize: 12, color: "var(--text-3, #9ca3af)", textAlign: "center", margin: "8px 0" }}>
                    Nenhum co-autor adicionado
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAnexos(p => !p)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                height: 36, padding: "0 12px",
                background: showAnexos ? "oklch(0.94 0.04 250)" : "var(--surface-2, #f9fafb)",
                border: `1px solid ${showAnexos ? "var(--brand-600, #2563eb)" : "var(--border, #e5e7eb)"}`,
                borderRadius: 8, fontSize: 13,
                color: showAnexos ? "var(--brand-600, #2563eb)" : "var(--text-2, #374151)",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span>📎</span>
              <span>Anexos ({pecas.length})</span>
            </button>
          </div>

          {/* ── Anexos panel ───────────────────────────── */}
          {showAnexos && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { void handleUploadPeca(f); }
                  e.target.value = "";
                }}
              />

              {/* Existing pecas list */}
              {pecas.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {pecas.map(p => (
                    <div
                      key={p.codigo}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "6px 10px",
                        background: "var(--surface-2, #f9fafb)",
                        border: "1px solid var(--border)", borderRadius: 8,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>📄</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text, #111)" }}>
                        {p.nome ?? `Anexo ${p.codigo}`}
                      </span>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Baixar"
                          style={{ color: "var(--brand-600, #2563eb)", textDecoration: "none", flexShrink: 0 }}
                        >
                          ↓
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!createdDoc || uploadingPeca}
                style={{
                  width: "100%", padding: "8px 0",
                  border: "1.5px dashed var(--border, #d1d5db)",
                  borderRadius: 8, background: "transparent",
                  fontSize: 12.5, color: "var(--text-2, #374151)",
                  cursor: createdDoc && !uploadingPeca ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {uploadingPeca ? "Enviando…" : "+ Adicionar arquivo"}
              </button>
            </div>
          )}
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

      {/* ── Pré-visualização do documento ──────────────────────────────────── */}
      {showPreview && (
        <div
          onClick={() => setShowPreview(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            padding: "32px 24px", overflowY: "auto",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 760, background: "#fff",
              borderRadius: 4, boxShadow: "0 20px 60px rgba(15,23,42,.35)",
              fontFamily: "Times New Roman, serif",
            }}
          >
            {/* Botão fechar */}
            <div style={{
              display: "flex", justifyContent: "flex-end",
              padding: "8px 12px", background: "#f3f4f6", borderBottom: "1px solid #e5e7eb",
              fontFamily: "Inter, sans-serif",
            }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#6b7280" }}
              >
                ✕ Fechar visualização
              </button>
            </div>

            {/* Corpo do documento */}
            <div style={{ padding: "40px 52px", minHeight: 900, fontSize: 12, lineHeight: 1.8, color: "#111" }}>

              {/* ── Cabeçalho com logo ── */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "2px solid #1e3a5f", paddingBottom: 16, marginBottom: 24,
              }}>
                {/* Logo da prefeitura */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 8,
                    background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ color: "#fff", fontSize: 20, fontWeight: 700, fontFamily: "Inter, sans-serif" }}>
                      {(createdDoc?.segmentoOrigemSigla ?? "PR").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {createdDoc?.segmentoOrigemNome ?? "Prefeitura Municipal"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "Inter, sans-serif" }}>
                      {createdDoc?.segmentoOrigemSigla ?? ""}
                    </div>
                  </div>
                </div>
                {/* NetDoc + data */}
                <div style={{ textAlign: "right", fontSize: 11, color: "#374151", fontFamily: "Inter, sans-serif" }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700, fontSize: 13 }}>
                    {createdDoc?.numeroNetdoc ?? "—"}
                  </div>
                  <div>{new Date(createdDoc?.dataHoraCriacao ?? Date.now()).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  {flagConfidencial && (
                    <div style={{ marginTop: 4, color: "#dc2626", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em" }}>
                      🔒 SIGILOSO
                    </div>
                  )}
                </div>
              </div>

              {/* ── Título do tipo de documento ── */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#1e3a5f" }}>
                  {createdDoc?.tipoDocumentoNome ?? "Documento"}
                </div>
                {createdDoc?.numero && (
                  <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>
                    N° {createdDoc.numero}
                  </div>
                )}
              </div>

              {/* ── Atributos preenchidos ── */}
              {atributos.length > 0 && (
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 12 }}>
                  <tbody>
                    {atributos.map(a => {
                      const raw = atributoValues[a.codigo] ?? "";
                      if (!raw) return null;
                      const label = a.label ?? a.nome ?? `Campo ${a.codigo}`;
                      const display = formatAtributoValue(a, raw);
                      return (
                        <tr key={a.codigo} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "5px 8px 5px 0", fontWeight: 600, color: "#374151", width: 180, verticalAlign: "top" }}>
                            {label}:
                          </td>
                          <td style={{ padding: "5px 0", color: "#111" }}>{display}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* ── Corpo / despacho ── */}
              {conteudo ? (
                <div
                  style={{ marginTop: 16, lineHeight: 1.9, color: "#111", fontSize: 12 }}
                  dangerouslySetInnerHTML={{ __html: conteudo }}
                />
              ) : (
                <div style={{ marginTop: 16, color: "#9ca3af", fontStyle: "italic", fontSize: 12 }}>
                  (Conteúdo não preenchido)
                </div>
              )}

              {/* ── Rodapé ── */}
              <div style={{ marginTop: 60, borderTop: "1px solid #e5e7eb", paddingTop: 16, fontSize: 11, color: "#9ca3af", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
                Documento gerado pelo ConectaDoc · {createdDoc?.segmentoOrigemNome} · {new Date().toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Atributo edit dialog */}
      <EditFieldDialog
        atributo={editingAtributo}
        initialValue={editingAtributo ? (atributoValues[editingAtributo.codigo] ?? "") : ""}
        onSave={v => editingAtributo && setAtributoValues(prev => ({ ...prev, [editingAtributo.codigo]: v }))}
        onClose={() => setEditingAtributo(null)}
        searchUsuarios={q => docService.searchUsuarios(q)}
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
