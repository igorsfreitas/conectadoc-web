import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { ColumnDef } from '../../infra/components/data_table';
import { ItemArquivologia } from './models/hierarquia.model';

export function useHierarquiaViewModel() {
  const service = useInject('HierarquiaService');

  const [data, setData] = useState<ItemArquivologia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.findAll());
    } catch {
      setError('Não foi possível carregar a hierarquia de arquivologia.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { load(); }, [load]);

  const columns: ColumnDef<ItemArquivologia>[] = [
    { key: 'codigoCompleto', header: 'Código', render: (r) => r.codigoCompleto ?? r.codigo ?? '—', monospace: true, width: 120 },
    { key: 'nome', header: 'Nome', render: (r) => r.nome ?? '—' },
    { key: 'tipo', header: 'Tipo', render: (r) => r.tipo ?? '—', align: 'center', width: 80 },
    { key: 'pai', header: 'Item Pai', render: (r) => r.pai?.nome ?? (r.idPai ? `#${r.idPai}` : '—'), width: 200 },
    { key: 'prazoCorrente', header: 'Prazo Corrente', render: (r) => r.prazoCorrente ?? (r.anosCorrente ? `${r.anosCorrente} anos` : '—'), align: 'center', width: 130 },
    { key: 'prazoIntermediario', header: 'Prazo Intermediário', render: (r) => r.prazoIntermediario ?? (r.anosIntermediario ? `${r.anosIntermediario} anos` : '—'), align: 'center', width: 150 },
  ];

  return { data, loading, error, columns, reload: load };
}
