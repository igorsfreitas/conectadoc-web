import { FormEvent, useState } from 'react';

import { Pagination } from '../../../infra/components/pagination';
import { TipoDocumento, TipoDocumentoFilter } from '../models/tipo-documento.model';
import { useTipoDocumentoListViewModel } from '../use_tipo-documento.view-model';

// ── Icons ──────────────────────────────────────────────────────────────────
function IconPlus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconSearch({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconChevronRight({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function tipoBaseBadge(v: number | null) {
  if (v === 1) return <span className="badge badge-info">INTERNO</span>;
  if (v === 2) return <span className="badge badge-warning">EXTERNO</span>;
  if (v === 3) return <span className="badge badge-success">AMBOS</span>;
  return <span style={{ color: 'var(--text-3)' }}>—</span>;
}

function flagBadge(val: number | string | null, trueLabel = 'Sim') {
  const active = val === 1 || val === '1';
  return active
    ? <span className="badge badge-success" style={{ fontSize: 11 }}>{trueLabel}</span>
    : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>;
}

// ── List Page ──────────────────────────────────────────────────────────────
export function TipoDocumentoListPage() {
  const {
    data, loading, error,
    page, totalPages, total, limit,
    openCreate, openEdit,
    goToPage, applyFilter,
  } = useTipoDocumentoListViewModel();

  // local filter inputs
  const [fNome, setFNome]           = useState('');
  const [fSigla, setFSigla]         = useState('');
  const [fProtocolo, setFProtocolo] = useState(false);
  const [fProcesso, setFProcesso]   = useState(false);
  const [fWf, setFWf]               = useState(false);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const f: TipoDocumentoFilter = {};
    if (fNome)      f.nome = fNome;
    if (fSigla)     f.sigla = fSigla;
    if (fProtocolo) f.flagProtocolo = true;
    if (fProcesso)  f.flagProcesso = true;
    if (fWf)        f.flagWfTramitacao = true;
    applyFilter(f);
  }

  function handleClear() {
    setFNome(''); setFSigla(''); setFProtocolo(false); setFProcesso(false); setFWf(false);
    applyFilter({});
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tipos de Documento</h1>
          <p className="page-subtitle">Catálogo de tipos de documento do sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '1 1 220px', margin: 0 }}>
            <label className="field-label">Nome</label>
            <input className="input" value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Ex: Ofício, Memorando..." />
          </div>
          <div className="field" style={{ flex: '0 1 140px', margin: 0 }}>
            <label className="field-label">Sigla</label>
            <input className="input" value={fSigla} onChange={e => setFSigla(e.target.value.toUpperCase())} placeholder="OF, MEM..." />
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={fProtocolo} onChange={e => setFProtocolo(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
              Protocolo
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={fProcesso} onChange={e => setFProcesso(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
              Processo
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={fWf} onChange={e => setFWf(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
              WF Tramitação
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleClear}>Limpar</button>
            <button type="submit" className="btn btn-primary btn-sm">
              <IconSearch size={13} /> Pesquisar
            </button>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Tipos {total > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>[{total}]</span>}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <IconPlus size={13} /> Novo tipo
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 20px', color: 'var(--danger-500)', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Sigla</th>
                <th>Nome</th>
                <th style={{ width: 100, textAlign: 'center' }}>Aplicável a</th>
                <th style={{ width: 80, textAlign: 'center' }}>Protocolo</th>
                <th style={{ width: 80, textAlign: 'center' }}>Processo</th>
                <th style={{ width: 90, textAlign: 'center' }}>WF Tram.</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {[80, undefined, 100, 80, 80, 90, 40].map((w, j) => (
                      <td key={j} style={{ width: w }}>
                        <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">Nenhum tipo de documento encontrado.</td></tr>
              ) : (
                data.map((row: TipoDocumento) => (
                  <tr
                    key={row.codigo}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openEdit(row)}
                  >
                    <td>
                      <b style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>
                        {row.sigla ?? '—'}
                      </b>
                    </td>
                    <td>
                      <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{row.nome ?? '—'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{tipoBaseBadge(row.tipoDocumentoBase)}</td>
                    <td style={{ textAlign: 'center' }}>{flagBadge(row.flagProtocolo)}</td>
                    <td style={{ textAlign: 'center' }}>{flagBadge(row.flagProcesso)}</td>
                    <td style={{ textAlign: 'center' }}>{flagBadge(row.flagWfTramitacao)}</td>
                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <IconChevronRight size={14} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={goToPage} />
      </div>
    </div>
  );
}

