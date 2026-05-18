import { useCallback, useContext, useEffect, useState } from 'react';

import { DependencyInjectionContext } from '../../infra/contexts/inject';
import { TipoInteressado } from './models/tipoInteressado.model';
import { ColumnDef } from '../../infra/components/data_table';

export function useTipoInteressadosViewModel() {
  const deps = useContext(DependencyInjectionContext);
  const service = (deps as any)?.TipoInteressadosService;

  const [data, setData] = useState<TipoInteressado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    setError(null);
    try {
      setData(await service.findAll());
    } catch {
      setError('Não foi possível carregar tipoInteressados.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(); }, [load]);

  const columns: ColumnDef<TipoInteressado>[] = [
    { key: 'codigo', header: 'Código', render: (r) => r.codigo, monospace: true, align: 'center', width: 80 },
    { key: 'descricao', header: 'descricao', render: (r) => r.descricao ?? '—' },
    { key: 'sigla', header: 'sigla', render: (r) => r.sigla ?? '—' },
  ];

  return { data, loading, error, columns, reload: load };
}
