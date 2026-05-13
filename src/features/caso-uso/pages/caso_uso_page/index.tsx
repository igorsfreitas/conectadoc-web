import { FormEvent, useEffect, useState } from 'react';

import { Dialog } from '../../../../infra/components/dialog';
import { Pagination } from '../../../../infra/components/pagination';
import { useCasoUsoViewModel } from '../../use_caso-uso.view-model';
import { CasoUso, CasoUsoFilter } from '../../models/caso-uso.model';

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
function IconMore({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  );
}

// ── Row menu ───────────────────────────────────────────────────────────────
function RowMenu({ row, onEdit, onDelete }: {
  row: CasoUso;
  onEdit: (r: CasoUso) => void;
  onDelete: (r: CasoUso) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><IconMore size={14} /></button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', minWidth: 130, padding: '4px 0' }}>
            <button onClick={() => { onEdit(row); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13.5, color: 'var(--text)' }} onMouseEnter={e => (e.currentTarget.style.background='var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background='none')}>Editar</button>
            <button onClick={() => { onDelete(row); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13.5, color: 'var(--danger-500)' }} onMouseEnter={e => (e.currentTarget.style.background='var(--danger-50,#fef2f2)')} onMouseLeave={e => (e.currentTarget.style.background='none')}>Excluir</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Form state ─────────────────────────────────────────────────────────────
interface FormState { sigla: string; nome: string; }
const emptyForm = (): FormState => ({ sigla: '', nome: '' });
const fromEntity = (e: CasoUso): FormState => ({ sigla: e.sigla ?? '', nome: e.nome ?? '' });

// ── Page ───────────────────────────────────────────────────────────────────
export function CasoUsoPage() {
  const {
    data, loading, saving, error,
    page, totalPages, total, limit,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    goToPage, applyFilter,
  } = useCasoUsoViewModel();

  const [form, setForm]   = useState<FormState>(emptyForm());
  const [fSigla, setFSigla] = useState('');
  const [fNome, setFNome]   = useState('');

  useEffect(() => {
    if (dialogMode === 'edit' && selected) setForm(fromEntity(selected));
    else if (dialogMode === 'create') setForm(emptyForm());
  }, [dialogMode, selected]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const f: CasoUsoFilter = {};
    if (fSigla) f.sigla = fSigla;
    if (fNome)  f.nome  = fNome;
    applyFilter(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { sigla: form.sigla.toUpperCase(), nome: form.nome || undefined };
    if (dialogMode === 'create') await handleCreate(payload);
    else if (dialogMode === 'edit') await handleUpdate(payload);
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Casos de Uso</h1>
          <p className="page-subtitle">Permissões e acessos disponíveis no sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '0 1 160px', margin: 0 }}>
            <label className="field-label">Sigla</label>
            <input className="input" value={fSigla} onChange={e => setFSigla(e.target.value.toUpperCase())} placeholder="ADM, ARQUIV..." />
          </div>
          <div className="field" style={{ flex: '1 1 240px', margin: 0 }}>
            <label className="field-label">Nome</label>
            <input className="input" value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Ex: Arquivologia..." />
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setFSigla(''); setFNome(''); applyFilter({}); }}>Limpar</button>
            <button type="submit" className="btn btn-primary btn-sm"><IconSearch size={13} /> Pesquisar</button>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Casos de Uso {total > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>[{total}]</span>}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <IconPlus size={13} /> Novo caso de uso
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
                <th style={{ width: 140 }}>Sigla</th>
                <th>Nome</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[140, undefined, 50].map((w, j) => (
                      <td key={j} style={{ width: w }}>
                        <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="empty-state">Nenhum caso de uso encontrado.</td></tr>
              ) : (
                data.map((row: CasoUso) => (
                  <tr key={row.codigo}>
                    <td>
                      <b style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, letterSpacing: '.03em' }}>
                        {row.sigla ?? '—'}
                      </b>
                    </td>
                    <td style={{ color: 'var(--text)' }}>{row.nome ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <RowMenu row={row} onEdit={openEdit} onDelete={openDelete} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={goToPage} />
      </div>

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        title={dialogMode === 'create' ? 'Novo caso de uso' : 'Editar caso de uso'}
        onClose={closeDialog}
      >
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="field-label">
              Sigla <span style={{ color: 'var(--danger-500)' }}>*</span>
            </label>
            <input
              className="input"
              value={form.sigla}
              onChange={e => set('sigla', e.target.value.toUpperCase())}
              placeholder="Ex: ADM"
              required
              autoFocus
              style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '.04em' }}
            />
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-3)' }}>
              Identificador único de permissão. Será usado nas regras de acesso.
            </p>
          </div>

          <div className="field">
            <label className="field-label">Nome</label>
            <input
              className="input"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Administração"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={closeDialog} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={dialogMode === 'delete'} title="Excluir caso de uso" onClose={closeDialog}>
        <p style={{ margin: '0 0 4px', fontSize: 13.5, color: 'var(--text-2)' }}>
          Confirma a exclusão de <b style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selected?.sigla}</b>?
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--danger-500)' }}>
          Atenção: remover um caso de uso pode afetar perfis que dependem desta permissão.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={closeDialog} disabled={saving}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
