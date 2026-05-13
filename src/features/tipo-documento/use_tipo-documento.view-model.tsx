import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useInject } from '../../infra/hooks/inject';
import { TipoDocumento, TipoDocumentoFilter } from './models/tipo-documento.model';
import { afinzAppPaths } from '../../infra/router/paths/afinz_app';

const DEFAULT_LIMIT = 20;

export function useTipoDocumentoListViewModel() {
  const service  = useInject('TipoDocumentoService');
  const navigate = useNavigate();

  const [data, setData]             = useState<TipoDocumento[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [filter, setFilter]         = useState<TipoDocumentoFilter>({});

  const load = useCallback(async (p: number, f: TipoDocumentoFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.findAll(p, DEFAULT_LIMIT, f);
      setData(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Não foi possível carregar os tipos de documento.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(page, filter); }, [load, page, filter]);

  function goToPage(p: number) { setPage(p); }

  function applyFilter(f: TipoDocumentoFilter) {
    setFilter(f);
    setPage(1);
  }

  function openCreate() {
    navigate(`${afinzAppPaths.tipoDocumento.asRoute}/novo`);
  }

  function openEdit(row: TipoDocumento) {
    navigate(`${afinzAppPaths.tipoDocumento.asRoute}/${row.codigo}`);
  }

  return {
    data, loading, error,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    filter,
    openCreate, openEdit,
    goToPage, applyFilter,
  };
}
