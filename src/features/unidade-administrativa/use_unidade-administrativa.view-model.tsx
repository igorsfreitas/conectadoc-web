import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { TipoEntidadeExterna } from '../tipo-entidade-externa/models/tipo-entidade-externa.model';
import { EntidadeExterna } from '../entidade-externa/models/entidade-externa.model';
import {
  UnidadeAdministrativa,
  CreateUnidadeAdministrativaPayload,
  UpdateUnidadeAdministrativaPayload,
  UnidadeAdministrativaFilter,
} from './models/unidade-administrativa.model';
import { HierarquiaSegmento } from '../hierarquia/models/hierarquia.model';

export type DialogMode = 'create' | 'edit' | 'delete' | null;

const DEFAULT_LIMIT = 20;

// Retorna o primeiro código de entidade que corresponde ao tenant atual.
// Heurística: entidade cujo nome contenha "PREFEITURA" ou seja a primeira da lista.
function detectDefaultEntidade(list: EntidadeExterna[]): string {
  const match = list.find(e => e.nome?.toUpperCase().includes('PREFEITURA'));
  return match ? String(match.codigo) : (list[0] ? String(list[0].codigo) : '');
}

export function useUnidadeAdministrativaViewModel() {
  const service          = useInject('UnidadeAdministrativaService');
  const entidadeService  = useInject('EntidadeExternaService');
  const hierarquiaService = useInject('HierarquiaService');

  const [data, setData]               = useState<UnidadeAdministrativa[]>([]);
  const [allUnidades, setAllUnidades] = useState<UnidadeAdministrativa[]>([]);
  const [entidades, setEntidades]     = useState<EntidadeExterna[]>([]);
  const [hierarquias, setHierarquias] = useState<HierarquiaSegmento[]>([]);

  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [dialogMode, setDialogMode]   = useState<DialogMode>(null);
  const [selected, setSelected]       = useState<UnidadeAdministrativa | null>(null);

  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);

  const [filter, setFilter]           = useState<UnidadeAdministrativaFilter>({});
  const [defaultEntidadeCodigo, setDefaultEntidadeCodigo] = useState('');

  // Load support data
  const loadSupport = useCallback(async () => {
    try {
      const [entRes, hierRes, simpleRes] = await Promise.all([
        entidadeService.findAll(1, 200),
        hierarquiaService.findAll(1, 200),
        service.findAllSimple(),
      ]);
      setEntidades(entRes.data);
      setHierarquias(hierRes.data);
      setAllUnidades(simpleRes);
      const defaultCod = detectDefaultEntidade(entRes.data);
      setDefaultEntidadeCodigo(defaultCod);
      // Inicializa o filtro de unidade externa com o tenant atual
      setFilter(prev => ({ ...prev, codigoEntidadeExterna: defaultCod }));
    } catch {
      // non-blocking
    }
  }, [entidadeService, hierarquiaService, service]);

  const load = useCallback(async (p: number, f: UnidadeAdministrativaFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.findAll(p, DEFAULT_LIMIT, f);
      setData(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Não foi possível carregar as unidades administrativas.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { loadSupport(); }, [loadSupport]);
  useEffect(() => { load(page, filter); }, [load, page, filter]);

  function goToPage(p: number) { setPage(p); }

  function applyFilter(f: UnidadeAdministrativaFilter) {
    setFilter(f);
    setPage(1);
  }

  function openCreate() { setSelected(null); setDialogMode('create'); }
  function openEdit(row: UnidadeAdministrativa) { setSelected(row); setDialogMode('edit'); }
  function openDelete(row: UnidadeAdministrativa) { setSelected(row); setDialogMode('delete'); }
  function closeDialog() { setDialogMode(null); setSelected(null); }

  async function handleCreate(payload: CreateUnidadeAdministrativaPayload) {
    setSaving(true);
    try {
      await service.create(payload);
      closeDialog();
      await load(page, filter);
      const simpleRes = await service.findAllSimple();
      setAllUnidades(simpleRes);
    } catch {
      setError('Erro ao criar unidade administrativa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(payload: UpdateUnidadeAdministrativaPayload) {
    if (!selected) return;
    setSaving(true);
    try {
      await service.update(selected.codigo, payload);
      closeDialog();
      await load(page, filter);
    } catch {
      setError('Erro ao atualizar unidade administrativa.');
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
      setError('Erro ao remover unidade administrativa.');
    } finally {
      setSaving(false);
    }
  }

  return {
    data, allUnidades, entidades, hierarquias,
    loading, saving, error,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    filter, defaultEntidadeCodigo,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    goToPage, applyFilter,
  };
}
