import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { ColumnDef } from '../../infra/components/data_table';
import { HierarquiaSegmento } from './models/hierarquia.model';

export function useHierarquiaViewModel() {
  const service = useInject('HierarquiaService');

  const [data, setData] = useState<HierarquiaSegmento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.findAll());
    } catch {
      setError('Não foi possível carregar as hierarquias.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(); }, [load]);

  const columns: ColumnDef<HierarquiaSegmento>[] = [
    { key: 'codigo', header: 'Código', render: (r) => r.codigo, monospace: true, align: 'center', width: 100 },
    { key: 'nome', header: 'Nome', render: (r) => r.nome ?? '—' },
  ];

  return { data, loading, error, columns, reload: load };
}
