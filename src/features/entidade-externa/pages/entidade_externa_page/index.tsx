import { FormEvent, useState, useEffect, useRef } from 'react';

import { Dialog } from '../../../../infra/components/dialog';
import { Pagination } from '../../../../infra/components/pagination';
import { useEntidadeExternaViewModel } from '../../use_entidade-externa.view-model';
import { EntidadeExterna } from '../../models/entidade-externa.model';
import { TipoEntidadeExterna } from '../../../tipo-entidade-externa/models/tipo-entidade-externa.model';

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

function RowMenu({ row, onEdit, onDelete }: {
  row: EntidadeExterna;
  onEdit: (r: EntidadeExterna) => void;
  onDelete: (r: EntidadeExterna) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}>
        <IconMore size={14} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          minWidth: 140, padding: '4px 0',
        }}>
          <button onClick={() => { onEdit(row); setOpen(false); }} style={{
            display: 'block', width: '100%', padding: '8px 14px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontSize: 13.5, color: 'var(--text)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            Editar
          </button>
          <button onClick={() => { onDelete(row); setOpen(false); }} style={{
            display: 'block', width: '100%', padding: '8px 14px',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', fontSize: 13.5, color: 'var(--danger-500)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

function tipoLabel(tipos: TipoEntidadeExterna[], codigoTipo: string | null): string {
  if (!codigoTipo) return '—';
  const t = tipos.find(t => String(t.codigo) === String(codigoTipo));
  return t?.nome ?? codigoTipo;
}

interface FormState {
  nome: string;
  sigla: string;
  codigoTipo: string;
  endereco: string;
  fone: string;
  email: string;
  tramitaNetdoc: boolean;
}

function emptyForm(): FormState {
  return { nome: '', sigla: '', codigoTipo: '', endereco: '', fone: '', email: '', tramitaNetdoc: false };
}

function formFromEntity(e: EntidadeExterna): FormState {
  return {
    nome: e.nome ?? '',
    sigla: e.sigla ?? '',
    codigoTipo: e.codigoTipo ?? '',
    endereco: e.endereco ?? '',
    fone: e.fone ?? '',
    email: e.email ?? '',
    tramitaNetdoc: e.flagTramitaNetdoc === '1',
  };
}

export function EntidadeExternaPage() {
  const {
    data, tipos, loading, saving, error,
    page, totalPages, total, limit, goToPage,
    dialogMode, selected,
    openCreate, openEdit, openDelete, closeDialog,
    handleCreate, handleUpdate, handleDelete,
  } = useEntidadeExternaViewModel();

  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (dialogMode === 'edit' && selected) setForm(formFromEntity(selected));
    else if (dialogMode === 'create') setForm(emptyForm());
  }, [dialogMode, selected]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      sigla: form.sigla,
      codigoTipo: form.codigoTipo || undefined,
      endereco: form.endereco || undefined,
      fone: form.fone || undefined,
      email: form.email || undefined,
      tramitaNetdoc: form.tramitaNetdoc,
    };
    if (dialogMode === 'create') await handleCreate(payload);
    else if (dialogMode === 'edit') await handleUpdate(payload);
  }

  return (
    <div className="content-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Entidades Externas</h1>
          <p className="page-subtitle">Órgãos e entidades que interagem com o sistema</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Entidades {total > 0 && <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>[{total}]</span>}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <IconPlus size={13} /> Nova entidade
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
                <th style={{ width: 140 }}>Fone</th>
                <th style={{ width: 200 }}>Email</th>
                <th style={{ width: 160 }}>Tipo</th>
                <th style={{ width: 110, textAlign: 'center' }}>Tramita Netdoc</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {[80, undefined, 140, 200, 160, 110, 50].map((w, j) => (
                      <td key={j} style={{ width: w }}>
                        <div style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">Nenhuma entidade cadastrada.</td>
                </tr>
              ) : (
                data.map(row => (
                  <tr key={row.codigo}>
                    <td><b style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5 }}>{row.sigla ?? '—'}</b></td>
                    <td>{row.nome ?? '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{row.fone ?? '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{row.email ?? '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{tipoLabel(tipos, row.codigoTipo)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {row.flagTramitaNetdoc === '1'
                        ? <span className="badge badge-success">Sim</span>
                        : <span className="badge badge-neutral">Não</span>}
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

      {/* Create / Edit */}
      <Dialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        title={dialogMode === 'create' ? 'Nova entidade externa' : 'Editar entidade externa'}
        onClose={closeDialog}
      >
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div className="field">
              <label className="field-label">Nome <span style={{ color: 'var(--danger-500)' }}>*</span></label>
              <input
                className="input"
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder="Ex: Prefeitura Municipal"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label className="field-label">Sigla <span style={{ color: 'var(--danger-500)' }}>*</span></label>
              <input
                className="input"
                value={form.sigla}
                onChange={e => set('sigla', e.target.value.toUpperCase())}
                placeholder="EX: PMG"
                required
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Tipo de Entidade</label>
            <select
              className="input"
              value={form.codigoTipo}
              onChange={e => set('codigoTipo', e.target.value)}
            >
              <option value="">Selecione um Tipo</option>
              {tipos.map(t => (
                <option key={t.codigo} value={String(t.codigo)}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Endereço</label>
            <input
              className="input"
              value={form.endereco}
              onChange={e => set('endereco', e.target.value)}
              placeholder="Rua, número, bairro"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label className="field-label">Fone</label>
              <input
                className="input"
                value={form.fone}
                onChange={e => set('fone', e.target.value)}
                placeholder="(87) 3762-3087"
              />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="contato@exemplo.gov.br"
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5 }}>
            <input
              type="checkbox"
              checked={form.tramitaNetdoc}
              onChange={e => set('tramitaNetdoc', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
            />
            Tramita Netdoc
          </label>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={closeDialog} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={dialogMode === 'delete'} title="Excluir entidade" onClose={closeDialog}>
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
