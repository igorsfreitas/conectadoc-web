import { useCallback, useEffect, useState } from 'react';

import { useInject } from '../../infra/hooks/inject';
import { ColumnDef } from '../../infra/components/data_table';
import { Assunto, AssuntoPayload } from './models/assunto.model';

const DEFAULT_LIMIT = 20;

export function useAssuntosViewModel() {
  const service = useInject('AssuntosService');

  const [data, setData]         = useState<Assunto[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);

  // Dialog state
  const [showCreate, setShowCreate]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveError, setSaveError]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Assunto | null>(null);
  const [deleting, setDeleting]         = useState(false);

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

  function goToPage(p: number) { setPage(p); }

  async function createAssunto(payload: AssuntoPayload): Promise<boolean> {
    setSaving(true);
    setSaveError(null);
    try {
      await service.create(payload);
      setShowCreate(false);
      await load(page);
      return true;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(typeof msg === 'string' ? msg : 'Erro ao salvar assunto.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function removeAssunto(id: number) {
    setDeleting(true);
    try {
      await service.remove(id);
      setConfirmDelete(null);
      await load(page);
    } catch {
      // keep confirmDelete open so user sees something went wrong
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<Assunto>[] = [
    { key: 'codigo', header: '#', render: (r) => r.codigo, monospace: true, align: 'center', width: 60 },
    { key: 'descricao', header: 'Descrição', render: (r) => r.descricao ?? '—' },
    { key: 'classificacao', header: 'Classificação', render: (r) => r.classificacao?.nome ?? '—', width: 200 },
    {
      key: 'flagGeral',
      header: 'Geral',
      align: 'center',
      width: 80,
      render: (r) =>
        r.flagGeral === 1 ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: '#eff6ff', color: '#2563eb',
            borderRadius: 99, fontSize: 11, fontWeight: 600,
            padding: '2px 8px',
          }}>
            ✓ Sim
          </span>
        ) : (
          <span style={{ color: 'var(--text-3, #9ca3af)', fontSize: 12 }}>—</span>
        ),
    },
    { key: 'anosPrescricao', header: 'Prescrição (anos)', render: (r) => r.anosPrescricao ?? '—', align: 'center', width: 160 },
  ];

  return {
    data, loading, error, columns,
    page, totalPages, total, limit: DEFAULT_LIMIT,
    goToPage,
    reload: () => load(page),
    // create
    showCreate, setShowCreate,
    saving, saveError, setSaveError,
    createAssunto,
    // delete
    confirmDelete, setConfirmDelete,
    deleting, removeAssunto,
  };
}
