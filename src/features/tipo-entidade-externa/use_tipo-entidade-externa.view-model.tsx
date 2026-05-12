import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { TipoEntidadeExterna, CreateTipoEntidadeExternaPayload, UpdateTipoEntidadeExternaPayload } from './models/tipo-entidade-externa.model';

export type DialogMode = 'create' | 'edit' | 'delete' | null;

const DEFAULT_LIMIT = 20;

export function useTipoEntidadeExternaViewModel() {
  const service = useInject('TipoEntidadeExternaService');

  const [data, setData]             = useState<TipoEntidadeExterna[]>([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selected, setSelected]     = useState<TipoEntidadeExterna | null>(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.findAll(p, DEFAULT_LIMIT);
      setData(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Não foi possível carregar os tipos de entidade externa.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(page); }, [load, page]);

  function goToPage(p: number) { setPage(p); }
  function openCreate() { setSelected(null); setDialogMode('create'); }
  function openEdit(row: TipoEntidadeExterna) { setSelected(row); setDialogMode('edit'); }
  function openDelete(row: TipoEntidadeExterna) { setSelected(row); setDialogMode('delete'); }
  function closeDialog() { setDialogMode(null); setSelected(null); }

  async function handleCreate(payload: CreateTipoEntidadeExternaPayload) {
    setSaving(true);
    try {
      await service.create(payload);
      closeDialog();
      await load(page);
    } catch {
      setError('Erro ao criar tipo de entidade externa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload: UpdateTipoEntidadeExternaPayload) {
    if (!selected) return;
    setSaving(true);
    try {
      await service.update(selected.codigo, payload);
      closeDialog();
      await load(page);
    } catch {
      setError('Erro ao atualizar tipo de entidade externa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try {
      await service.remove(selected.codigo);
      closeDialog();
      const newPage = data.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      await load(newPage);
    } catch {
      setError('Erro ao remover tipo de entidade externa.');
    } finally {
      setSaving(false);
    }
  }

  return {
    data, loading, saving, error,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    goToPage,
  };
}
