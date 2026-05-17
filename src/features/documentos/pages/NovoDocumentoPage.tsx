import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInject } from "../../../infra/hooks/inject";
import { afinzAppPaths } from "../../../infra/router/paths/afinz_app";
import { CreateDocumentoResponse } from "../models/documento.model";
import { TipoDocumentoSimples } from "../models/documento.model";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Segmento { codigo: number; nome: string | null; sigla: string | null; }
interface Assunto  { codigo: number; descricao: string | null; }

// ── SearchSelect ──────────────────────────────────────────────────────────────
function SearchSelect({
  label,
  placeholder,
  items,
  value,
  onSelect,
  loading,
}: {
  label: string;
  placeholder: string;
  items: { codigo: number | string; label: string }[];
  value: number | string | null;
  onSelect: (codigo: number | string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find(i => i.codigo == value);
  const filtered = q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : items;

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
        <span>{selected ? selected.label : placeholder}</span>
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
              onChange={e => setQ(e.target.value)}
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
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── InfoField ─────────────────────────────────────────────────────────────────
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3, #6b7280)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: "var(--text, #111)", fontFamily: value.match(/^\d/) ? "JetBrains Mono, monospace" : "inherit" }}>
        {value}
      </span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function NovoDocumentoPage() {
  const navigate = useNavigate();
  const docService  = useInject("DocumentosService");
  const assuntosService = useInject("AssuntosService");
  const uaService   = useInject("UnidadeAdministrativaService");

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);
  const [tipos, setTipos] = useState<TipoDocumentoSimples[]>([]);
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [codigoTipo, setCodigoTipo] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [createdDoc, setCreatedDoc] = useState<CreateDocumentoResponse | null>(null);
  const [assuntos, setAssuntos] = useState<Assunto[]>([]);
  const [codigoAssunto, setCodigoAssunto] = useState<number | null>(null);
  const [codigoSegmentoCriador, setCodigoSegmentoCriador] = useState<number | null>(null);
  const [resumo, setResumo] = useState("");
  const [flagExpedienteImpresso, setFlagExpedienteImpresso] = useState<0 | 1>(0);
  const [saving, setSaving] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  const tipoItems = tipos.map(t => ({ codigo: t.codigo, label: `${t.sigla ? t.sigla + " — " : ""}${t.nome ?? String(t.codigo)}` }));
  const segItems  = segmentos.map(s => ({ codigo: s.codigo, label: `${s.sigla ?? ""} — ${s.nome ?? ""}` }));
  const assItems  = assuntos.map(a => ({ codigo: a.codigo, label: a.descricao ?? String(a.codigo) }));

  useEffect(() => {
    docService.findTiposInterno().then(setTipos).catch(() => {});
    uaService.findAllSimple().then((data: Segmento[]) => setSegmentos(data)).catch(() => {});
    assuntosService.findAll(1, 200).then((r: { data: Assunto[] }) => setAssuntos(r.data)).catch(() => {});
  }, []);

  // ── Step 1: Confirmar (cria o documento) ──────────────────────────────────
  async function handleConfirmar() {
    if (!codigoTipo || confirming) return;
    setConfirming(true);
    setStep1Error(null);
    try {
      const doc = await docService.criar({ codigoTipoDocumento: codigoTipo });
      setCreatedDoc(doc);
      setStep(2);
    } catch (e: any) {
      setStep1Error(e?.response?.data?.message ?? "Erro ao criar documento.");
    } finally {
      setConfirming(false);
    }
  }

  // ── Step 2: Salvar (complementa o documento) ──────────────────────────────
  async function handleSalvar() {
    if (!createdDoc || saving) return;
    setSaving(true);
    setStep2Error(null);
    try {
      await docService.atualizar(createdDoc.codigo, {
        resumo: resumo.trim() || undefined,
        codigoAssunto: codigoAssunto ?? undefined,
        flagExpedienteImpresso,
        codigoSegmentoCriador: codigoSegmentoCriador ?? undefined,
      });
      navigate(afinzAppPaths.caixaEntrada.asRoute!);
    } catch (e: any) {
      setStep2Error(e?.response?.data?.message ?? "Erro ao salvar documento.");
      setSaving(false);
    }
  }

  // ── Formatters ────────────────────────────────────────────────────────────
  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
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
          {step === 1 ? "Selecione o tipo de documento para iniciar" : "Complementar informações do documento"}
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        {([1, 2] as const).map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
              background: step >= s ? "var(--brand-600, #2563eb)" : "var(--surface-2, #f3f4f6)",
              color: step >= s ? "#fff" : "var(--text-3, #9ca3af)",
            }}>{s}</div>
            <span style={{ fontSize: 13, color: step === s ? "var(--text, #111)" : "var(--text-3, #9ca3af)", fontWeight: step === s ? 600 : 400 }}>
              {s === 1 ? "Tipo" : "Complementar"}
            </span>
            {s < 2 && <span style={{ fontSize: 13, color: "var(--text-3)" }}>→</span>}
          </div>
        ))}
      </div>

      {/* ── STEP 1 ─────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 12, padding: "28px 32px" }}>
          <div style={{ position: "relative" }}>
            <SearchSelect
              label="Tipo de Documento *"
              placeholder="Selecione o tipo..."
              items={tipoItems}
              value={codigoTipo}
              onSelect={v => setCodigoTipo(Number(v))}
            />
          </div>

          {step1Error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
              {step1Error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)} disabled={confirming}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleConfirmar}
              disabled={!codigoTipo || confirming}
              style={{ minWidth: 140 }}
            >
              {confirming ? "Criando…" : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ─────────────────────────────────────────────────────────── */}
      {step === 2 && createdDoc && (
        <>
          {/* Read-only header card */}
          <div style={{
            background: "oklch(0.97 0.008 250)",
            border: "1px solid oklch(0.88 0.02 250)",
            borderRadius: 12, padding: "18px 24px", marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-600, #2563eb)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Documento criado
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px 24px" }}>
              <InfoField label="NETDOC" value={createdDoc.numeroNetdoc} />
              {createdDoc.numero && <InfoField label="Número" value={createdDoc.numero} />}
              <InfoField label="Data de Criação" value={formatDate(createdDoc.dataHoraCriacao)} />
              <InfoField
                label="Tipo"
                value={[createdDoc.tipoDocumentoSigla, createdDoc.tipoDocumentoNome].filter(Boolean).join(" — ") || "—"}
              />
              <InfoField
                label="Unidade Origem"
                value={[createdDoc.segmentoOrigemSigla, createdDoc.segmentoOrigemNome].filter(Boolean).join(" — ") || "—"}
              />
            </div>
          </div>

          {/* Editable fields card */}
          <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 12, padding: "28px 32px" }}>

            {/* Unidade Cadastrante */}
            <div style={{ position: "relative" }}>
              <SearchSelect
                label="Unidade Cadastrante"
                placeholder="Selecione a unidade cadastrante..."
                items={segItems}
                value={codigoSegmentoCriador}
                onSelect={v => setCodigoSegmentoCriador(Number(v))}
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

            {/* Resumo */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2, #374151)", marginBottom: 4 }}>
                Texto / Resumo
              </label>
              <textarea
                value={resumo}
                onChange={e => setResumo(e.target.value)}
                placeholder="Descreva o conteúdo do documento..."
                rows={5}
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

            {/* Físico / Digital */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-2, #374151)", marginBottom: 8 }}>
                Suporte
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {([0, 1] as const).map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFlagExpedienteImpresso(val)}
                    style={{
                      padding: "6px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      cursor: "pointer", border: "1px solid",
                      borderColor: flagExpedienteImpresso === val ? "var(--brand-600, #2563eb)" : "var(--border, #e5e7eb)",
                      background: flagExpedienteImpresso === val ? "oklch(0.965 0.008 250)" : "#fff",
                      color: flagExpedienteImpresso === val ? "var(--brand-600, #2563eb)" : "var(--text-2, #374151)",
                    }}
                  >
                    {val === 0 ? "Digital" : "Físico"}
                  </button>
                ))}
              </div>
            </div>

            {step2Error && (
              <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13, color: "#dc2626" }}>
                {step2Error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(afinzAppPaths.caixaEntrada.asRoute!)}
                disabled={saving}
              >
                Ir para Caixa
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSalvar}
                disabled={saving}
                style={{ minWidth: 140 }}
              >
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
