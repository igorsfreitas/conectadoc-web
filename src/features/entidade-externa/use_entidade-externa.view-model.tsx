import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { TipoEntidadeExterna } from '../tipo-entidade-externa/models/tipo-entidade-externa.model';
import {
  EntidadeExterna,
  CreateEntidadeExternaPayload,
  UpdateEntidadeExternaPayload,
} from './models/entidade-externa.model';

export type DialogMode = 'create' | 'edit' | 'delete' | null;

const DEFAULT_LIMIT = 20;

export function useEntidadeExternaViewModel() {
  const service      = useInject('EntidadeExternaService');
  const tipoService  = useInject('TipoEntidadeExternaService');

  const [data, setData]             = useState<EntidadeExterna[]>([]);
  const [tipos, setTipos]           = useState<TipoEntidadeExterna[]>([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selected, setSelected]     = useState<EntidadeExterna | null>(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const loadTipos = useCallback(async () => {
    try {
      const res = await tipoService.findAll(1, 100);
      setTipos(res.data);
    } catch {
      // non-blocking — tipos são opcionais no form
    }
  }, [tipoService]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.findAll(p, DEFAULT_LIMIT);
      setData(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Não foi possível carregar as entidades externas.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(page); }, [load, page]);
  useEffect(() => { loadTipos(); }, [loadTipos]);

  function goToPage(p: number) { setPage(p); }
  function openCreate() { setSelected(null); setDialogMode('create'); }
  function openEdit(row: EntidadeExterna) { setSelected(row); setDialogMode('edit'); }
  function openDelete(row: EntidadeExterna) { setSelected(row); setDialogMode('delete'); }
  function closeDialog() { setDialogMode(null); setSelected(null); }

  async function handleCreate(payload: CreateEntidadeExternaPayload) {
    setSaving(true);
    try {
      await service.create(payload);
      closeDialog();
      await load(page);
    } catch {
      setError('Erro ao criar entidade externa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload: UpdateEntidadeExternaPayload) {
    if (!selected) return;
    setSaving(true);
    try {
      await service.update(selected.codigo, payload);
      closeDialog();
      await load(page);
    } catch {
      setError('Erro ao atualizar entidade externa.');
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
      setError('Erro ao remover entidade externa.');
    } finally {
      setSaving(false);
    }
  }

  return {
    data, tipos, loading, saving, error,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    goToPage,
  };
}
