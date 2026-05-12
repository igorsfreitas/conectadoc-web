import { FormEvent, useState, useEffect, useRef } from 'react';
import { Dialog } from '../../../../infra/components/dialog';
import { useHierarquiaViewModel } from '../../use_hierarquia.view-model';
import { HierarquiaSegmento } from '../../models/hierarquia.model';

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
  row: HierarquiaSegmento;
  onEdit: (r: HierarquiaSegmento) => void;
  onDelete: (r: HierarquiaSegmento) => void;
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

export function HierarquiaPage() {
  const {
    data, loading, saving, error,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
  } = useHierarquiaViewModel();

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
          <h1 className="page-title">Configuração</h1>
          <p className="page-subtitle">Hierarquias de segmento organizacional</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Hierarquia de Unidades</h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <IconPlus size={13} /> Nova hierarquia
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
              <th style={{ width: 120 }}>Unidades</th>
              <th style={{ width: 120 }}>Servidores</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {[50, undefined, 120, 120, 60].map((w, j) => (
                    <td key={j} style={{ width: w }}>
                      <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '60%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">Nenhuma hierarquia cadastrada.</td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.codigo}>
                  <td><span className="num">{i + 1}</span></td>
                  <td><b>{row.nome ?? '—'}</b></td>
                  <td><span className="num">—</span></td>
                  <td><span className="num">—</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <RowMenu row={row} onEdit={openEdit} onDelete={openDelete} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit */}
      <Dialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        title={dialogMode === 'create' ? 'Nova hierarquia' : 'Editar hierarquia'}
        onClose={closeDialog}
      >
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label className="field-label">Nome <span style={{ color: 'var(--danger-500)' }}>*</span></label>
            <input
              className="input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: SECRETARIA"
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
      <Dialog open={dialogMode === 'delete'} title="Excluir hierarquia" onClose={closeDialog}>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-2)' }}>
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
