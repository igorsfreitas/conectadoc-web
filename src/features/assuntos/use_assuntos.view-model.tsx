import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { ColumnDef } from '../../infra/components/data_table';
import { Assunto } from './models/assunto.model';

const DEFAULT_LIMIT = 20;

export function useAssuntosViewModel() {
  const service = useInject('AssuntosService');

  const [data, setData]         = useState<Assunto[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.findAll(p, DEFAULT_LIMIT);
      setData(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch {
      setError('Não foi possível carregar assuntos.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(page); }, [load, page]);

  function goToPage(p: number) {
    setPage(p);
  }

  const columns: ColumnDef<Assunto>[] = [
    { key: 'codigo', header: 'Código', render: (r) => r.codigo, monospace: true, align: 'center', width: 80 },
    { key: 'descricao', header: 'Descrição', render: (r) => r.descricao ?? '—' },
    { key: 'classificacao', header: 'Classificação', render: (r) => r.classificacao?.nome ?? '—', width: 200 },
    { key: 'anosPrescricao', header: 'Anos de Prescrição', render: (r) => r.anosPrescricao ?? '—', align: 'center', width: 160 },
  ];

  return {
    data, loading, error, columns,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    goToPage,
    reload: () => load(page),
  };
}
