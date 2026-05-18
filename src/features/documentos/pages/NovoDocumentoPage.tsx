import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtributoTipoDocumento } from "../../tipo-documento/models/tipo-documento.model";
import { useInject } from "../../../infra/hooks/inject";
import { afinzAppPaths } from "../../../infra/router/paths/afinz_app";
import { CreateDocumentoResponse, TipoDocumentoSimples } from "../models/documento.model";

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

// ── InfoRow — read-only field ─────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3, #6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <div style={{ fontSize: 13.5, color: "var(--text, #111)", marginTop: 2 }}>{value || "—"}</div>
    </div>
  );
}

// ── AtributoField — renders one template variable ─────────────────────────────
function AtributoField({
  atributo,
  value,
  onChange,
}: {
  atributo: AtributoTipoDocumento;
  value: string;
  onChange: (v: string) => void;
}) {
  const label = atributo.label ?? atributo.nome ?? `Campo ${atributo.codigo}`;
  const required = atributo.flagCadastraComNulo === 0;
  const tipo = atributo.tipo;

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = "var(--brand-600, #2563eb)");
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.target.style.borderColor = "var(--border, #d1d5db)");

  // tipo=11 → checkbox
  if (tipo === 11) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2, #374151)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={value === "1"}
            onChange={e => onChange(e.target.checked ? "1" : "0")}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
      </div>
    );
  }

  // tipo=2 → date
  if (tipo === 2) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>
          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
          style={inputStyle}
        />
      </div>
    );
  }

  // tipo=7 → textarea (String HTML / rich text)
  if (tipo === 7) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>
          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={6}
          style={{
            width: "100%", boxSizing: "border-box", resize: "vertical",
            border: "1px solid var(--border, #d1d5db)", borderRadius: 8,
            padding: "10px 12px", fontSize: 14, fontFamily: "inherit",
            lineHeight: 1.5, outline: "none", color: "var(--text, #111)",
          }}
          onFocus={focusStyle}
          onBlur={blurStyle}
        />
      </div>
    );
  }

  // tipo=8 → multi-value (simple comma-separated for now)
  if (tipo === 8 && atributo.multiploValor) {
    const opts = atributo.multiploValor.split("|").filter(Boolean);
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>
          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
        <select
          style={selectStyle}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
        >
          <option value="">Selecione…</option>
          {opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  // tipo=6/9/12 → numeric/integer
  if (tipo === 6 || tipo === 4 || tipo === 5) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>
          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={focusStyle}
          onBlur={blurStyle}
          style={inputStyle}
        />
      </div>
    );
  }

  // default → text input (tipo=1,3,4,10,13,15,16 etc)
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={fieldLabel}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={focusStyle}
        onBlur={blurStyle}
        style={inputStyle}
        style={{
          ...inputStyle,
          textTransform: tipo === 16 ? "uppercase" : "none",
        } as React.CSSProperties}
      />
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
  const tipoSelecionado = tipoItems.find(t => t.codigo === codigoTipo);
  const segSelecionado  = segmentos.find(s => s.codigo === codigoSegmentoCriador);

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
              <label style={fieldLabel}>Unidade de origem <span style={{ color: "#ef4444" }}>*</span></label>
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

  // ── Step 3 — Conteúdo ──────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text, #111)", margin: 0 }}>Conteúdo do documento</h1>
          <p style={{ fontSize: 13, color: "var(--text-3, #6b7280)", margin: "4px 0 0" }}>Redija o corpo do documento</p>
        </div>
        <button
          style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text-2)", background: "none", border: "none", cursor: "pointer" }}
          onClick={() => { setStep(2); setError(null); }}
        >
          ‹ Voltar
        </button>
      </div>

      <Stepper current={3} />

      {/* Read-only header — dados gerados/preenchidos nos steps anteriores */}
      {createdDoc && (
        <div style={{
          background: "oklch(0.97 0.008 250)",
          border: "1px solid oklch(0.88 0.02 250)",
          borderRadius: 12, padding: "18px 24px", marginBottom: 16,
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px 24px",
        }}>
          <InfoRow label="NetDoc"           value={createdDoc.numeroNetdoc} />
          <InfoRow label="Data de criação"  value={new Date(createdDoc.dataHoraCriacao).toLocaleDateString("pt-BR")} />
          <InfoRow label="Tipo"             value={[createdDoc.tipoDocumentoSigla, createdDoc.tipoDocumentoNome].filter(Boolean).join(" — ")} />
          <InfoRow label="Unidade origem"   value={[createdDoc.segmentoOrigemSigla, createdDoc.segmentoOrigemNome].filter(Boolean).join(" — ")} />
          {segSelecionado && <InfoRow label="Unid. cadastrante" value={`${segSelecionado.sigla ?? ""} ${segSelecionado.nome ?? ""}`.trim()} />}
          {assunto        && <InfoRow label="Assunto"           value={assunto} />}
          <InfoRow label="Suporte"          value={flagExpedienteImpresso === 0 ? "Digital" : "Físico"} />
          {flagConfidencial && <InfoRow label="Sigilo" value="Sigiloso 🔒" />}
        </div>
      )}

      {/* Conteúdo editor */}
      <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 16, padding: "28px 32px" }}>
        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* Assunto — pré-preenchido, read-only neste step */}
        {assunto && (
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Assunto</label>
            <div style={{
              padding: "10px 12px", borderRadius: 8, fontSize: 14,
              background: "var(--surface-2, #f9fafb)", border: "1px solid var(--border, #e5e7eb)",
              color: "var(--text-2, #374151)", lineHeight: 1.5,
            }}>
              {assunto}
            </div>
          </div>
        )}

        {/* Dynamic template atributos from tipo de documento */}
        {atributos.length > 0 && (
          <>
            <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border, #e5e7eb)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-3, #6b7280)" }}>
                Campos do tipo de documento
              </span>
            </div>
            {atributos.map(a => (
              <AtributoField
                key={a.codigo}
                atributo={a}
                value={atributoValues[a.codigo] ?? ""}
                onChange={v => setAtributoValues(prev => ({ ...prev, [a.codigo]: v }))}
              />
            ))}
            <div style={{ marginBottom: 16, marginTop: -8, paddingBottom: 16, borderBottom: "1px solid var(--border, #e5e7eb)" }} />
          </>
        )}

        {/* Conteúdo */}
        <div style={{ marginBottom: 24 }}>
          <label style={fieldLabel}>
            Conteúdo <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            placeholder="Redija aqui o conteúdo do documento..."
            rows={14}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              border: "1px solid var(--border, #d1d5db)", borderRadius: 8,
              padding: "12px 14px", fontSize: 14, fontFamily: "inherit",
              lineHeight: 1.7, outline: "none", color: "var(--text, #111)",
            }}
            onFocus={e => (e.target.style.borderColor = "var(--brand-600, #2563eb)")}
            onBlur={e  => (e.target.style.borderColor = "var(--border, #d1d5db)")}
          />
          <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right", marginTop: 4 }}>
            {conteudo.length} / 10.000
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border, #e5e7eb)" }}>
          <button
            className="btn btn-secondary"
            onClick={() => handleSalvarConteudo(true)}
            disabled={saving}
          >
            Salvar rascunho
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleSalvarConteudo(false)}
            disabled={saving}
            style={{ minWidth: 140 }}
          >
            {saving ? "Salvando…" : "Salvar documento"}
          </button>
        </div>
      </div>
    </div>
  );
}
