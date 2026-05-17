import { FormEvent, useState, useEffect, useRef } from 'react';

import { Dialog } from '../../../../infra/components/dialog';
import { Pagination } from '../../../../infra/components/pagination';
import { useUnidadeAdministrativaViewModel } from '../../use_unidade-administrativa.view-model';
import { UnidadeAdministrativa, UnidadeAdministrativaFilter } from '../../models/unidade-administrativa.model';
import { EntidadeExterna } from '../../../entidade-externa/models/entidade-externa.model';
import { HierarquiaSegmento } from '../../../hierarquia/models/hierarquia.model';

function IconPlus({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconMore({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  );
}
function IconSearch({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function RowMenu({ row, onEdit, onDelete }: {
  row: UnidadeAdministrativa;
  onEdit: (r: UnidadeAdministrativa) => void;
  onDelete: (r: UnidadeAdministrativa) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><IconMore size={14} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', minWidth: 140, padding: '4px 0' }}>
          <button onClick={() => { onEdit(row); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13.5, color: 'var(--text)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>Editar</button>
          <button onClick={() => { onDelete(row); setOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13.5, color: 'var(--danger-500)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-50)')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>Excluir</button>
        </div>
      )}
    </div>
  );
}

function entidadeLabel(list: EntidadeExterna[], codigo: string | null) {
  if (!codigo) return '—';
  return list.find(e => String(e.codigo) === String(codigo))?.nome ?? codigo;
}
function hierarquiaLabel(list: HierarquiaSegmento[], codigo: string | null) {
  if (!codigo) return '—';
  return list.find(h => String(h.codigo) === String(codigo))?.nome ?? codigo;
}
function unidadeLabel(list: UnidadeAdministrativa[], codigoPai: number | null) {
  if (!codigoPai) return '—';
  return list.find(u => u.codigo === codigoPai)?.nome ?? String(codigoPai);
}

interface FormState {
  nome: string;
  sigla: string;
  ativo: boolean;
  protocoloCentral: boolean;
  recebeDocExterno: boolean;
  codigoPai: string;
  codigoHierarquia: string;
  codigoEntidadeExterna: string;
}

function emptyForm(defaultEntidadeCodigo: string): FormState {
  return { nome: '', sigla: '', ativo: true, protocoloCentral: false, recebeDocExterno: false, codigoPai: '', codigoHierarquia: '', codigoEntidadeExterna: defaultEntidadeCodigo };
}
function formFromEntity(e: UnidadeAdministrativa): FormState {
  return {
    nome: e.nome ?? '',
    sigla: e.sigla ?? '',
    ativo: e.flagAtivo !== '0',
    protocoloCentral: e.flagProtocoloCentral === '1',
    recebeDocExterno: e.recebeDocExterno === '1',
    codigoPai: e.codigoPai != null ? String(e.codigoPai) : '',
    codigoHierarquia: e.codigoHierarquia ?? '',
    codigoEntidadeExterna: e.codigoEntidadeExterna ?? '',
  };
}

export function UnidadeAdministrativaPage() {
  const {
    data, allUnidades, entidades, hierarquias,
    loading, saving, error,
    page, totalPages, total, limit, goToPage,
    filter, defaultEntidadeCodigo,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
    applyFilter,
  } = useUnidadeAdministrativaViewModel();

  const [form, setForm] = useState<FormState>(emptyForm(defaultEntidadeCodigo));

  // Sync form when dialog opens
  useEffect(() => {
    if (dialogMode === 'edit' && selected) setForm(formFromEntity(selected));
    else if (dialogMode === 'create') setForm(emptyForm(defaultEntidadeCodigo));
  }, [dialogMode, selected, defaultEntidadeCodigo]);

  // Filter local state
  const [fNome, setFNome]                       = useState('');
  const [fSigla, setFSigla]                     = useState('');
  const [fProtocolo, setFProtocolo]             = useState(false);
  const [fEntidade, setFEntidade]               = useState(defaultEntidadeCodigo);

  // Sync fEntidade when default loads
  useEffect(() => { setFEntidade(defaultEntidadeCodigo); }, [defaultEntidadeCodigo]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const f: UnidadeAdministrativaFilter = {};
    if (fNome)     f.nome = fNome;
    if (fSigla)    f.sigla = fSigla;
    if (fProtocolo) f.protocoloCentral = true;
    if (fEntidade) f.codigoEntidadeExterna = fEntidade;
    applyFilter(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      sigla: form.sigla,
      ativo: form.ativo,
      protocoloCentral: form.protocoloCentral,
      recebeDocExterno: form.recebeDocExterno,
      codigoPai: form.codigoPai || undefined,
      codigoHierarquia: form.codigoHierarquia || undefined,
      codigoEntidadeExterna: form.codigoEntidadeExterna || undefined,
    };
    if (dialogMode === 'create') await handleCreate(payload);
    else if (dialogMode === 'edit') await handleUpdate(payload);
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Unidades Administrativas</h1>
          <p className="page-subtitle">Estrutura organizacional</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 20px', alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: '1 1 200px', margin: 0 }}>
            <label className="field-label">Unidade Administrativa</label>
            <input className="input" value={fNome} onChange={e => setFNome(e.target.value)} placeholder="Nome..." />
          </div>
          <div className="field" style={{ flex: '0 1 120px', margin: 0 }}>
            <label className="field-label">Sigla</label>
            <input className="input" value={fSigla} onChange={e => setFSigla(e.target.value)} placeholder="SESAU" />
          </div>
          <div className="field" style={{ flex: '0 1 200px', margin: 0 }}>
            <label className="field-label">Unidade Externa</label>
            <select className="input" value={fEntidade} onChange={e => setFEntidade(e.target.value)}>
              <option value="">Todas</option>
              {entidades.map(e => <option key={e.codigo} value={String(e.codigo)}>{e.nome}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer', paddingBottom: 2 }}>
            <input type="checkbox" checked={fProtocolo} onChange={e => setFProtocolo(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
            Protocolo Central
          </label>
          <button type="submit" className="btn btn-primary btn-sm" style={{ paddingBottom: 2 }}>
            <IconSearch size={13} /> Pesquisar
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Unidades {total > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>[{total}]</span>}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <IconPlus size={13} /> Nova unidade
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 20px', color: 'var(--danger-500)', fontSize: 13, borderBottom: '1px solid var(--border)' }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Sigla</th>
                <th>Nome</th>
                <th style={{ width: 80, textAlign: 'center' }}>Status</th>
                <th style={{ width: 220 }}>Unidade Superior</th>
                <th style={{ width: 100, textAlign: 'center' }}>Protocolo Central</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {[80, undefined, 80, 220, 100, 50].map((w, j) => (
                      <td key={j} style={{ width: w }}>
                        <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">Nenhuma unidade encontrada.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.codigo}>
                    <td><b style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{row.sigla ?? '—'}</b></td>
                    <td>{row.nome ?? '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {row.flagAtivo !== '0'
                        ? <span className="badge badge-success">ATIVO</span>
                        : <span className="badge badge-neutral">INATIVO</span>}
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>
                      {unidadeLabel(allUnidades, row.codigoPai)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.flagProtocoloCentral === '1'
                        ? <span className="badge badge-info">Sim</span>
                        : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <RowMenu row={row} onEdit={openEdit} onDelete={openDelete} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={goToPage} />
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        title={dialogMode === 'create' ? 'Nova unidade administrativa' : 'Editar unidade administrativa'}
        onClose={closeDialog}
      >
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div className="field">
              <label className="field-label">Nome <span style={{ color: 'var(--danger-500)' }}>*</span></label>
              <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Secretaria Municipal de Saúde" required autoFocus />
            </div>
            <div className="field">
              <label className="field-label">Sigla <span style={{ color: 'var(--danger-500)' }}>*</span></label>
              <input className="input" value={form.sigla} onChange={e => set('sigla', e.target.value.toUpperCase())} placeholder="SESAU" required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
              Ativo
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.protocoloCentral} onChange={e => set('protocoloCentral', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
              Protocolo Central
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.recebeDocExterno} onChange={e => set('recebeDocExterno', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
              Recebe Documento Externo
            </label>
          </div>

          <div className="field">
            <label className="field-label">Unidade Superior</label>
            <select className="input" value={form.codigoPai} onChange={e => set('codigoPai', e.target.value)}>
              <option value="">— nenhuma —</option>
              {allUnidades
                .filter(u => u.codigo !== selected?.codigo)
                .map(u => <option key={u.codigo} value={String(u.codigo)}>{u.sigla ? `${u.sigla} — ` : ''}{u.nome}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field-label">Unidade Externa</label>
              <select className="input" value={form.codigoEntidadeExterna} onChange={e => set('codigoEntidadeExterna', e.target.value)}>
                <option value="">Selecione uma unidade Externa</option>
                {entidades.map(e => <option key={e.codigo} value={String(e.codigo)}>{e.nome}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">Hierarquia</label>
              <select className="input" value={form.codigoHierarquia} onChange={e => set('codigoHierarquia', e.target.value)}>
                <option value="">— nenhuma —</option>
                {hierarquias.map(h => <option key={h.codigo} value={String(h.codigo)}>{h.nome}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={closeDialog} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={dialogMode === 'delete'} title="Excluir unidade" onClose={closeDialog}>
        <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--text-2)' }}>
          Confirma a exclusão de <b>{selected?.nome}</b>? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={closeDialog} disabled={saving}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
