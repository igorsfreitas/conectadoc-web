import { FormEvent, useState } from 'react';
import { useAssuntosViewModel } from '../../use_assuntos.view-model';
import { Pagination } from '../../../../infra/components/pagination';
import { Dialog } from '../../../../infra/components/dialog';

// ── Trash icon ────────────────────────────────────────────────────────────────
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

// ── Create dialog ─────────────────────────────────────────────────────────────
function CreateAssuntoDialog({
  open,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (descricao: string, anosPrescricao: number | null, flagGeral: number) => void;
}) {
  const [descricao, setDescricao]         = useState('');
  const [anos, setAnos]                   = useState('');
  const [geral, setGeral]                 = useState(false);

  function reset() {
    setDescricao('');
    setAnos('');
    setGeral(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!descricao.trim()) return;
    onSubmit(
      descricao.trim(),
      anos !== '' ? parseInt(anos, 10) : null,
      geral ? 1 : 0,
    );
    reset();
  }

  return (
    <Dialog open={open} title="Novo Assunto" onClose={handleClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: '#fef2f2', color: '#dc2626',
            fontSize: 13, border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}

        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">
            Descrição <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            className="input"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Ex.: Contratos e Convênios"
            required
            autoFocus
          />
        </div>

        <div className="field" style={{ margin: 0 }}>
          <label className="field-label">Anos de Prescrição</label>
          <input
            className="input"
            type="number"
            min={0}
            value={anos}
            onChange={e => setAnos(e.target.value)}
            placeholder="Ex.: 5"
            style={{ width: 120 }}
          />
        </div>

        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', userSelect: 'none', fontSize: 14,
          color: 'var(--text, #111)',
        }}>
          <input
            type="checkbox"
            checked={geral}
            onChange={e => setGeral(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--brand-600, #2563eb)' }}
          />
          <span>
            <strong>Assunto geral</strong>
            <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--text-3, #6b7280)' }}>
              — visível para todos os setores
            </span>
          </span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || !descricao.trim()}>
            {saving ? 'Salvando…' : 'Criar Assunto'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

// ── Delete confirm dialog ─────────────────────────────────────────────────────
function DeleteConfirmDialog({
  name,
  open,
  deleting,
  onClose,
  onConfirm,
}: {
  name: string;
  open: boolean;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} title="Excluir Assunto" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text, #111)', lineHeight: 1.6 }}>
          Tem certeza que deseja excluir o assunto{' '}
          <strong>"{name}"</strong>?{' '}
          <span style={{ color: 'var(--text-3, #6b7280)' }}>
            Esta ação não pode ser desfeita.
          </span>
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={deleting}>
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={deleting}
            style={{ background: '#dc2626', color: '#fff', border: 'none' }}
          >
            {deleting ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function AssuntosPage() {
  const vm = useAssuntosViewModel();

  const handleCreate = (descricao: string, anosPrescricao: number | null, flagGeral: number) => {
    void vm.createAssunto({ descricao, anosPrescricao, flagGeral });
  };

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assuntos</h1>
          <p className="page-subtitle">Tabela de assuntos documentais</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ height: 36, fontSize: 13 }}
          onClick={() => { vm.setSaveError(null); vm.setShowCreate(true); }}
        >
          + Novo Assunto
        </button>
      </div>

      {vm.error && (
        <div style={{ marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{vm.error}</div>
      )}

      <div className="card">
        <table className="data">
          <thead>
            <tr>
              {vm.columns.map(col => (
                <th key={col.key} style={{ width: col.width, textAlign: col.align ?? 'left' }}>
                  {col.header}
                </th>
              ))}
              {/* Actions column */}
              <th style={{ width: 52 }} />
            </tr>
          </thead>
          <tbody>
            {vm.loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {vm.columns.map(col => (
                    <td key={col.key}>
                      <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '70%' }} />
                    </td>
                  ))}
                  <td />
                </tr>
              ))
            ) : vm.data.length === 0 ? (
              <tr>
                <td colSpan={vm.columns.length + 1} className="empty-state">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              vm.data.map((row, index) => (
                <tr key={row.codigo}>
                  {vm.columns.map(col => (
                    <td key={col.key} style={{ textAlign: col.align ?? 'left' }}
                        className={col.monospace ? 'num' : undefined}>
                      {col.render(row, index)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="icon-btn"
                      title="Excluir"
                      onClick={() => vm.setConfirmDelete(row)}
                      style={{ color: '#dc2626' }}
                    >
                      <IconTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          page={vm.page}
          totalPages={vm.totalPages}
          total={vm.total}
          limit={vm.limit}
          onPageChange={vm.goToPage}
        />
      </div>

      {/* ── Dialogs ── */}
      <CreateAssuntoDialog
        open={vm.showCreate}
        saving={vm.saving}
        error={vm.saveError}
        onClose={() => vm.setShowCreate(false)}
        onSubmit={handleCreate}
      />

      <DeleteConfirmDialog
        open={!!vm.confirmDelete}
        name={vm.confirmDelete?.descricao ?? ''}
        deleting={vm.deleting}
        onClose={() => vm.setConfirmDelete(null)}
        onConfirm={() => { if (vm.confirmDelete) void vm.removeAssunto(vm.confirmDelete.codigo); }}
      />
    </div>
  );
}
