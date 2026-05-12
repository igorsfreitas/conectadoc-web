import { FormEvent, useState, useEffect } from 'react';
import { DataTable } from '../../../../infra/components/data_table';
import { Dialog } from '../../../../infra/components/dialog';
import { useHierarquiaViewModel } from '../../use_hierarquia.view-model';
import styles from './style.module.scss';

export function HierarquiaPage() {
  const {
    data, loading, saving, error, columns,
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

  const actionColumn = {
    key: '_actions',
    header: '',
    width: 120,
    render: (row: typeof data[0]) => (
      <div className={styles.actions}>
        <button className={styles.btnEdit} onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Editar</button>
        <button className={styles.btnDelete} onClick={(e) => { e.stopPropagation(); openDelete(row); }}>Excluir</button>
      </div>
    ),
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Hierarquias</h1>
        <button className={styles.btnPrimary} onClick={openCreate}>+ Nova hierarquia</button>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      <DataTable
        columns={[...columns, actionColumn]}
        data={data}
        keyExtractor={(r) => r.codigo}
        loading={loading}
      />

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        title={dialogMode === 'create' ? 'Nova hierarquia' : 'Editar hierarquia'}
        onClose={closeDialog}
      >
        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.field}>
            Nome
            <input
              className={styles.input}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: SECRETARIA"
              required
              autoFocus
            />
          </label>
          <div className={styles.formActions}>
            <button type="button" className={styles.btnSecondary} onClick={closeDialog} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={dialogMode === 'delete'}
        title="Excluir hierarquia"
        onClose={closeDialog}
      >
        <p className={styles.confirmText}>
          Confirma a exclusão de <strong>{selected?.nome}</strong>?
        </p>
        <div className={styles.formActions}>
          <button className={styles.btnSecondary} onClick={closeDialog} disabled={saving}>
            Cancelar
          </button>
          <button className={styles.btnDanger} onClick={handleDelete} disabled={saving}>
            {saving ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
