import { FormEvent, useState, useEffect, useRef } from 'react';

import { Dialog } from '../../../../infra/components/dialog';
import { Pagination } from '../../../../infra/components/pagination';
import { useTipoEntidadeExternaViewModel } from '../../use_tipo-entidade-externa.view-model';
import { TipoEntidadeExterna } from '../../models/tipo-entidade-externa.model';

function IconPlus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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

function RowMenu({ row, onEdit, onDelete }: {
  row: TipoEntidadeExterna;
  onEdit: (r: TipoEntidadeExterna) => void;
  onDelete: (r: TipoEntidadeExterna) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}>
        <IconMore size={14} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          minWidth: 140, padding: '4px 0',
        }}>
          <button onClick={() => { onEdit(row); setOpen(false); }} style={{
            display: 'block', width: '100%', padding: '8px 14px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontSize: 13.5, color: 'var(--text)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            Editar
          </button>
          <button onClick={() => { onDelete(row); setOpen(false); }} style={{
            display: 'block', width: '100%', padding: '8px 14px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontSize: 13.5, color: 'var(--danger-500)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

export function TipoEntidadeExternaPage() {
  const {
    data, loading, saving, error,
    page, totalPages, total, limit, goToPage,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
  } = useTipoEntidadeExternaViewModel();

  const [nome, setNome] = useState('');

  useEffect(() => {
    setNome(dialogMode === 'edit' && selected ? (selected.nome ?? '') : '');
  }, [dialogMode, selected]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (dialogMode === 'create') await handleCreate({ nome });
    else if (dialogMode === 'edit') await handleUpdate({ nome });
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tipo de Entidade Externa</h1>
          <p className="page-subtitle">Tipos de classificação de entidades externas</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tipos {total > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>[{total}]</span>}</h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <IconPlus size={13} /> Novo tipo
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 20px', color: 'var(--danger-500)', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Nome</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {[50, undefined, 60].map((w, j) => (
                    <td key={j} style={{ width: w }}>
                      <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state">Nenhum tipo cadastrado.</td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.codigo}>
                  <td><span className="num">{(page - 1) * limit + i + 1}</span></td>
                  <td><b>{row.nome ?? '—'}</b></td>
                  <td style={{ textAlign: 'right' }}>
                    <RowMenu row={row} onEdit={openEdit} onDelete={openDelete} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={goToPage} />
      </div>

      {/* Create / Edit */}
      <Dialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        title={dialogMode === 'create' ? 'Novo tipo' : 'Editar tipo'}
        onClose={closeDialog}
      >
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label className="field-label">Nome <span style={{ color: 'var(--danger-500)' }}>*</span></label>
            <input
              className="input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: ASSOCIAÇÃO"
              required
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={closeDialog} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={dialogMode === 'delete'} title="Excluir tipo" onClose={closeDialog}>
        <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--text-2)' }}>
          Confirma a exclusão de <b>{selected?.nome}</b>? Esta ação não pode ser desfeita.
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
