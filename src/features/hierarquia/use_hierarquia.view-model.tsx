import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { ColumnDef } from '../../infra/components/data_table';
import { HierarquiaSegmento, CreateHierarquiaPayload, UpdateHierarquiaPayload } from './models/hierarquia.model';

export type DialogMode = 'create' | 'edit' | 'delete' | null;

const DEFAULT_LIMIT = 20;

export function useHierarquiaViewModel() {
  const service = useInject('HierarquiaService');

  const [data, setData]             = useState<HierarquiaSegmento[]>([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selected, setSelected]     = useState<HierarquiaSegmento | null>(null);
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
      setError('Não foi possível carregar as hierarquias.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(page); }, [load, page]);

  function goToPage(p: number) { setPage(p); }

  function openCreate() { setSelected(null); setDialogMode('create'); }
  function openEdit(row: HierarquiaSegmento) { setSelected(row); setDialogMode('edit'); }
  function openDelete(row: HierarquiaSegmento) { setSelected(row); setDialogMode('delete'); }
  function closeDialog() { setDialogMode(null); setSelected(null); }

  async function handleCreate(payload: CreateHierarquiaPayload) {
    setSaving(true);
    try {
      await service.create(payload);
      closeDialog();
      await load(page);
    } catch {
      setError('Erro ao criar hierarquia.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload: UpdateHierarquiaPayload) {
    if (!selected) return;
    setSaving(true);
    try {
      await service.update(selected.codigo, payload);
      closeDialog();
      await load(page);
    } catch {
      setError('Erro ao atualizar hierarquia.');
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
      // if last item on page, go back one
      const newPage = data.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      await load(newPage);
    } catch {
      setError('Erro ao remover hierarquia.');
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnDef<HierarquiaSegmento>[] = [
    { key: 'codigo', header: 'Código', render: (r) => r.codigo, monospace: true, align: 'center', width: 100 },
    { key: 'nome', header: 'Nome', render: (r) => r.nome ?? '—' },
  ];

  return {
    data, loading, saving, error, columns,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    goToPage,
    reload: () => load(page),
  };
}
