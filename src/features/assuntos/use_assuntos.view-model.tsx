import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { ColumnDef } from '../../infra/components/data_table';
import { Assunto } from './models/assunto.model';

export function useAssuntosViewModel() {
  const service = useInject('AssuntosService');

  const [data, setData] = useState<Assunto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.findAll());
    } catch {
      setError('Não foi possível carregar assuntos.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(); }, [load]);

  const columns: ColumnDef<Assunto>[] = [
    { key: 'codigo', header: 'Código', render: (r) => r.codigo, monospace: true, align: 'center', width: 80 },
    { key: 'descricao', header: 'Descrição', render: (r) => r.descricao ?? '—' },
    { key: 'classificacao', header: 'Classificação', render: (r) => r.classificacao?.nome ?? '—', width: 200 },
    { key: 'anosPrescricao', header: 'Anos de Prescrição', render: (r) => r.anosPrescricao ?? '—', align: 'center', width: 160 },
  ];

  return { data, loading, error, columns, reload: load };
}
