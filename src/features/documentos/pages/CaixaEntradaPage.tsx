import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInject } from "../../../infra/hooks/inject";
import { afinzAppPaths } from "../../../infra/router/paths/afinz_app";
import { CaixaItem, CaixaResponse, CaixaCounts, CaixaTab } from "../models/documento.model";

// ── helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string | Date | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

type SortKey = "numeroNetdoc" | "origemSigla" | "assuntoTexto" | "numero" | "tipoDocumentoSigla" | "dataEnvio" | "dataCriacao";
type SortDir = "asc" | "desc";

function sortItems(items: CaixaItem[], key: SortKey, dir: SortDir): CaixaItem[] {
  return [...items].sort((a, b) => {
    const va = a[key] ?? "";
    const vb = b[key] ?? "";
    let cmp = 0;
    if (va < vb) cmp = -1;
    else if (va > vb) cmp = 1;
    return dir === "asc" ? cmp : -cmp;
  });
}

function statusInfo(item: CaixaItem): { label: string; color: string; bg: string } {
  if (item.flagRecusada === 1) return { label: "Recusado", color: "#dc2626", bg: "#fef2f2" };
  if (item.flagPendencia === 1) return { label: "Pendente", color: "#d97706", bg: "#fffbeb" };
  if (item.flagAceite === 1)    return { label: "Em posse", color: "#059669", bg: "#ecfdf5" };
  return { label: "Em tramitação", color: "#2563eb", bg: "#eff6ff" };
}

// ── tab config ────────────────────────────────────────────────────────────────
const TABS: { key: CaixaTab; label: string }[] = [
  { key: "entrada",   label: "Caixa de Entrada" },
  { key: "saida",     label: "Caixa de Saída" },
  { key: "posse",     label: "Em posse" },
  { key: "pendencia", label: "Pendência" },
  { key: "circular",  label: "Circular" },
  { key: "gerencia",  label: "Gerência" },
];

