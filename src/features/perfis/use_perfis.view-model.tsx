import { useCallback, useEffect, useState } from 'react';
import { useInject } from '../../infra/hooks/inject';
import { CasoUsoSimple, Perfil, PerfilFilter, PerfilPayload } from './models/perfil.model';

export type DialogMode = 'create' | 'edit' | 'delete' | 'casos-de-uso' | null;

const DEFAULT_LIMIT = 50;

export function usePerfisViewModel() {
  const service = useInject('PerfisService');

  const [data, setData]             = useState<Perfil[]>([]);
  const [loading, setLoading]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selected, setSelected]     = useState<Perfil | null>(null);

  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [filter, setFilter]         = useState<PerfilFilter>({});

  // Casos de uso do perfil selecionado
  const [ucList, setUcList]         = useState<CasoUsoSimple[]>([]);
  const [ucLoading, setUcLoading]   = useState(false);

  const load = useCallback(async (p: number, f: PerfilFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.findAll(p, DEFAULT_LIMIT, f);
      setData(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Não foi possível carregar os perfis.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(page, filter); }, [load, page, filter]);

  function goToPage(p: number) { setPage(p); }
  function applyFilter(f: PerfilFilter) { setFilter(f); setPage(1); }

  function openCreate() { setSelected(null); setDialogMode('create'); }
  function openEdit(row: Perfil) { setSelected(row); setDialogMode('edit'); }
  function openDelete(row: Perfil) { setSelected(row); setDialogMode('delete'); }
  function closeDialog() { setDialogMode(null); setSelected(null); setUcList([]); }

  async function openCasosDeUso(row: Perfil) {
    setSelected(row);
    setDialogMode('casos-de-uso');
    setUcLoading(true);
    try {
      const list = await service.findCasosDeUso(row.codigo);
      setUcList(list);
    } catch {
      setError('Não foi possível carregar os casos de uso do perfil.');
    } finally {
      setUcLoading(false);
    }
  }

  async function handleCreate(payload: PerfilPayload) {
    setSaving(true);
    try {
      await service.create(payload);
      closeDialog();
      await load(page, filter);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao criar perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload: Partial<PerfilPayload>) {
    if (!selected) return;
    setSaving(true);
    try {
      await service.update(selected.codigo, payload);
      closeDialog();
      await load(page, filter);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao atualizar perfil.');
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
      setError('Erro ao remover perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function addCasoDeUso(ucId: number) {
    if (!selected) return;
    setSaving(true);
    try {
      await service.addCasoDeUso(selected.codigo, ucId);
      const list = await service.findCasosDeUso(selected.codigo);
      setUcList(list);
      // Atualiza contagem na lista
      setData(prev => prev.map(p =>
        p.codigo === selected.codigo ? { ...p, totalCasosDeUso: list.length } : p
      ));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao adicionar caso de uso.');
    } finally {
      setSaving(false);
    }
  }

  async function removeCasoDeUso(ucId: number) {
    if (!selected) return;
    setSaving(true);
    try {
      await service.removeCasoDeUso(selected.codigo, ucId);
      const list = await service.findCasosDeUso(selected.codigo);
      setUcList(list);
      setData(prev => prev.map(p =>
        p.codigo === selected.codigo ? { ...p, totalCasosDeUso: list.length } : p
      ));
    } catch {
      setError('Erro ao remover caso de uso.');
    } finally {
      setSaving(false);
    }
  }

  return {
    data, loading, saving, error,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    dialogMode, selected,
    ucList, ucLoading,
    openCreate, openEdit, openDelete, openCasosDeUso, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    addCasoDeUso, removeCasoDeUso,
    goToPage, applyFilter,
  };
}
