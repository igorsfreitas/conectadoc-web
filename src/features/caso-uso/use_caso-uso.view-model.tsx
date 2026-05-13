import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { CasoUso, CasoUsoFilter, CasoUsoPayload } from './models/caso-uso.model';

export type DialogMode = 'create' | 'edit' | 'delete' | null;

const DEFAULT_LIMIT = 50; // lista completa (13 registros no legado)

export function useCasoUsoViewModel() {
  const service = useInject('CasoUsoService');

  const [data, setData]             = useState<CasoUso[]>([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selected, setSelected]     = useState<CasoUso | null>(null);

  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [filter, setFilter]         = useState<CasoUsoFilter>({});

  const load = useCallback(async (p: number, f: CasoUsoFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.findAll(p, DEFAULT_LIMIT, f);
      setData(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Não foi possível carregar os casos de uso.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(page, filter); }, [load, page, filter]);

  function goToPage(p: number) { setPage(p); }

  function applyFilter(f: CasoUsoFilter) {
    setFilter(f);
    setPage(1);
  }

  function openCreate() { setSelected(null); setDialogMode('create'); }
  function openEdit(row: CasoUso) { setSelected(row); setDialogMode('edit'); }
  function openDelete(row: CasoUso) { setSelected(row); setDialogMode('delete'); }
  function closeDialog() { setDialogMode(null); setSelected(null); }

  async function handleCreate(payload: CasoUsoPayload) {
    setSaving(true);
    try {
      await service.create(payload);
      closeDialog();
      await load(page, filter);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao criar caso de uso.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload: Partial<CasoUsoPayload>) {
    if (!selected) return;
    setSaving(true);
    try {
      await service.update(selected.codigo, payload);
      closeDialog();
      await load(page, filter);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao atualizar caso de uso.');
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
      await load(newPage, filter);
    } catch {
      setError('Erro ao remover caso de uso.');
    } finally {
      setSaving(false);
    }
  }

  return {
    data, loading, saving, error,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    filter,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    goToPage, applyFilter,
  };
}