// ── component ─────────────────────────────────────────────────────────────────
export function CaixaEntradaPage() {
  const navigate = useNavigate();
  const service = useInject("DocumentosService");
  const [searchParams, setSearchParams] = useSearchParams();

  // URL is the source of truth for search — both bars write here
  const urlQ = searchParams.get("q") ?? "";

  const [tab, setTab] = useState<CaixaTab>("entrada");
  const [search, setSearch] = useState(urlQ);
  const [searchInput, setSearchInput] = useState(urlQ);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CaixaItem[]>([]);
  const [counts, setCounts] = useState<CaixaCounts>({ entrada: 0, saida: 0, posse: 0, pendencia: 0, circular: 0, gerencia: 0 });
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [segmentoSigla, setSegmentoSigla] = useState<string | null>(null);
  const [segmentoNome, setSegmentoNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("dataCriacao");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (t: CaixaTab, p: number, s: string) => {
    setLoading(true);
    try {
      const res: CaixaResponse = await service.findCaixa({ tab: t, page: p, limit: 20, search: s || undefined });
      setData(res.data);
      setMeta(res.meta);
      setCounts(res.counts);
      setSegmentoSigla(res.segmentoSigla);
      setSegmentoNome(res.segmentoNome);
      setSelected(new Set());
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  }, [service]);

  // Sync local state when topbar updates the URL param
  useEffect(() => {
    if (urlQ !== search) {
      setSearch(urlQ);
      setSearchInput(urlQ);
      setPage(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ]);

  useEffect(() => { load(tab, page, search); }, [tab, page, search, load]);

  function handleTabChange(t: CaixaTab) {
    setTab(t);
    setPage(1);
    setSelected(new Set());
    setSearch("");
    setSearchInput("");
    setSearchParams({}, { replace: true });
  }

  function handleSearchInput(v: string) {
    setSearchInput(v);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setSearch(v);
      setPage(1);
      // Sync URL so topbar also reflects the search
      setSearchParams(v.trim() ? { q: v.trim() } : {}, { replace: true });
    }, 400);
  }

  function toggleSelect(codigo: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(codigo) ? next.delete(codigo) : next.add(codigo);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === data.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.map(d => d.documentoCodigo)));
    }
  }

  const tabCount = (k: CaixaTab) => counts[k] ?? 0;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortedData = sortItems(data, sortKey, sortDir);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text, #111)", margin: 0 }}>Caixa de Entrada</h1>
          <p style={{ fontSize: 13, color: "var(--text-3, #6b7280)", margin: "4px 0 0" }}>
            {segmentoSigla ?? "…"}{segmentoNome ? ` · ${segmentoNome}` : ""} · Documentos sob sua responsabilidade
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: 13, height: 36 }}
            onClick={() => load(tab, page, search)}
          >
            ↺ Atualizar
          </button>
          <button
            className="btn btn-primary"
            style={{ fontSize: 13, height: 36 }}
            onClick={() => navigate(afinzAppPaths.novoDocumento.asRoute!)}
          >
            + Novo Documento
          </button>
          {selected.size > 0 && (
            <button className="btn btn-primary" style={{ fontSize: 13, height: 36 }}>
              ✓ Receber selecionados ({selected.size})
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--border, #e5e7eb)", marginBottom: 16 }}>
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          const count = tabCount(key);
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "10px 16px", fontSize: 13.5, fontWeight: active ? 600 : 400,
                color: active ? "var(--brand-600, #2563eb)" : "var(--text-2, #374151)",
                borderBottom: active ? "2px solid var(--brand-600, #2563eb)" : "2px solid transparent",
                marginBottom: -2, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  background: active ? "var(--brand-600, #2563eb)" : "#e5e7eb",
                  color: active ? "#fff" : "var(--text-2, #374151)",
                  borderRadius: 99, fontSize: 11, fontWeight: 600,
                  padding: "1px 6px", lineHeight: "18px",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3, #9ca3af)", fontSize: 14 }}>⌕</span>
          <input
            className="input"
            value={searchInput}
            onChange={e => handleSearchInput(e.target.value)}
            placeholder="Filtrar por NetDoc, assunto, número..."
            style={{ paddingLeft: 30, height: 36, fontSize: 13 }}
          />
        </div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-3, #9ca3af)" }}>
          {loading ? "Carregando…" : `Mostrando ${data.length} de ${meta.total} documentos`}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ border: "1px solid var(--border, #e5e7eb)", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--surface-2, #f9fafb)", borderBottom: "1px solid var(--border, #e5e7eb)" }}>
                <th style={{ width: 40, padding: "10px 12px" }}>
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selected.size === data.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                {(
                  [
                    { label: "NETDOC",       key: "numeroNetdoc" as SortKey },
                    { label: "ORIGEM",        key: "origemSigla" as SortKey },
                    { label: "ASSUNTO",       key: "assuntoTexto" as SortKey },
                    { label: "NÚMERO",        key: "numero" as SortKey },
                    { label: "TIPO",          key: "tipoDocumentoSigla" as SortKey },
                    { label: "TRAMITAÇÃO",    key: null },
                    { label: "STATUS",        key: null },
                    { label: "RECEBIDO",      key: "dataEnvio" as SortKey },
                    { label: "DATA CRIAÇÃO",  key: "dataCriacao" as SortKey },
                  ] as { label: string; key: SortKey | null }[]
                ).map(({ label, key }) => (
                  <th
                    key={label}
                    onClick={key ? () => handleSort(key) : undefined}
                    style={{
                      padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600,
                      color: key && sortKey === key ? "var(--brand-600, #2563eb)" : "var(--text-3, #6b7280)",
                      letterSpacing: "0.05em", textTransform: "uppercase",
                      whiteSpace: "nowrap", cursor: key ? "pointer" : "default",
                      userSelect: "none",
                    }}
                  >
                    {label}
                    {key && (
                      <span style={{ marginLeft: 4, fontSize: 10, opacity: sortKey === key ? 1 : 0.35 }}>
                        {sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && data.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "var(--text-3, #9ca3af)" }}>Carregando…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: 40, color: "var(--text-3, #9ca3af)" }}>Nenhum documento encontrado.</td></tr>
              ) : sortedData.map(item => {
                const status = statusInfo(item);
                const isSelected = selected.has(item.documentoCodigo);
                return (
                  <tr
                    key={`${item.tramitacaoCodigo}-${item.documentoCodigo}`}
                    style={{
                      borderBottom: "1px solid var(--border, #f3f4f6)",
                      background: isSelected ? "oklch(0.965 0.008 250)" : undefined,
                    }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.documentoCodigo)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span
                        onClick={() => navigate(`/documentos/${item.documentoCodigo}`)}
                        style={{ color: "var(--brand-600, #2563eb)", fontWeight: 600, fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, cursor: "pointer" }}
                      >
                        {item.numeroNetdoc ?? "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {item.origemSigla ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            background: "#e0e7ff", color: "#3730a3", borderRadius: 6,
                            fontSize: 10, fontWeight: 700, padding: "2px 5px",
                          }}>
                            {item.origemSigla.slice(0, 2).toUpperCase()}
                          </span>
                          <span style={{ color: "var(--text-2, #374151)", fontSize: 12 }}>{item.origemSigla}</span>
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", maxWidth: 320 }}>
                      <span style={{
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden", color: "var(--text, #111)",
                      }}>
                        {item.assuntoTexto || item.resumo || "—"}
                      </span>
                      {item.flagConfidencial === 1 && (
                        <span style={{ marginLeft: 4, fontSize: 11, color: "#d97706" }} title="Confidencial">🔒</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "var(--text-2, #374151)" }}>
                      {item.numero ?? "—"}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      {item.tipoDocumentoSigla ? (
                        <span style={{
                          background: "#f3f4f6", color: "var(--text-2, #374151)",
                          borderRadius: 6, fontSize: 11, fontWeight: 600,
                          padding: "3px 8px", border: "1px solid var(--border, #e5e7eb)",
                        }}>
                          {item.tipoDocumentoSigla}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        minWidth: 160,
                      }}>
                        <span style={{ fontWeight: 500, color: "var(--text-2, #374151)", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.origemSigla ?? "—"}
                        </span>
                        <span style={{ color: "var(--text-3, #9ca3af)", flexShrink: 0 }}>→</span>
                        <span style={{ textAlign: "left" }}>
                          <span style={{
                            background: "var(--brand-600, #2563eb)", color: "#fff",
                            borderRadius: 5, fontSize: 10.5, fontWeight: 600, padding: "2px 6px",
                            whiteSpace: "nowrap",
                          }}>
                            {item.destinoSigla ?? "—"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{
                        background: status.bg, color: status.color,
                        borderRadius: 99, fontSize: 11.5, fontWeight: 500,
                        padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color, display: "inline-block" }} />
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, color: "var(--text-2, #374151)" }}>
                      {formatDate(item.dataEnvio)}
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontSize: 12, color: "var(--text-2, #374151)" }}>
                      {formatDate(item.dataCriacao)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", borderTop: "1px solid var(--border, #e5e7eb)",
          fontSize: 13, color: "var(--text-2, #374151)",
        }}>
          <span style={{ color: "var(--text-3)", fontSize: 12 }}>
            {meta.total === 0
              ? "Nenhum documento"
              : `${(meta.page - 1) * meta.limit + 1}–${Math.min(meta.page * meta.limit, meta.total)} de ${meta.total}`}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, height: 30, padding: "0 10px" }}
              disabled={meta.page <= 1 || loading}
              onClick={() => setPage(1)}
            >
              «
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, height: 30, padding: "0 12px" }}
              disabled={meta.page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              ‹ Anterior
            </button>
            <span style={{
              fontSize: 12, padding: "0 10px", height: 30,
              display: "flex", alignItems: "center", gap: 4,
              fontVariantNumeric: "tabular-nums",
            }}>
              Página <strong>{meta.page}</strong> de <strong>{meta.totalPages}</strong>
            </span>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, height: 30, padding: "0 12px" }}
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Próxima ›
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 12, height: 30, padding: "0 10px" }}
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => setPage(meta.totalPages)}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
