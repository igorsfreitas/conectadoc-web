import { FormEvent, useEffect, useState } from 'react';

import { Dialog } from '../../../../infra/components/dialog';
import { Pagination } from '../../../../infra/components/pagination';
import { usePerfisViewModel } from '../../use_perfis.view-model';
import { CasoUsoSimple, Perfil } from '../../models/perfil.model';
import { useInject } from '../../../../infra/hooks/inject';

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
function IconTrash({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}
function IconShield({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

// ── Row menu ───────────────────────────────────────────────────────────────
function RowMenu({ row, onEdit, onDelete }: {
  row: Perfil;
  onEdit: (r: Perfil) => void;
  onDelete: (r: Perfil) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><IconMore /></button>
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

// ── Casos de Uso dialog ────────────────────────────────────────────────────
function CasosDeUsoDialog({
  perfil, ucList, ucLoading, saving, error,
  onAdd, onRemove, onClose,
}: {
  perfil: Perfil;
  ucList: CasoUsoSimple[];
  ucLoading: boolean;
  saving: boolean;
  error: string | null;
  onAdd: (ucId: number) => void;
  onRemove: (ucId: number) => void;
  onClose: () => void;
}) {
  const casoUsoService = useInject('CasoUsoService');
  const [allUcs, setAllUcs]     = useState<CasoUsoSimple[]>([]);
  const [selectId, setSelectId] = useState('');

  useEffect(() => {
    casoUsoService.findAllSimple().then(setAllUcs).catch(() => {});
  }, [casoUsoService]);

  const assignedIds = new Set(ucList.map(u => u.codigo));
  const available   = allUcs.filter(u => !assignedIds.has(u.codigo));

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const id = Number(selectId);
    if (!id) return;
    onAdd(id);
    setSelectId('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--danger-50,#fef2f2)', color: 'var(--danger-500)', fontSize: 13 }}>{error}</div>
      )}

      {/* Adicionar */}
      {available.length > 0 && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="input"
            value={selectId}
            onChange={e => setSelectId(e.target.value)}
            style={{ flex: 1 }}
            required
          >
            <option value="">Selecione um caso de uso…</option>
            {available.map(u => (
              <option key={u.codigo} value={u.codigo}>
                {u.sigla} — {u.nome}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !selectId}>
            <IconPlus size={12} /> Adicionar
          </button>
        </form>
      )}

      {/* Lista atual */}
      {ucLoading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Carregando…</div>
      ) : ucList.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
          Nenhum caso de uso vinculado.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 120 }}>Sigla</th>
                <th>Nome</th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {ucList.map(u => (
                <tr key={u.codigo}>
                  <td>
                    <b style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{u.sigla ?? '—'}</b>
                  </td>
                  <td style={{ color: 'var(--text)' }}>{u.nome ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="icon-btn"
                      title="Remover"
                      disabled={saving}
                      onClick={() => onRemove(u.codigo)}
                      style={{ color: 'var(--danger-500)' }}
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
        <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export function PerfisPage() {
  const {
    data, loading, saving, error,
    page, totalPages, total, limit,
    dialogMode, selected,
    ucList, ucLoading,
    openCreate, openEdit, openDelete, openCasosDeUso, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    addCasoDeUso, removeCasoDeUso,
    goToPage, applyFilter,
  } = usePerfisViewModel();

  const [form, setForm] = useState('');
  const [fNome, setFNome] = useState('');

  useEffect(() => {
    if (dialogMode === 'edit' && selected) setForm(selected.nome ?? '');
    else if (dialogMode === 'create') setForm('');
  }, [dialogMode, selected]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    applyFilter(fNome ? { nome: fNome } : {});
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (dialogMode === 'create') await handleCreate({ nome: form });
    else if (dialogMode === 'edit') await handleUpdate({ nome: form });
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Perfis</h1>
          <p className="page-subtitle">Grupos de permissões atribuídos aos usuários</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '1 1 240px', margin: 0 }}>
            <label className="field-label">Nome</label>
            <input className="input" value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Ex: Administrador…" />
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setFNome(''); applyFilter({}); }}>Limpar</button>
            <button type="submit" className="btn btn-primary btn-sm"><IconSearch size={13} /> Pesquisar</button>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Perfis {total > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>[{total}]</span>}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <IconPlus size={13} /> Novo perfil
          </button>
        </div>

        {error && dialogMode === null && (
          <div style={{ padding: '12px 20px', color: 'var(--danger-500)', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ width: 160, textAlign: 'center' }}>Casos de Uso</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[undefined, 160, 50].map((w, j) => (
                      <td key={j} style={{ width: w }}>
                        <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={3} className="empty-state">Nenhum perfil encontrado.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.codigo}>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>{row.nome ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => openCasosDeUso(row)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20,
                          background: row.totalCasosDeUso > 0 ? 'var(--primary-soft, #eff6ff)' : 'var(--surface-2)',
                          color: row.totalCasosDeUso > 0 ? 'var(--primary, #2563eb)' : 'var(--text-3)',
                          border: '1px solid',
                          borderColor: row.totalCasosDeUso > 0 ? 'var(--primary-200, #bfdbfe)' : 'var(--border)',
                          cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                        }}
                      >
                        <IconShield size={12} />
                        {row.totalCasosDeUso} {row.totalCasosDeUso === 1 ? 'caso' : 'casos'}
                      </button>
                    </td>
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
        title={dialogMode === 'create' ? 'Novo perfil' : 'Editar perfil'}
        onClose={closeDialog}
      >
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--danger-50,#fef2f2)', color: 'var(--danger-500)', fontSize: 13 }}>{error}</div>
          )}
          <div className="field">
            <label className="field-label">
              Nome <span style={{ color: 'var(--danger-500)' }}>*</span>
            </label>
            <input
              className="input"
              value={form}
              onChange={e => setForm(e.target.value)}
              placeholder="Ex: Administrador"
              required
              autoFocus
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
      <Dialog open={dialogMode === 'delete'} title="Excluir perfil" onClose={closeDialog}>
        <p style={{ margin: '0 0 4px', fontSize: 13.5, color: 'var(--text-2)' }}>
          Confirma a exclusão de <b>{selected?.nome}</b>?
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12.5, color: 'var(--danger-500)' }}>
          Atenção: todos os vínculos com casos de uso serão removidos.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={closeDialog} disabled={saving}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </Dialog>

      {/* Casos de Uso dialog */}
      <Dialog
        open={dialogMode === 'casos-de-uso'}
        title={`Casos de uso — ${selected?.nome ?? ''}`}
        onClose={closeDialog}
      >
        {selected && (
          <CasosDeUsoDialog
            perfil={selected}
            ucList={ucList}
            ucLoading={ucLoading}
            saving={saving}
            error={dialogMode === 'casos-de-uso' ? error : null}
            onAdd={addCasoDeUso}
            onRemove={removeCasoDeUso}
            onClose={closeDialog}
          />
        )}
      </Dialog>
    </div>
  );
}
